import { NextResponse } from "next/server";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import { chunkArray } from "@/lib/utils";
import { resolveCategoryPath } from "@/lib/market-catalog/category-taxonomy";
import { buildCategoryCache, ensureCategoryPath } from "@/lib/categories/ensure-hierarchy";
import type { SupabaseClient } from "@supabase/supabase-js";

const INSERT_CHUNK_SIZE = 200;

// PostgREST caps every response at its db-max-rows setting (1000) — the
// catalog is well past that now, so an unpaginated select here would only
// ever seed a new tenant with the first 1000 rows.
async function fetchFullCatalog(supabase: SupabaseClient) {
  const rows: Array<{
    sku_code: string;
    product_name: string;
    brand: string | null;
    category_name: string;
    image_url: string;
  }> = [];
  const PAGE_SIZE = 1000;

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("market_catalog_products")
      .select("sku_code, product_name, brand, category_name, image_url")
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/admin/tenants/[id]/seed-market-catalog">,
) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { id: tenantId } = await ctx.params;
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase production yapılandırması eksik." },
      { status: 500 },
    );
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, subdomain, business_type")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant bulunamadı." }, { status: 404 });
  }

  if (tenant.business_type !== "market") {
    return NextResponse.json(
      { error: "Bu tenant \"market\" olarak işaretli değil." },
      { status: 400 },
    );
  }

  let catalog: Awaited<ReturnType<typeof fetchFullCatalog>>;

  try {
    catalog = await fetchFullCatalog(supabase);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Katalog sorgusu başarısız oldu.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!catalog.length) {
    return NextResponse.json(
      { error: "Market kataloğu boş görünüyor." },
      { status: 400 },
    );
  }

  // Tenant'ın market kataloğundaki kategori isimleriyle eşleşen kategorileri
  // yoksa oluştur (üst kategorileriyle birlikte); tenant admin bu
  // kategorileri daha sonra kendi ürünleri için de kullanabilir.
  const { data: existingCategoryRows } = await supabase
    .from("categories")
    .select("id, name, parent_id")
    .eq("tenant_id", tenantId);

  const { data: lastCategory } = await supabase
    .from("categories")
    .select("display_order")
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextCategoryDisplayOrder = { value: (lastCategory?.display_order ?? 0) + 1 };
  const categoryCache = buildCategoryCache(
    (existingCategoryRows as Array<{ id: string; name: string; parent_id: string | null }> | null) ?? [],
  );

  const categoryNames = Array.from(new Set(catalog.map((row) => row.category_name)));
  const categoryIdByName = new Map<string, string>();

  for (const rawName of categoryNames) {
    try {
      const leafId = await ensureCategoryPath(
        supabase,
        tenantId,
        categoryCache,
        resolveCategoryPath(rawName),
        nextCategoryDisplayOrder,
      );
      categoryIdByName.set(rawName, leafId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "bilinmeyen hata";
      return NextResponse.json(
        { error: `"${rawName}" kategorisi oluşturulamadı: ${message}` },
        { status: 400 },
      );
    }
  }

  const { data: maxOrderRow } = await supabase
    .from("products")
    .select("display_order")
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextDisplayOrder = (maxOrderRow?.display_order ?? 0) + 1;

  const productPayload = catalog
    .map((row) => {
      const categoryId = categoryIdByName.get(row.category_name);
      if (!categoryId) {
        return null;
      }
      return {
        tenant_id: tenantId,
        sku_code: row.sku_code,
        product_name: row.product_name,
        image_url: row.image_url,
        category_id: categoryId,
        is_in_stock: false,
        display_order: nextDisplayOrder++,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  let insertedCount = 0;

  for (const batch of chunkArray(productPayload, INSERT_CHUNK_SIZE)) {
    const { data, error } = await supabase
      .from("products")
      .upsert(batch, { onConflict: "tenant_id,sku_code", ignoreDuplicates: true })
      .select("id");

    if (error) {
      return NextResponse.json(
        {
          error: `${error.message} (${insertedCount} ürün eklendikten sonra durdu)`,
        },
        { status: 400 },
      );
    }

    insertedCount += data?.length ?? 0;
  }

  revalidateStorefrontCache({ tenantId, subdomain: tenant.subdomain });

  return NextResponse.json({
    insertedCount,
    totalCatalogSize: catalog.length,
  });
}
