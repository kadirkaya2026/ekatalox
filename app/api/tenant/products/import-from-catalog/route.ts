import { NextResponse } from "next/server";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { getEffectiveProductLimit } from "@/lib/billing/plans";

function normalizeCategoryName(name: string) {
  return name.trim().toLocaleLowerCase("tr-TR");
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

  const { data: catalogRows, error: catalogError } = await supabase
    .from("market_catalog_products")
    .select("sku_code, product_name, category_name, image_url")
    .in("sku_code", skuCodes);

  if (catalogError) {
    return NextResponse.json({ error: catalogError.message }, { status: 400 });
  }

  const catalog =
    (catalogRows as Array<{
      sku_code: string;
      product_name: string;
      category_name: string;
      image_url: string;
    }> | null) ?? [];

  if (!catalog.length) {
    return NextResponse.json(
      { error: "Seçilen ürünler master katalogda bulunamadı." },
      { status: 400 },
    );
  }

  const { data: existingRows } = await supabase
    .from("products")
    .select("sku_code, display_order")
    .eq("tenant_id", tenant.id);

  const existingProducts =
    (existingRows as Array<{ sku_code: string; display_order: number }> | null) ?? [];
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
    .select("id, name")
    .eq("tenant_id", tenant.id);
  const { data: lastCategory } = await supabase
    .from("categories")
    .select("display_order")
    .eq("tenant_id", tenant.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  let nextCategoryDisplayOrder = (lastCategory?.display_order ?? 0) + 1;

  const categoryCache = new Map<string, string>(
    ((categoryRows as Array<{ id: string; name: string }> | null) ?? []).map((row) => [
      normalizeCategoryName(row.name),
      row.id,
    ]),
  );

  const uniqueCategoryNames = [...new Set(catalog.map((row) => row.category_name.trim()))];

  for (const rawName of uniqueCategoryNames) {
    const key = normalizeCategoryName(rawName);
    if (categoryCache.has(key)) continue;

    const { data: newCategory, error: createError } = await supabase
      .from("categories")
      .insert({ tenant_id: tenant.id, name: rawName, display_order: nextCategoryDisplayOrder })
      .select("id, name")
      .single();

    if (createError || !newCategory) {
      return NextResponse.json(
        { error: `"${rawName}" kategorisi oluşturulamadı: ${createError?.message ?? "bilinmeyen hata"}` },
        { status: 400 },
      );
    }

    categoryCache.set(key, (newCategory as { id: string; name: string }).id);
    nextCategoryDisplayOrder += 1;
  }

  let nextProductDisplayOrder =
    existingProducts.reduce((max, row) => Math.max(max, row.display_order ?? 0), 0) + 1;

  // ignoreDuplicates: true → zaten var olan sku_code'lar dokunulmadan atlanır,
  // bu yüzden onlara verilen display_order'ın gerçek sırayı bozması sorun değil.
  const payload = catalog.map((row) => ({
    tenant_id: tenant.id,
    category_id: categoryCache.get(normalizeCategoryName(row.category_name))!,
    sku_code: row.sku_code,
    product_name: row.product_name,
    image_url: row.image_url,
    is_in_stock: false,
    display_order: nextProductDisplayOrder++,
  }));

  const { error: upsertError, data: upserted } = await supabase
    .from("products")
    .upsert(payload, { onConflict: "tenant_id,sku_code", ignoreDuplicates: true })
    .select("id");

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  return NextResponse.json({ importedCount: upserted?.length ?? 0 });
}
