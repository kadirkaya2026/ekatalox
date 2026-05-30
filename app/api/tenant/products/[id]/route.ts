import { NextResponse } from "next/server";
import { normalizeProductRecord } from "@/lib/products/records";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  PRODUCT_IMAGES_BUCKET,
  uploadProductImage,
} from "@/lib/storage/product-images";
import { getStorageObjectPathFromPublicUrl } from "@/lib/storage/storage-helpers";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productCreateSchema } from "@/lib/validators/product";

async function fetchUpdatedProduct(
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

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/tenant/products/[id]">,
) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const { id } = await ctx.params;
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

  const image = formData.get("image");
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  let imageUrl: string | undefined;

  if (image instanceof File && image.size > 0) {
    imageUrl = await uploadProductImage({
      supabase,
      tenantId: tenant.id,
      productId: id,
      file: image,
    });
  }

  const payload = {
    ...parsed.data,
    ...(imageUrl ? { image_url: imageUrl } : {}),
  };

  const { error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const product = await fetchUpdatedProduct(supabase, id, tenant.id);

  if (!product) {
    return NextResponse.json({ error: "Ürün güncellendi ama okunamadı." }, { status: 400 });
  }

  return NextResponse.json({ product: normalizeProductRecord(product) });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/tenant/products/[id]">,
) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const { id } = await ctx.params;
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, image_url")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 400 });
  }

  if (!product) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
  }

  const imagePath = getStorageObjectPathFromPublicUrl(
    product.image_url,
    PRODUCT_IMAGES_BUCKET,
  );

  if (imagePath) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([imagePath]);

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 400 });
    }
  }

  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ deletedId: id });
}
