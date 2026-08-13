import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSessionContext } from "@/lib/auth/session";
import { getTenantPriceLists } from "@/lib/data";
import { normalizeProductRecord } from "@/lib/products/records";
import { productWithVariantsAndPricesSelect } from "@/lib/products/queries";
import { normalizeCode } from "@/lib/products/stock-import-matching";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { chunkArray } from "@/lib/utils";
import { stockImportApplyRequestSchema, type StockImportApplyRowInput } from "@/lib/validators/stock-import";

const ID_CHUNK_SIZE = 200;
const UPSERT_CHUNK_SIZE = 500;
const SKU_REPAIR_CONCURRENCY = 20;

async function fetchAllTenantProductIds(supabase: SupabaseClient, tenantId: string) {
  const ids: string[] = [];
  const PAGE_SIZE = 1000;

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("tenant_id", tenantId)
      .range(from, from + PAGE_SIZE - 1);

    const page = data ?? [];
    ids.push(...page.map((row) => row.id as string));
    if (page.length < PAGE_SIZE) break;
  }

  return ids;
}

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;

  if (tenant.business_type !== "market") {
    return NextResponse.json(
      { error: "Bu özellik sadece market tipi hesaplar için kullanılabilir." },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = stockImportApplyRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz istek." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  // Aynı ürüne iki farklı satır eşleştirilmiş olabilir (ör. aynı barkod
  // dosyada iki kez geçtiyse) — upsert'te aynı çakışma anahtarını iki kez
  // göndermek Postgres hatası verir, bu yüzden son satır kazanır.
  const dedupedByProductId = new Map<string, StockImportApplyRowInput>();
  for (const update of parsed.data.updates) {
    dedupedByProductId.set(update.productId, update);
  }

  // product_prices tablosunda tenant_id yok ve admin client RLS'i bypass
  // ediyor — bu yüzden productId/priceListId'nin gerçekten bu tenant'a ait
  // olduğu burada ayrıca doğrulanıyor; ait olmayanlar sessizce atlanıyor.
  const [tenantProductIds, tenantPriceLists] = await Promise.all([
    fetchAllTenantProductIds(supabase, tenant.id),
    getTenantPriceLists(tenant.id),
  ]);
  const tenantProductIdSet = new Set(tenantProductIds);
  const tenantPriceListIdSet = new Set(tenantPriceLists.map((list) => list.id));

  const validUpdates = [...dedupedByProductId.values()].filter(
    (update) => tenantProductIdSet.has(update.productId) && tenantPriceListIdSet.has(update.priceListId),
  );
  const skippedInvalidCount = dedupedByProductId.size - validUpdates.length;

  if (!validUpdates.length) {
    return NextResponse.json(
      { error: "Uygulanacak geçerli satır kalmadı." },
      { status: 400 },
    );
  }

  const validProductIds = validUpdates.map((update) => update.productId);

  for (const idsChunk of chunkArray(validProductIds, ID_CHUNK_SIZE)) {
    const { error: stockError } = await supabase
      .from("products")
      .update({ is_in_stock: true })
      .eq("tenant_id", tenant.id)
      .in("id", idsChunk);

    if (stockError) {
      return NextResponse.json({ error: stockError.message }, { status: 400 });
    }
  }

  const priceRows = validUpdates.map((update) => ({
    product_id: update.productId,
    price_list_id: update.priceListId,
    price: update.price,
  }));

  for (const batch of chunkArray(priceRows, UPSERT_CHUNK_SIZE)) {
    const { error: priceError } = await supabase
      .from("product_prices")
      .upsert(batch, { onConflict: "product_id,price_list_id" });

    if (priceError) {
      return NextResponse.json({ error: priceError.message }, { status: 400 });
    }
  }

  // Ürün barkodla değil isimle/manuel eşleştirildiyse (ör. mevcut ürünün
  // sku_code'u gerçek barkod değil de başka bir kaynaktan gelen kod ise —
  // bkz. market katalog crawler'ının sku_code'u görsel URL'sinden türetmesi),
  // burada ürünün sku_code'unu dosyadaki gerçek barkoda düzeltiyoruz. Böylece
  // bir sonraki stok listesi yüklemesinde bu ürün doğrudan barkodla (tier 1)
  // eşleşir, tekrar isimle uğraşmaya gerek kalmaz — kendi kendini onaran bir
  // döngü. Aynı barkodu tenant içinde başka bir ürün zaten kullanıyorsa
  // (unique(tenant_id, sku_code) çakışması) o satır sessizce atlanır.
  const barcodeByProductId = new Map<string, string>();
  for (const update of validUpdates) {
    if (update.barcode) {
      barcodeByProductId.set(update.productId, normalizeCode(update.barcode));
    }
  }

  if (barcodeByProductId.size) {
    const productIdsNeedingCheck = [...barcodeByProductId.keys()];
    const currentSkuByProductId = new Map<string, string>();

    for (const idsChunk of chunkArray(productIdsNeedingCheck, ID_CHUNK_SIZE)) {
      const { data } = await supabase
        .from("products")
        .select("id, sku_code")
        .eq("tenant_id", tenant.id)
        .in("id", idsChunk);

      for (const row of data ?? []) {
        currentSkuByProductId.set(row.id as string, row.sku_code as string);
      }
    }

    const candidateBarcodes = [...new Set(barcodeByProductId.values())];
    const ownerProductIdByBarcode = new Map<string, string>();

    for (const batch of chunkArray(candidateBarcodes, ID_CHUNK_SIZE)) {
      const { data } = await supabase
        .from("products")
        .select("id, sku_code")
        .eq("tenant_id", tenant.id)
        .in("sku_code", batch);

      for (const row of data ?? []) {
        ownerProductIdByBarcode.set(row.sku_code as string, row.id as string);
      }
    }

    const skuUpdates = [...barcodeByProductId.entries()].filter(([productId, barcode]) => {
      if (currentSkuByProductId.get(productId) === barcode) {
        return false;
      }
      const owner = ownerProductIdByBarcode.get(barcode);
      return !owner || owner === productId;
    });

    for (const chunk of chunkArray(skuUpdates, SKU_REPAIR_CONCURRENCY)) {
      await Promise.all(
        chunk.map(([productId, barcode]) =>
          supabase
            .from("products")
            .update({ sku_code: barcode })
            .eq("id", productId)
            .eq("tenant_id", tenant.id),
        ),
      );
    }
  }

  const updatedProducts: Array<Record<string, unknown>> = [];
  for (const idsChunk of chunkArray(validProductIds, ID_CHUNK_SIZE)) {
    const { data, error: fetchError } = await supabase
      .from("products")
      .select(productWithVariantsAndPricesSelect)
      .eq("tenant_id", tenant.id)
      .in("id", idsChunk);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    updatedProducts.push(...((data as Array<Record<string, unknown>> | null) ?? []));
  }

  return NextResponse.json({
    updatedCount: validUpdates.length,
    skippedInvalidCount,
    updatedProducts: updatedProducts.map((product) => normalizeProductRecord(product)),
  });
}
