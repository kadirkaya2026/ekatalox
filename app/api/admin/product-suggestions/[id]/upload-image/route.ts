import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import { ProductImageValidationError, uploadProductImage } from "@/lib/storage/product-images";

// Süper admin, bir ürün önerisini onaylamadan önce görsel ekleyebilsin diye
// (kullanıcı isteği, 19 Ağu 2026) — öneri henüz bir "products" satırına
// dönüşmediği için storage yolu için tek kullanımlık bir id üretilir, asıl
// ürünün id'siyle eşleşmesi gerekmez. Dönen public URL, product-suggestions-
// panel.tsx'te onay isteğinde image_url olarak gönderilir.
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/admin/product-suggestions/[id]/upload-image">,
) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { id } = await ctx.params;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data: suggestion } = await supabase
    .from("product_suggestions")
    .select("tenant_id")
    .eq("id", id)
    .maybeSingle();

  if (!suggestion) {
    return NextResponse.json({ error: "Öneri bulunamadı." }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const image = formData?.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "Resim dosyası gerekli." }, { status: 400 });
  }

  try {
    const imageUrl = await uploadProductImage({
      supabase,
      tenantId: suggestion.tenant_id,
      productId: randomUUID(),
      file: image,
    });

    return NextResponse.json({ imageUrl });
  } catch (error) {
    if (error instanceof ProductImageValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Görsel yüklenemedi." }, { status: 500 });
  }
}
