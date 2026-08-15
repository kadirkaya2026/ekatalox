import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { ProductImageValidationError, uploadProductImage } from "@/lib/storage/product-images";

// Stok listesinden "yeni ürün olarak oluştur" ile seçilen görseli, ürün
// henüz oluşturulmadan (dolayısıyla henüz bir productId yokken) Supabase
// Storage'a yüklemek için ayrı bir uç nokta — depolama yolu için gerekli
// olan kimlik burada tek kullanımlık üretilir, asıl ürünün id'siyle
// eşleşmesi gerekmez (sadece dosya yolunun benzersiz olması yeterli).
// Dönen public URL, stock-import/apply isteğinde newProduct.imageUrl
// olarak gönderilir.
export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;

  const formData = await request.formData().catch(() => null);
  const image = formData?.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "Resim dosyası gerekli." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  try {
    const imageUrl = await uploadProductImage({
      supabase,
      tenantId: tenant.id,
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
