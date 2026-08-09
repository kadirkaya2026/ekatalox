import { NextResponse } from "next/server";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { ensureDefaultPriceListsForTenant } from "@/lib/price-lists/data";
import { getPricedLists } from "@/lib/price-lists/records";
import { compactProductDisplayOrder } from "@/lib/products/reorder";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { getEffectiveProductLimit } from "@/lib/billing/plans";
import { chunkArray } from "@/lib/utils";
import { resolveCategoryPath } from "@/lib/market-catalog/category-taxonomy";
import {
  buildCategoryCache,
  ensureCategoryPath,
  normalizeCategoryName,
} from "@/lib/categories/ensure-hierarchy";
import type { SupabaseClient } from "@supabase/supabase-js";

// PostgREST caps a single request's URL (and thus an .in() filter's value
// list) well below what a few thousand selected sku_codes need — a bulk
// import from the (now 5000+ row) market catalog was blowing past that and
// coming back as a bare "Bad Request". Chunking keeps each request small.
const CATALOG_LOOKUP_CHUNK_SIZE = 300;
const UPSERT_CHUNK_SIZE = 500;

async function fetchCatalogRowsBySku(supabase: SupabaseClient, skuCodes: string[]) {
  const rows: Array<{
    sku_code: string;
    product_name: string;
    category_name: string;
    image_url: string;
    reference_price: number | null;
    description: string | null;
  }> = [];

  for (const batch of chunkArray(skuCodes, CATALOG_LOOKUP_CHUNK_SIZE)) {
    const { data, error } = await supabase
      .from("market_catalog_products")
      .select("sku_code, product_name, category_name, image_url, reference_price, description")
      .in("sku_code", batch);

    if (error) {
      throw error;
    }

    rows.push(...(data ?? []));
  }

  return rows;
}

// Same db-max-rows ceiling applies to plain selects — a tenant sitting above
// 1000 products (the 5000-product plans allow that) would otherwise only see
// its first 1000 rows here, undercounting existingSkuSet and letting the
// product-limit check pass when it shouldn't.
async function fetchAllTenantProducts(supabase: SupabaseClient, tenantId: string) {
  const rows: Array<{ sku_code: string; display_order: number }> = [];
  const PAGE_SIZE = 1000;

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data } = await supabase
      .from("products")
      .select("sku_code, display_order")
      .eq("tenant_id", tenantId)
      .range(from, from + PAGE_SIZE - 1);

    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
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

  const body = await request.json();
  const skuCodes: string[] = Array.isArray(body.sku_codes)
    ? (body.sku_codes as unknown[]).filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      )
    : [];

  if (!skuCodes.length) {
    return NextResponse.json({ error: "Aktarılacak ürün seçilmedi." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase production yapılandırması eksik." },
      { status: 500 },
    );
  }

  let catalog: Array<{
    sku_code: string;
    product_name: string;
    category_name: string;
    image_url: string;
    reference_price: number | null;
    description: string | null;
  }>;

  try {
    catalog = await fetchCatalogRowsBySku(supabase, skuCodes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Katalog sorgusu başarısız oldu.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const referencePriceBySku = new Map(
    catalog.map((row) => [row.sku_code, row.reference_price]),
  );

  if (!catalog.length) {
    return NextResponse.json(
      { error: "Seçilen ürünler master katalogda bulunamadı." },
      { status: 400 },
    );
  }

  // Önceki silmelerden kalan display_order boşluklarını kapatmadan
  // "en yüksek sıra + 1"den devam edersek yeni ürünler gerçek sayıdan çok
  // daha yüksek bir sıra numarasıyla başlar (ör. 60'tan başlaması gibi).
  await compactProductDisplayOrder(supabase, tenant.id);

  const existingProducts = await fetchAllTenantProducts(supabase, tenant.id);
  const existingSkuSet = new Set(existingProducts.map((row) => row.sku_code));

  const newSkuCount = catalog.filter((row) => !existingSkuSet.has(row.sku_code)).length;
  const effectiveLimit = getEffectiveProductLimit(tenant.plan, tenant.product_limit_addon);

  if (existingSkuSet.size + newSkuCount > effectiveLimit) {
    return NextResponse.json(
      { error: "Seçilen ürünler ürün limitinizi aşıyor. Daha az ürün seçin veya paketinizi yükseltin." },
      { status: 400 },
    );
  }

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("id, name, parent_id")
    .eq("tenant_id", tenant.id);
  const { data: lastCategory } = await supabase
    .from("categories")
    .select("display_order")
    .eq("tenant_id", tenant.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextCategoryDisplayOrder = { value: (lastCategory?.display_order ?? 0) + 1 };

  const categoryCache = buildCategoryCache(
    (categoryRows as Array<{ id: string; name: string; parent_id: string | null }> | null) ?? [],
  );

  const uniqueCategoryNames = [...new Set(catalog.map((row) => row.category_name.trim()))];
  const leafCategoryIdByName = new Map<string, string>();

  for (const rawName of uniqueCategoryNames) {
    try {
      const leafId = await ensureCategoryPath(
        supabase,
        tenant.id,
        categoryCache,
        resolveCategoryPath(rawName),
        nextCategoryDisplayOrder,
      );
      leafCategoryIdByName.set(normalizeCategoryName(rawName), leafId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "bilinmeyen hata";
      return NextResponse.json(
        { error: `"${rawName}" kategorisi oluşturulamadı: ${message}` },
        { status: 400 },
      );
    }
  }

  let nextProductDisplayOrder =
    existingProducts.reduce((max, row) => Math.max(max, row.display_order ?? 0), 0) + 1;

  // ignoreDuplicates: true → zaten var olan sku_code'lar dokunulmadan atlanır,
  // bu yüzden onlara verilen display_order'ın gerçek sırayı bozması sorun değil.
  const payload = catalog.map((row) => ({
    tenant_id: tenant.id,
    category_id: leafCategoryIdByName.get(normalizeCategoryName(row.category_name))!,
    sku_code: row.sku_code,
    product_name: row.product_name,
    image_url: row.image_url,
    description: row.description,
    is_in_stock: false,
    display_order: nextProductDisplayOrder++,
  }));

  const insertedProducts: Array<{ id: string; sku_code: string }> = [];

  for (const batch of chunkArray(payload, UPSERT_CHUNK_SIZE)) {
    const { error: upsertError, data: upserted } = await supabase
      .from("products")
      .upsert(batch, { onConflict: "tenant_id,sku_code", ignoreDuplicates: true })
      .select("id, sku_code");

    if (upsertError) {
      return NextResponse.json(
        { error: `${upsertError.message} (${insertedProducts.length} ürün eklendikten sonra durdu)` },
        { status: 400 },
      );
    }

    insertedProducts.push(...(upserted ?? []));
  }

  // Master katalogdaki referans fiyat varsa, tenant'ın fiyat listelerine
  // başlangıç önerisi olarak yazılır — admin dilerse Düzenle'den değiştirir.
  const pricedLists = getPricedLists(await ensureDefaultPriceListsForTenant(supabase, tenant.id));

  if (pricedLists.length) {
    const priceRows = insertedProducts.flatMap((product) => {
      const referencePrice = referencePriceBySku.get(product.sku_code);
      if (typeof referencePrice !== "number") {
        return [];
      }
      return pricedLists.map((list) => ({
        product_id: product.id,
        price_list_id: list.id,
        price: referencePrice,
      }));
    });

    for (const batch of chunkArray(priceRows, UPSERT_CHUNK_SIZE)) {
      const { error: priceError } = await supabase
        .from("product_prices")
        .upsert(batch, { onConflict: "product_id,price_list_id" });

      if (priceError) {
        return NextResponse.json({ error: priceError.message }, { status: 400 });
      }
    }
  }

  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  return NextResponse.json({ importedCount: insertedProducts.length });
}
