import { NextResponse } from "next/server";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

const INSERT_CHUNK_SIZE = 200;

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
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

  const { data: catalogRows, error: catalogError } = await supabase
    .from("market_catalog_products")
    .select("sku_code, product_name, brand, category_name, image_url");

  if (catalogError) {
    return NextResponse.json({ error: catalogError.message }, { status: 400 });
  }

  const catalog =
    (catalogRows as Array<{
      sku_code: string;
      product_name: string;
      brand: string | null;
      category_name: string;
      image_url: string;
    }> | null) ?? [];

  if (!catalog.length) {
    return NextResponse.json(
      { error: "Market kataloğu boş görünüyor." },
      { status: 400 },
    );
  }

  // Tenant'ın market kataloğundaki kategori isimleriyle eşleşen kategorileri
  // yoksa oluştur; tenant admin bu kategorileri daha sonra kendi ürünleri
  // için de kullanabilir.
  const categoryNames = Array.from(new Set(catalog.map((row) => row.category_name)));
  const categoryPayload = categoryNames.map((name) => ({ tenant_id: tenantId, name }));

  const { error: categoryUpsertError } = await supabase
    .from("categories")
    .upsert(categoryPayload, { onConflict: "tenant_id,name", ignoreDuplicates: true });

  if (categoryUpsertError) {
    return NextResponse.json({ error: categoryUpsertError.message }, { status: 400 });
  }

  const { data: categoryRows, error: categoryFetchError } = await supabase
    .from("categories")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .in("name", categoryNames);

  if (categoryFetchError) {
    return NextResponse.json({ error: categoryFetchError.message }, { status: 400 });
  }

  const categoryIdByName = new Map(
    ((categoryRows as Array<{ id: string; name: string }> | null) ?? []).map((row) => [
      row.name,
      row.id,
    ]),
  );

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

  for (const batch of chunk(productPayload, INSERT_CHUNK_SIZE)) {
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
