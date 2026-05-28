import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { normalizeProductRecord } from "@/lib/products/records";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { uploadProductImage } from "@/lib/storage/product-images";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productCreateSchema } from "@/lib/validators/product";

async function fetchCreatedProduct(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  productId: string,
  tenantId: string,
) {
  const withVariants = await supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .single();

  if (!withVariants.error && withVariants.data) {
    return withVariants.data;
  }

  const fallback = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .single();

  return fallback.data;
}

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const formData = await request.formData();
  const parsed = productCreateSchema.safeParse({
    category_id: formData.get("category_id"),
    sku_code: formData.get("sku_code"),
    product_name: formData.get("product_name"),
    currency: formData.get("currency"),
    price_tier_1: formData.get("price_tier_1"),
    price_tier_2: formData.get("price_tier_2"),
    price_tier_3: formData.get("price_tier_3"),
    is_in_stock: formData.get("is_in_stock"),
    package_quantity: formData.get("package_quantity"),
    carton_quantity: formData.get("carton_quantity"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ürün verisi hatalı." },
      { status: 400 },
    );
  }

  const image = formData.get("image");
  const supabase = createSupabaseAdminClient();
  const productId = randomUUID();

  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);

  if ((count ?? 0) >= tenant.max_product_limit) {
    return NextResponse.json(
      { error: "Ürün limitiniz dolu. Yeni ürün ekleyemezsiniz." },
      { status: 400 },
    );
  }

  let imageUrl: string | null = null;

  if (image instanceof File && image.size > 0) {
    imageUrl = await uploadProductImage({
      supabase,
      tenantId: tenant.id,
      productId,
      file: image,
    });
  }

  const { data: lastProduct } = await supabase
    .from("products")
    .select("display_order")
    .eq("tenant_id", tenant.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    id: productId,
    tenant_id: tenant.id,
    display_order: (lastProduct?.display_order ?? 0) + 1,
    ...parsed.data,
    image_url: imageUrl,
  };

  const { error } = await supabase
    .from("products")
    .insert(payload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const product = await fetchCreatedProduct(supabase, productId, tenant.id);

  if (!product) {
    return NextResponse.json({ error: "Ürün kaydedildi ama okunamadı." }, { status: 400 });
  }

  return NextResponse.json({ product: normalizeProductRecord(product) });
}
