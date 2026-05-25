import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { uploadProductImage } from "@/lib/storage/product-images";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productCreateSchema } from "@/lib/validators/product";

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
    sku_code: formData.get("sku_code"),
    product_name: formData.get("product_name"),
    currency: formData.get("currency"),
    price_tier_1: formData.get("price_tier_1"),
    price_tier_2: formData.get("price_tier_2"),
    price_tier_3: formData.get("price_tier_3"),
    is_in_stock: formData.get("is_in_stock"),
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

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ product: data });
}
