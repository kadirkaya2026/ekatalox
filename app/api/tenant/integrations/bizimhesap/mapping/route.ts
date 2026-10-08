import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { fetchBizimHesapProducts } from "@/lib/integrations/bizimhesap";
import { autoMatch, buildBizimHesapIndex, type BizimHesapProduct } from "@/lib/integrations/bizimhesap-matching";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse, ensureTenantPlanFeatureResponse } from "@/lib/tenancy/guards";

// Ürünler > BizimHesap Eşleştirme (0166, Lucatech): eKatalox ürün/varyantı ↔
// BizimHesap stok kartı. Eşleşme products/product_variants.bizimhesap_product_id'de.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ProductRow = { id: string; sku_code: string | null; product_name: string; image_url: string | null; bizimhesap_product_id: string | null };
type MappingItem = {
  kind: "product" | "variant";
  id: string;
  productId: string;
  code: string | null;
  name: string;
  imageUrl: string | null;
  variantName: string | null;
  mappedId: string | null;
  mappedLabel: string | null;
  inheritedLabel: string | null;
  suggestion: { id: string; label: string } | null;
  /** Eşleşme var ama kart BizimHesap'ta yok (silinmiş) — yeniden seçilmeli. */
  cardMissing: boolean;
  /** Kart var ama "Ürün Kodu" boş — BizimHesap ürünü koddan tanır, gönderilemez. */
  codeMissing: boolean;
  /** Aynı BizimHesap kartı FARKLI stok kodlu başka ürün(ler)e de bağlı. */
  sharedWith: string[];
};
type VariantRow = { id: string; product_id: string; model_name: string | null; bizimhesap_product_id: string | null };

async function loadContext() {
  const guard = await ensureTenantAdminResponse();
  if (guard) return { error: guard };
  const planGuard = await ensureTenantPlanFeatureResponse("bizimhesap");
  if (planGuard) return { error: planGuard };
  const session = await getSessionContext();
  const tenantId = session.tenant!.id;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { error: NextResponse.json({ error: "Veritabanı yapılandırması eksik." }, { status: 500 }) };
  const { data: config } = await supabase.from("tenant_bizimhesap").select("firm_id").eq("tenant_id", tenantId).maybeSingle();
  if (!config?.firm_id) {
    return { error: NextResponse.json({ error: "Önce Ayarlar > BizimHesap'tan bağlantıyı kurun." }, { status: 400 }) };
  }
  return { supabase, tenantId, firmId: config.firm_id as string };
}

async function loadCatalog(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseAdminClient>>>, tenantId: string) {
  const products: ProductRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase
      .from("products")
      .select("id, sku_code, product_name, image_url, bizimhesap_product_id")
      .eq("tenant_id", tenantId)
      .order("sku_code", { ascending: true })
      .range(from, from + 999);
    products.push(...((data ?? []) as ProductRow[]));
    if (!data || data.length < 1000) break;
  }
  const variants: VariantRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase
      .from("product_variants")
      .select("id, product_id, model_name, bizimhesap_product_id")
      .eq("tenant_id", tenantId)
      .order("display_order", { ascending: true })
      .range(from, from + 999);
    variants.push(...((data ?? []) as VariantRow[]));
    if (!data || data.length < 1000) break;
  }
  return { products, variants };
}

function label(product: BizimHesapProduct) {
  return [product.code, product.title, product.variantName].filter(Boolean).join(" · ");
}

export async function GET() {
  const ctx = await loadContext();
  if ("error" in ctx) return ctx.error;
  const bh = await fetchBizimHesapProducts(ctx.firmId);
  if (!bh) return NextResponse.json({ error: "BizimHesap ürün listesi alınamadı." }, { status: 502 });
  const index = buildBizimHesapIndex(bh);
  const byId = new Map(bh.map((p) => [p.id, p]));
  const { products, variants } = await loadCatalog(ctx.supabase, ctx.tenantId);
  const variantsByProduct = new Map<string, VariantRow[]>();
  for (const variant of variants) {
    const list = variantsByProduct.get(variant.product_id) ?? [];
    list.push(variant);
    variantsByProduct.set(variant.product_id, list);
  }

  const items = products.flatMap((product): MappingItem[] => {
    const own = variantsByProduct.get(product.id) ?? [];
    const base = { productId: product.id, code: product.sku_code, name: product.product_name, imageUrl: product.image_url };
    const productMapped = product.bizimhesap_product_id ? byId.get(product.bizimhesap_product_id) : undefined;
    if (!own.length) {
      const suggestion = productMapped ? null : autoMatch(index, { code: product.sku_code, name: product.product_name });
      return [
        {
          ...base,
          kind: "product",
          id: product.id,
          variantName: null,
          mappedId: product.bizimhesap_product_id,
          mappedLabel: productMapped ? label(productMapped) : product.bizimhesap_product_id ? "BizimHesap'ta bulunamadı" : null,
          inheritedLabel: null,
          cardMissing: false,
          codeMissing: false,
          sharedWith: [],
          suggestion: suggestion ? { id: suggestion.id, label: label(suggestion) } : null,
        },
      ];
    }
    return own.map((variant): MappingItem => {
      const mapped = variant.bizimhesap_product_id ? byId.get(variant.bizimhesap_product_id) : undefined;
      const suggestion = mapped
        ? null
        : autoMatch(index, { code: product.sku_code, name: product.product_name, variantName: variant.model_name });
      return {
        ...base,
        kind: "variant",
        id: variant.id,
        variantName: variant.model_name,
        mappedId: variant.bizimhesap_product_id,
        mappedLabel: mapped ? label(mapped) : variant.bizimhesap_product_id ? "BizimHesap'ta bulunamadı" : null,
        // Varyant eşlenmemiş ama ürün tek karta eşliyse sipariş o karta gider.
        inheritedLabel: !variant.bizimhesap_product_id && productMapped ? label(productMapped) : null,
        cardMissing: false,
        codeMissing: false,
        sharedWith: [],
        suggestion: suggestion ? { id: suggestion.id, label: label(suggestion) } : null,
      };
    });
  });

  // Bayraklar: silinmiş kart, kodsuz kart, aynı karta bağlı farklı ürünler.
  const ownersByCard = new Map<string, Set<string>>();
  for (const item of items) {
    if (!item.mappedId) continue;
    const owners = ownersByCard.get(item.mappedId) ?? new Set<string>();
    owners.add([item.code ?? item.name, item.variantName].filter(Boolean).join(" "));
    ownersByCard.set(item.mappedId, owners);
  }
  const codesByCard = new Map<string, Set<string>>();
  for (const item of items) {
    if (!item.mappedId) continue;
    const codes = codesByCard.get(item.mappedId) ?? new Set<string>();
    codes.add((item.code ?? "").trim().toLocaleLowerCase("tr"));
    codesByCard.set(item.mappedId, codes);
  }
  for (const item of items) {
    const card = item.mappedId ? byId.get(item.mappedId) : undefined;
    item.cardMissing = Boolean(item.mappedId && !card);
    item.codeMissing = Boolean(card && !card.code?.trim());
    const ownCode = [item.code ?? item.name, item.variantName].filter(Boolean).join(" ");
    // Aynı ürünün renkleri tek kartta olabilir (aynı stok kodu) — yalnız farklı kodlar uyarılır.
    item.sharedWith =
      item.mappedId && (codesByCard.get(item.mappedId)?.size ?? 0) > 1
        ? [...(ownersByCard.get(item.mappedId) ?? [])].filter((owner) => owner !== ownCode)
        : [];
  }
  const mappedCardIds = new Set(items.map((i) => i.mappedId).filter((id): id is string => Boolean(id && byId.get(id))));
  const codedCards = [...mappedCardIds].filter((id) => byId.get(id)?.code?.trim()).length;

  return NextResponse.json({
    cardStats: { mappedCards: mappedCardIds.size, codedCards },
    bhProducts: bh.filter((p) => p.isActive).map((p) => ({ id: p.id, code: p.code, barcode: p.barcode, title: p.title, variantName: p.variantName, label: label(p) })),
    items,
  });
}

// Tek satır eşleştirme / kaldırma.
export async function PATCH(request: Request) {
  const ctx = await loadContext();
  if ("error" in ctx) return ctx.error;
  const body = (await request.json().catch(() => null)) as { kind?: unknown; id?: unknown; bizimhesapProductId?: unknown } | null;
  const kind = body?.kind === "variant" ? "variant" : body?.kind === "product" ? "product" : null;
  const id = typeof body?.id === "string" ? body.id : "";
  const value = typeof body?.bizimhesapProductId === "string" && body.bizimhesapProductId.trim() ? body.bizimhesapProductId.trim() : null;
  if (!kind || !id) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const { error } = await ctx.supabase
    .from(kind === "variant" ? "product_variants" : "products")
    .update({ bizimhesap_product_id: value })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id);
  if (error) return NextResponse.json({ error: "Kaydedilemedi." }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// "Önerileri uygula": eşleşmemiş tüm satırlara tek ve kesin adayı yazar.
export async function POST() {
  const ctx = await loadContext();
  if ("error" in ctx) return ctx.error;
  const bh = await fetchBizimHesapProducts(ctx.firmId);
  if (!bh) return NextResponse.json({ error: "BizimHesap ürün listesi alınamadı." }, { status: 502 });
  const index = buildBizimHesapIndex(bh);
  const { products, variants } = await loadCatalog(ctx.supabase, ctx.tenantId);
  const productById = new Map(products.map((p) => [p.id, p]));
  const withVariants = new Set(variants.map((v) => v.product_id));
  let applied = 0;
  for (const product of products) {
    if (product.bizimhesap_product_id || withVariants.has(product.id)) continue;
    const match = autoMatch(index, { code: product.sku_code, name: product.product_name });
    if (!match) continue;
    await ctx.supabase.from("products").update({ bizimhesap_product_id: match.id }).eq("id", product.id).eq("tenant_id", ctx.tenantId);
    applied += 1;
  }
  for (const variant of variants) {
    if (variant.bizimhesap_product_id) continue;
    const product = productById.get(variant.product_id);
    if (!product) continue;
    const match = autoMatch(index, { code: product.sku_code, name: product.product_name, variantName: variant.model_name });
    if (!match) continue;
    await ctx.supabase.from("product_variants").update({ bizimhesap_product_id: match.id }).eq("id", variant.id).eq("tenant_id", ctx.tenantId);
    applied += 1;
  }
  return NextResponse.json({ applied });
}
