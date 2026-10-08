import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import {
  bizimhesapCustomerLinkKey,
  fetchBizimHesapCustomers,
  fetchBizimHesapProducts,
  resolveBizimHesapPolicy,
} from "@/lib/integrations/bizimhesap";
import { autoMatch, buildBizimHesapIndex, type BizimHesapProduct } from "@/lib/integrations/bizimhesap-matching";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse, ensureTenantPlanFeatureResponse } from "@/lib/tenancy/guards";

// Sipariş onay penceresi (0167, Lucatech): BizimHesap carileri ve ürünleri her
// açılışta CANLI çekilir (yeni açılan cari/ürün hemen görünür). GET: liste +
// sipariş satırlarının eşleşme durumu; PUT: seçilen cari ve satır eşleşmeleri.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type OrderItem = {
  product_id?: string | null;
  variant_id?: string | null;
  product_name?: string | null;
  variant_name?: string | null;
  sku_code?: string | null;
  quantity?: number | null;
  is_gift?: boolean | null;
};

const productLabel = (p: BizimHesapProduct) => [p.code, p.title, p.variantName].filter(Boolean).join(" · ");

async function loadContext(orderId: string) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return { error: guard };
  const planGuard = await ensureTenantPlanFeatureResponse("bizimhesap");
  if (planGuard) return { error: planGuard };
  const session = await getSessionContext();
  const tenantId = session.tenant!.id;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { error: NextResponse.json({ error: "Veritabanı yapılandırması eksik." }, { status: 500 }) };
  const { data: config } = await supabase
    .from("tenant_bizimhesap")
    .select("firm_id, is_enabled, send_on, fixed_customer_title, require_product_match")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!config?.firm_id || !config.is_enabled) {
    return { error: NextResponse.json({ error: "BizimHesap bağlantısı kapalı." }, { status: 400 }) };
  }
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, items, access_code_id, customer_name, customer_phone, bizimhesap_customer_id, bizimhesap_guid")
    .eq("tenant_id", tenantId)
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { error: NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 }) };
  return { supabase, tenantId, firmId: config.firm_id as string, policy: resolveBizimHesapPolicy(tenantId, config), order };
}

export async function GET(_request: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const c = await loadContext(orderId);
  if ("error" in c) return c.error;

  const [customers, bhProducts] = await Promise.all([fetchBizimHesapCustomers(c.firmId), fetchBizimHesapProducts(c.firmId)]);
  if (!customers || !bhProducts) {
    return NextResponse.json({ error: "BizimHesap listesi alınamadı; birazdan tekrar deneyin." }, { status: 502 });
  }
  const active = bhProducts.filter((p) => p.isActive);
  const byId = new Map(active.map((p) => [p.id, p]));
  const index = buildBizimHesapIndex(active);

  const items = ((Array.isArray(c.order.items) ? c.order.items : []) as OrderItem[]).filter((item) => item.product_id);
  const productIds = [...new Set(items.map((i) => i.product_id!))];
  const variantIds = [...new Set(items.map((i) => i.variant_id).filter((v): v is string => Boolean(v)))];
  const [{ data: products }, { data: variants }] = await Promise.all([
    c.supabase.from("products").select("id, sku_code, image_url, bizimhesap_product_id").in("id", productIds.length ? productIds : ["00000000-0000-0000-0000-000000000000"]),
    c.supabase.from("product_variants").select("id, bizimhesap_product_id").in("id", variantIds.length ? variantIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);
  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));

  const lines = items.map((item, index_) => {
    const product = productMap.get(item.product_id!);
    const variant = item.variant_id ? variantMap.get(item.variant_id) : undefined;
    const mappedId = variant?.bizimhesap_product_id ?? product?.bizimhesap_product_id ?? null;
    const mapped = mappedId ? byId.get(mappedId) : undefined;
    const code = item.sku_code ?? product?.sku_code ?? null;
    const suggestion = mapped
      ? null
      : autoMatch(index, { code, name: item.product_name ?? "", variantName: item.variant_name ?? null }) ??
        (item.variant_id ? null : autoMatch(index, { code, name: item.product_name ?? "" }));
    return {
      key: `${index_}`,
      // Varyant satırı varyanta, düz ürün ürüne eşlenir.
      kind: item.variant_id ? ("variant" as const) : ("product" as const),
      id: item.variant_id ?? item.product_id!,
      code,
      name: item.product_name ?? "Ürün",
      variantName: item.variant_name ?? null,
      quantity: Number(item.quantity ?? 0),
      isGift: Boolean(item.is_gift),
      imageUrl: product?.image_url ?? null,
      mappedId: mapped ? mappedId : null,
      mappedLabel: mapped ? productLabel(mapped) : null,
      // Eşleşme kaydı var ama BizimHesap'ta kart artık yok (silinmiş).
      missingMapped: Boolean(mappedId && !mapped),
      suggestion: suggestion ? { id: suggestion.id, label: productLabel(suggestion) } : null,
    };
  });

  // Cari: bu siparişte seçilmiş olan, yoksa bayi hafızası.
  let selectedCustomerId: string | null = c.order.bizimhesap_customer_id ?? null;
  if (!selectedCustomerId) {
    const key = bizimhesapCustomerLinkKey(c.order);
    if (key) {
      const { data: link } = await c.supabase
        .from("bizimhesap_customer_links")
        .select("bh_customer_id")
        .eq("tenant_id", c.tenantId)
        .eq("link_key", key)
        .maybeSingle();
      selectedCustomerId = link?.bh_customer_id ?? null;
    }
  }
  if (selectedCustomerId && !customers.some((cu) => String(cu.id) === String(selectedCustomerId))) selectedCustomerId = null;

  return NextResponse.json({
    customers: customers.map((cu) => ({
      id: String(cu.id),
      title: cu.title ?? "",
      code: (cu as { code?: string | null }).code ?? null,
      phone: cu.phone ?? null,
    })),
    products: active.map((p) => ({ id: p.id, code: p.code, barcode: p.barcode, title: p.title, variantName: p.variantName, label: productLabel(p) })),
    lines,
    selectedCustomerId,
    fallbackCustomerTitle: c.policy.fixedCustomerTitle,
    requireProductMatch: c.policy.requireProductMatch,
    alreadySent: Boolean(c.order.bizimhesap_guid),
  });
}

export async function PUT(request: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const c = await loadContext(orderId);
  if ("error" in c) return c.error;
  const body = (await request.json().catch(() => null)) as {
    customerId?: unknown;
    lines?: Array<{ kind?: unknown; id?: unknown; bizimhesapProductId?: unknown }>;
  } | null;

  const customerId = typeof body?.customerId === "string" && body.customerId.trim() ? body.customerId.trim() : null;
  let customerTitle: string | null = null;
  if (customerId) {
    const customers = await fetchBizimHesapCustomers(c.firmId);
    const found = customers?.find((cu) => String(cu.id) === customerId);
    if (!found) return NextResponse.json({ error: "Seçilen cari BizimHesap'ta bulunamadı; listeyi yenileyin." }, { status: 400 });
    customerTitle = found.title ?? null;
  }

  // Satır eşleşmeleri: yalnız bu siparişteki ürün/varyantlar güncellenebilir.
  const items = (Array.isArray(c.order.items) ? c.order.items : []) as OrderItem[];
  const allowedProducts = new Set(items.map((i) => i.product_id).filter(Boolean) as string[]);
  const allowedVariants = new Set(items.map((i) => i.variant_id).filter(Boolean) as string[]);
  for (const line of body?.lines ?? []) {
    const kind = line.kind === "variant" ? "variant" : line.kind === "product" ? "product" : null;
    const id = typeof line.id === "string" ? line.id : "";
    const value = typeof line.bizimhesapProductId === "string" && line.bizimhesapProductId ? line.bizimhesapProductId : null;
    if (!kind || !id || !value) continue;
    if (kind === "variant" ? !allowedVariants.has(id) : !allowedProducts.has(id)) continue;
    await c.supabase
      .from(kind === "variant" ? "product_variants" : "products")
      .update({ bizimhesap_product_id: value })
      .eq("tenant_id", c.tenantId)
      .eq("id", id);
  }

  await c.supabase
    .from("orders")
    .update({ bizimhesap_customer_id: customerId, bizimhesap_customer_title: customerTitle })
    .eq("tenant_id", c.tenantId)
    .eq("id", orderId);

  const key = bizimhesapCustomerLinkKey(c.order);
  if (key && customerId) {
    await c.supabase.from("bizimhesap_customer_links").upsert(
      { tenant_id: c.tenantId, link_key: key, bh_customer_id: customerId, bh_customer_title: customerTitle, updated_at: new Date().toISOString() },
      { onConflict: "tenant_id,link_key" },
    );
  }

  return NextResponse.json({ ok: true });
}
