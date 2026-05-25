import { NextResponse } from "next/server";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { getTenantCategories, getTenantProducts } from "@/lib/data";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productImportRowsSchema } from "@/lib/validators/product";

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
      categories.map((category) => [category.name.trim().toLowerCase(), category.id]),
    );
    const missingCategory = rows.find(
      (row) => !categoryMap.get(row.category_name.trim().toLowerCase()),
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
      category_id: categoryMap.get(row.category_name.trim().toLowerCase())!,
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
    const merged = [...mappedProducts, ...currentProducts.filter((product) => {
      return !rows.some((row) => row.sku_code === product.sku_code);
    })];

    return NextResponse.json({
      count: rows.length,
      products: merged,
    });
  }

  const { data: existingRows } = await supabase
    .from("products")
    .select("sku_code")
    .eq("tenant_id", tenant.id);

  const existingSkuSet = new Set(
    ((existingRows as Array<{ sku_code: string }> | null) ?? []).map((item) => item.sku_code),
  );

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("id, name")
    .eq("tenant_id", tenant.id);

  const categoryMap = new Map(
    (((categoryRows as Array<{ id: string; name: string }> | null) ?? [])).map((category) => [
      category.name.trim().toLowerCase(),
      category.id,
    ]),
  );

  const missingCategory = rows.find(
    (row) => !categoryMap.get(row.category_name.trim().toLowerCase()),
  );

  if (missingCategory) {
    return NextResponse.json(
      { error: `Kategori bulunamadı: ${missingCategory.category_name}` },
      { status: 400 },
    );
  }

  const newSkuCount = rows.filter((row) => !existingSkuSet.has(row.sku_code)).length;

  if (existingSkuSet.size + newSkuCount > tenant.max_product_limit) {
    return NextResponse.json(
      { error: "CSV içeriği ürün limitini aşıyor." },
      { status: 400 },
    );
  }

  const payload = rows.map((row) => ({
    tenant_id: tenant.id,
    category_id: categoryMap.get(row.category_name.trim().toLowerCase())!,
    sku_code: row.sku_code,
    product_name: row.product_name,
    image_url: row.image_url,
    currency: row.currency,
    price_tier_1: row.price_tier_1,
    price_tier_2: row.price_tier_2,
    price_tier_3: row.price_tier_3,
    is_in_stock: row.is_in_stock,
  }));

  const { error } = await supabase
    .from("products")
    .upsert(payload, { onConflict: "tenant_id,sku_code" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    count: rows.length,
    products: data ?? [],
  });
}