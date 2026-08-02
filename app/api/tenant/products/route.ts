import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { normalizeProductRecord } from "@/lib/products/records";
import { productWithVariantsAndPricesSelect } from "@/lib/products/queries";
import { parseProductPricesFromFormData } from "@/lib/products/form-prices";
import { upsertProductPrices } from "@/lib/price-lists/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { uploadProductImage } from "@/lib/storage/product-images";
import { getSessionContext } from "@/lib/auth/session";
import { getEffectiveProductLimit, hasPlanFeature } from "@/lib/billing/plans";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productCreateSchema } from "@/lib/validators/product";

async function fetchCreatedProduct(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  productId: string,
  tenantId: string,
) {
  const withVariants = await supabase
    .from("products")
    .select(productWithVariantsAndPricesSelect)
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
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  try {
  const session = await getSessionContext();
  const tenant = session.tenant!;
  const formData = await request.formData();
  const parsed = productCreateSchema.safeParse({
    category_id: formData.get("category_id"),
    sku_code: formData.get("sku_code"),
    product_name: formData.get("product_name"),
    currency: formData.get("currency"),
    prices: parseProductPricesFromFormData(formData),
    is_in_stock: formData.get("is_in_stock"),
    is_recommended: formData.get("is_recommended"),
    package_quantity: formData.get("package_quantity"),
    carton_quantity: formData.get("carton_quantity"),
    description: formData.get("description"),
    is_discount_active: formData.get("is_discount_active"),
    discount_price: formData.get("discount_price"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ürün verisi hatalı." },
      { status: 400 },
    );
  }

  const plan = tenant.plan ?? "baslangic";
  if (parsed.data.is_discount_active && !hasPlanFeature(plan, "product_discount")) {
    return NextResponse.json(
      { error: "Ürün indirimi Başlangıç paketinde kullanılamaz." },
      { status: 403 },
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

  const effectiveLimit = getEffectiveProductLimit(tenant.plan, tenant.product_limit_addon);

  if ((count ?? 0) >= effectiveLimit) {
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
    category_id: parsed.data.category_id,
    sku_code: parsed.data.sku_code,
    product_name: parsed.data.product_name,
    currency: parsed.data.currency,
    is_in_stock: parsed.data.is_in_stock,
    is_recommended: parsed.data.is_recommended,
    package_quantity: parsed.data.package_quantity,
    carton_quantity: parsed.data.carton_quantity,
    description: parsed.data.description,
    is_discount_active: parsed.data.is_discount_active,
    discount_price: parsed.data.discount_price,
    image_url: imageUrl,
  };

  const { error } = await supabase
    .from("products")
    .insert(payload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const priceError = await upsertProductPrices(supabase, productId, parsed.data.prices);

  if (priceError) {
    return NextResponse.json(
      { error: priceError.message || "Ürün fiyatları kaydedilemedi." },
      { status: 400 },
    );
  }

  const product = await fetchCreatedProduct(supabase, productId, tenant.id);

  if (!product) {
    return NextResponse.json({ error: "Ürün kaydedildi ama okunamadı." }, { status: 400 });
  }

  return NextResponse.json({ product: normalizeProductRecord(product) });
  } catch {
    return NextResponse.json({ error: "Ürün kaydedilemedi." }, { status: 500 });
  }
}
