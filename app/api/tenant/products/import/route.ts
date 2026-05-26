import { NextResponse } from "next/server";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { getTenantCategories, getTenantProducts } from "@/lib/data";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productImportRowsSchema } from "@/lib/validators/product";

// ---------------------------------------------------------------------------
// Normalize a category name for case/whitespace-insensitive comparison.
// Uses tr-TR locale so "İ" and "ı" are handled correctly.
// ---------------------------------------------------------------------------
function normalizeCategoryName(name: string) {
  return name.trim().toLocaleLowerCase("tr-TR");
}

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const body = await request.json();
  const parsed = productImportRowsSchema.safeParse(body.rows ?? []);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "CSV dosyası doğrulanamadı." },
      { status: 400 },
    );
  }

  const rows = parsed.data;
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

    const mappedProducts = rows.map((row, index) => ({
      id: `demo-import-${index}-${row.sku_code}`,
      tenant_id: tenant.id,
      category_id: categoryMap.get(normalizeCategoryName(row.category_name))!,
      created_at: new Date().toISOString(),
      sku_code: row.sku_code,
      product_name: row.product_name,
      image_url: row.image_url,
      currency: row.currency,
      price_tier_1: row.price_tier_1,
      price_tier_2: row.price_tier_2,
      price_tier_3: row.price_tier_3,
      is_in_stock: row.is_in_stock,
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
    .select("sku_code")
    .eq("tenant_id", tenant.id);

  const existingSkuSet = new Set(
    ((existingRows as Array<{ sku_code: string }> | null) ?? []).map(
      (item) => item.sku_code,
    ),
  );

  // 2. Load all existing categories into an in-memory cache
  const { data: categoryRows } = await supabase
    .from("categories")
    .select("id, name")
    .eq("tenant_id", tenant.id);

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
      .insert({ tenant_id: tenant.id, name: rawName.trim() })
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

  // 5. Build upsert payload — every category_id is now guaranteed to exist
  const payload = rows.map((row) => ({
    tenant_id: tenant.id,
    category_id: categoryCache.get(normalizeCategoryName(row.category_name))!,
    sku_code: row.sku_code,
    product_name: row.product_name,
    image_url: row.image_url,
    currency: row.currency,
    price_tier_1: row.price_tier_1,
    price_tier_2: row.price_tier_2,
    price_tier_3: row.price_tier_3,
    is_in_stock: row.is_in_stock,
  }));

  const { error: upsertError } = await supabase
    .from("products")
    .upsert(payload, { onConflict: "tenant_id,sku_code" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("name", { ascending: true }),
  ]);

  return NextResponse.json({
    count: rows.length,
    products: products ?? [],
    categories: categories ?? [],
  });
}
