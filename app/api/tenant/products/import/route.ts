import { NextResponse } from "next/server";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { getTenantCategories, getTenantProducts, getTenantPriceLists } from "@/lib/data";
import { resolveImportPricesForTenant } from "@/lib/price-lists/import";
import {
  ensureDefaultPriceListsForTenant,
  upsertProductPrices,
} from "@/lib/price-lists/data";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productImportRowsSchema } from "@/lib/validators/product";

// ---------------------------------------------------------------------------
// Normalize a category name for case/whitespace-insensitive comparison.
// Uses tr-TR locale so "İ" and "ı" are handled correctly.
// ---------------------------------------------------------------------------
function normalizeCategoryName(name: string) {
  return name.trim().toLocaleLowerCase("tr-TR");
}

function dedupeImportRowsBySku<T extends { sku_code: string }>(rows: T[]): T[] {
  const bySku = new Map<string, T>();

  for (const row of rows) {
    bySku.set(row.sku_code, row);
  }

  return [...bySku.values()];
}

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json();
  const parsedHeaders: string[] = Array.isArray(body.parsedHeaders)
    ? (body.parsedHeaders as unknown[])
        .filter((value: unknown): value is string => typeof value === "string")
        .map((value: string) => value.trim())
    : [];
  const hasPackageQuantityColumn = parsedHeaders.includes("package_quantity");
  const hasCartonQuantityColumn = parsedHeaders.includes("carton_quantity");
  const parsed = productImportRowsSchema.safeParse(body.rows ?? []);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "CSV dosyası doğrulanamadı." },
      { status: 400 },
    );
  }

  // sku_code bazında tekilleştir: CSV'de aynı model no birden çok kez geçerse
  // upsert payload'ında (tenant_id, sku_code) hedefi iki kez oluşur ve Postgres
  // "ON CONFLICT DO UPDATE command cannot affect row a second time" hatası verir.
  // İlk görülen satırın konumu korunur, son değer kazanır.
  const rows = dedupeImportRowsBySku(parsed.data);
  const supabase = createSupabaseAdminClient();

  // -------------------------------------------------------------------------
  // Demo / fallback mode (no Supabase credentials)
  // Auto-create is skipped in demo; missing categories still error out.
  // -------------------------------------------------------------------------
  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    const currentProducts = await getTenantProducts(tenant.id);
    const categories = await getTenantCategories(tenant.id);
    const categoryMap = new Map(
      categories.map((c) => [normalizeCategoryName(c.name), c.id]),
    );

    const missingCategory = rows.find(
      (row) => !categoryMap.get(normalizeCategoryName(row.category_name)),
    );

    if (missingCategory) {
      return NextResponse.json(
        { error: `Kategori bulunamadı: ${missingCategory.category_name}` },
        { status: 400 },
      );
    }

    const demoPriceLists = await getTenantPriceLists(tenant.id);

    const mappedProducts = rows.map((row, index) => ({
      id: `demo-import-${index}-${row.sku_code}`,
      tenant_id: tenant.id,
      category_id: categoryMap.get(normalizeCategoryName(row.category_name))!,
      display_order: index + 1,
      created_at: new Date().toISOString(),
      sku_code: row.sku_code,
      product_name: row.product_name,
      image_url: row.image_url,
      currency: row.currency,
      prices: resolveImportPricesForTenant(
        row.prices,
        demoPriceLists,
      ).map((entry) => ({
        product_id: `demo-import-${index}-${row.sku_code}`,
        price_list_id: entry.price_list_id,
        price: entry.price,
      })),
      is_in_stock: row.is_in_stock,
      is_discount_active: false,
      discount_price: null,
      package_quantity: row.package_quantity,
      carton_quantity: row.carton_quantity,
    }));

    const merged = [
      ...mappedProducts,
      ...currentProducts.filter(
        (product) => !rows.some((row) => row.sku_code === product.sku_code),
      ),
    ];

    return NextResponse.json({
      count: rows.length,
      products: merged,
      categories,
    });
  }

  // -------------------------------------------------------------------------
  // Production path
  // -------------------------------------------------------------------------

  // 1. Fetch existing SKUs for limit check
  const { data: existingRows } = await supabase
    .from("products")
    .select("sku_code, display_order")
    .eq("tenant_id", tenant.id);

  const existingProducts = (existingRows as Array<{
    sku_code: string;
    display_order: number;
  }> | null) ?? [];
  const existingSkuSet = new Set(
    existingProducts.map((item) => item.sku_code),
  );
  const existingDisplayOrderMap = new Map(
    existingProducts.map((item) => [item.sku_code, item.display_order]),
  );

  // 2. Load all existing categories into an in-memory cache
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


  // categoryCache: normalized name → uuid
  const categoryCache = new Map<string, string>(
    ((categoryRows as Array<{ id: string; name: string }> | null) ?? []).map(
      (c) => [normalizeCategoryName(c.name), c.id],
    ),
  );

  // 3. Resolve (or auto-create) every unique category name in the import batch
  const uniqueCategoryNames = [
    ...new Set(rows.map((row) => row.category_name.trim())),
  ];

  for (const rawName of uniqueCategoryNames) {
    const key = normalizeCategoryName(rawName);

    if (categoryCache.has(key)) {
      continue; // already cached — nothing to do
    }

    // Not found → auto-create the category
    const { data: newCategory, error: createError } = await supabase
      .from("categories")
      .insert({
        tenant_id: tenant.id,
        name: rawName.trim(),
        display_order: nextCategoryDisplayOrder,
      })
      .select("id, name")
      .single();

    if (createError || !newCategory) {
      return NextResponse.json(
        {
          error: `"${rawName}" kategorisi oluşturulamadı: ${createError?.message ?? "bilinmeyen hata"}`,
        },
        { status: 400 },
      );
    }

    // Seed cache so subsequent rows in this batch reuse the new id
    categoryCache.set(key, (newCategory as { id: string; name: string }).id);
    nextCategoryDisplayOrder += 1;
  }

  // 4. Product limit check (only new SKUs count toward the limit)
  const newSkuCount = rows.filter(
    (row) => !existingSkuSet.has(row.sku_code),
  ).length;

  if (existingSkuSet.size + newSkuCount > tenant.max_product_limit) {
    return NextResponse.json(
      { error: "CSV içeriği ürün limitini aşıyor." },
      { status: 400 },
    );
  }

  let nextProductDisplayOrder =
    existingProducts.reduce(
      (maxValue, item) => Math.max(maxValue, item.display_order ?? 0),
      0,
    ) + 1;

  const priceLists = await ensureDefaultPriceListsForTenant(supabase, tenant.id);

  // 5. Build upsert payload — every category_id is now guaranteed to exist
  const payload = rows.map((row) => {
    const existingDisplayOrder = existingDisplayOrderMap.get(row.sku_code);
    const display_order = existingDisplayOrder ?? nextProductDisplayOrder;

    if (existingDisplayOrder === undefined) {
      nextProductDisplayOrder += 1;
    }

    return {
      tenant_id: tenant.id,
      category_id: categoryCache.get(normalizeCategoryName(row.category_name))!,
      sku_code: row.sku_code,
      product_name: row.product_name,
      image_url: row.image_url,
      currency: row.currency,
      is_in_stock: row.is_in_stock,
      ...(hasPackageQuantityColumn ? { package_quantity: row.package_quantity } : {}),
      ...(hasCartonQuantityColumn ? { carton_quantity: row.carton_quantity } : {}),
      display_order,
    };
  });

  const { error: upsertError } = await supabase
    .from("products")
    .upsert(payload, { onConflict: "tenant_id,sku_code" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  const { data: productRows } = await supabase
    .from("products")
    .select("id, sku_code")
    .eq("tenant_id", tenant.id)
    .in(
      "sku_code",
      rows.map((row) => row.sku_code),
    );

  const productIdBySku = new Map(
    ((productRows as Array<{ id: string; sku_code: string }> | null) ?? []).map((row) => [
      row.sku_code,
      row.id,
    ]),
  );

  for (const row of rows) {
    const productId = productIdBySku.get(row.sku_code);

    if (!productId) {
      continue;
    }

    const resolvedPrices = resolveImportPricesForTenant(
      row.prices,
      priceLists,
    );

    const priceError = await upsertProductPrices(supabase, productId, resolvedPrices);

    if (priceError) {
      return NextResponse.json(
        { error: priceError.message || "Ürün fiyatları kaydedilemedi." },
        { status: 400 },
      );
    }
  }

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  return NextResponse.json({
    count: rows.length,
    products: products ?? [],
    categories: categories ?? [],
  });
}
