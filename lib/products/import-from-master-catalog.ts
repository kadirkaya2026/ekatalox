import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tenant } from "@/lib/types";
import { compactProductDisplayOrder } from "@/lib/products/reorder";
import { getEffectiveProductLimit } from "@/lib/billing/plans";
import { chunkArray } from "@/lib/utils";
import { resolveCategoryPath } from "@/lib/market-catalog/category-taxonomy";
import { buildCategoryCache, ensureCategoryPath, normalizeCategoryName } from "@/lib/categories/ensure-hierarchy";

// import-from-catalog/route.ts (manuel "Master Katalog'dan seç" akışı) ve
// stock-import/apply/route.ts (barkod eşleşmesi Master Katalog'da bulunan
// ama tenant'ta henüz olmayan satırlar) aynı "sku_code listesinden tenant'a
// ürün ekle" mantığını paylaşıyor — kategori çözümleme, ürün limiti kontrolü
// ve upsert deseni burada tek yerde tutuluyor.

// PostgREST caps a single request's URL (and thus an .in() filter's value
// list) well below what a few thousand selected sku_codes need.
const CATALOG_LOOKUP_CHUNK_SIZE = 300;
const UPSERT_CHUNK_SIZE = 500;

interface CatalogRow {
  sku_code: string;
  product_name: string;
  category_name: string;
  image_url: string;
  reference_price: number | null;
  description: string | null;
}

export async function fetchMasterCatalogRowsBySku(
  supabase: SupabaseClient,
  skuCodes: string[],
): Promise<CatalogRow[]> {
  const rows: CatalogRow[] = [];

  for (const batch of chunkArray(skuCodes, CATALOG_LOOKUP_CHUNK_SIZE)) {
    const { data, error } = await supabase
      .from("market_catalog_products")
      .select("sku_code, product_name, category_name, image_url, reference_price, description")
      .in("sku_code", batch);

    if (error) {
      throw error;
    }

    rows.push(...((data as CatalogRow[] | null) ?? []));
  }

  return rows;
}

// Same db-max-rows ceiling applies to plain selects — a tenant sitting above
// 1000 products would otherwise only see its first 1000 rows here,
// undercounting existingSkuSet and letting the product-limit check pass
// when it shouldn't.
export async function fetchAllTenantProductsForImport(supabase: SupabaseClient, tenantId: string) {
  const rows: Array<{ sku_code: string; display_order: number }> = [];
  const PAGE_SIZE = 1000;

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data } = await supabase
      .from("products")
      .select("sku_code, display_order")
      .eq("tenant_id", tenantId)
      .range(from, from + PAGE_SIZE - 1);

    const page = data ?? [];
    rows.push(...(page as Array<{ sku_code: string; display_order: number }>));
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

export type ImportProductsFromMasterCatalogResult =
  | {
      ok: true;
      insertedProducts: Array<{ id: string; sku_code: string }>;
      referencePriceBySku: Map<string, number | null>;
      skippedForLimitCount: number;
    }
  | { ok: false; error: string };

export async function importProductsFromMasterCatalog(
  supabase: SupabaseClient,
  tenant: Pick<Tenant, "id" | "plan" | "product_limit_addon">,
  skuCodes: string[],
): Promise<ImportProductsFromMasterCatalogResult> {
  if (!skuCodes.length) {
    return { ok: true, insertedProducts: [], referencePriceBySku: new Map(), skippedForLimitCount: 0 };
  }

  const catalog = await fetchMasterCatalogRowsBySku(supabase, skuCodes);
  const referencePriceBySku = new Map(catalog.map((row) => [row.sku_code, row.reference_price]));

  if (!catalog.length) {
    return { ok: true, insertedProducts: [], referencePriceBySku, skippedForLimitCount: 0 };
  }

  // Önceki silmelerden kalan display_order boşluklarını kapatmadan
  // "en yüksek sıra + 1"den devam edersek yeni ürünler gerçek sayıdan çok
  // daha yüksek bir sıra numarasıyla başlar.
  await compactProductDisplayOrder(supabase, tenant.id);

  const existingProducts = await fetchAllTenantProductsForImport(supabase, tenant.id);
  const existingSkuSet = new Set(existingProducts.map((row) => row.sku_code));

  const newRows = catalog.filter((row) => !existingSkuSet.has(row.sku_code));
  const effectiveLimit = getEffectiveProductLimit(tenant.plan, tenant.product_limit_addon);
  const remainingCapacity = Math.max(0, effectiveLimit - existingSkuSet.size);
  const skippedForLimitCount = Math.max(0, newRows.length - remainingCapacity);
  const rowsToInsert = remainingCapacity >= newRows.length ? newRows : newRows.slice(0, remainingCapacity);

  // Çağıranın (ör. stok listesi apply akışı) her istenen sku_code için bir
  // productId'ye ihtiyacı var — hem yeni eklenenler hem zaten tenant'ta
  // olanlar için. Zaten var olanları upsert'e sokmuyoruz (tenant'ın
  // düzenlediği isim/görsel/stok durumunu ezmemek için), sadece id'lerini
  // dokunmadan okuyoruz.
  const alreadyExistingSkuCodes = catalog
    .filter((row) => existingSkuSet.has(row.sku_code))
    .map((row) => row.sku_code);
  const existingProductIdBySku = new Map<string, string>();

  for (const batch of chunkArray(alreadyExistingSkuCodes, CATALOG_LOOKUP_CHUNK_SIZE)) {
    const { data, error } = await supabase
      .from("products")
      .select("id, sku_code")
      .eq("tenant_id", tenant.id)
      .in("sku_code", batch);
    if (error) throw error;
    for (const row of (data as Array<{ id: string; sku_code: string }> | null) ?? []) {
      existingProductIdBySku.set(row.sku_code, row.id);
    }
  }

  if (!rowsToInsert.length) {
    const insertedProducts = alreadyExistingSkuCodes
      .map((sku) => ({ id: existingProductIdBySku.get(sku)!, sku_code: sku }))
      .filter((row) => Boolean(row.id));
    return { ok: true, insertedProducts, referencePriceBySku, skippedForLimitCount };
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

  const uniqueCategoryNames = [...new Set(rowsToInsert.map((row) => row.category_name.trim()))];
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
      return { ok: false, error: `"${rawName}" kategorisi oluşturulamadı: ${message}` };
    }
  }

  let nextProductDisplayOrder =
    existingProducts.reduce((max, row) => Math.max(max, row.display_order ?? 0), 0) + 1;

  const payload = rowsToInsert.map((row) => ({
    tenant_id: tenant.id,
    category_id: leafCategoryIdByName.get(normalizeCategoryName(row.category_name))!,
    sku_code: row.sku_code,
    product_name: row.product_name,
    image_url: row.image_url,
    description: row.description,
    is_in_stock: false,
    display_order: nextProductDisplayOrder++,
  }));

  const insertedProducts: Array<{ id: string; sku_code: string }> = alreadyExistingSkuCodes
    .map((sku) => ({ id: existingProductIdBySku.get(sku)!, sku_code: sku }))
    .filter((row) => Boolean(row.id));

  for (const batch of chunkArray(payload, UPSERT_CHUNK_SIZE)) {
    // ignoreDuplicates: true — aynı sku_code aynı anda başka bir istek
    // tarafından da eklenmiş olabilir (yarış durumu); böyle bir çakışma
    // sessizce atlanır, hata verilmez.
    const { error: upsertError, data: upserted } = await supabase
      .from("products")
      .upsert(batch, { onConflict: "tenant_id,sku_code", ignoreDuplicates: true })
      .select("id, sku_code");

    if (upsertError) {
      return {
        ok: false,
        error: `${upsertError.message} (${insertedProducts.length} ürün eklendikten sonra durdu)`,
      };
    }

    insertedProducts.push(...((upserted as Array<{ id: string; sku_code: string }> | null) ?? []));
  }

  return { ok: true, insertedProducts, referencePriceBySku, skippedForLimitCount };
}
