import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sanitizeFileName, STORE_ASSETS_BUCKET } from "@/lib/storage/storage-helpers";

// Toplu resim yükleme (zip) tarayıcıdan doğrudan Supabase Storage'a yazmak
// yerine bu route'u kullanır: doğrudan yazma, tarayıcıdaki Supabase Auth
// oturumunun (JWT) o an geçerli olmasına bağlıydı ve oturum süresi dolduğunda
// "row-level security policy" hatasıyla sessizce başarısız oluyordu. Admin
// client sunucu tarafında çalıştığı için bu bağımlılığı ortadan kaldırır —
// tıpkı tekli ürün resmi yüklemesinde zaten yapıldığı gibi.
export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const formData = await request.formData();
  const file = formData.get("file");
  const skuCode = formData.get("sku_code");

  if (!(file instanceof File) || typeof skuCode !== "string" || !skuCode.trim()) {
    return NextResponse.json({ error: "Geçersiz resim yükleme isteği." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 },
    );
  }

  const safeFileName = sanitizeFileName(`${skuCode}.jpg`);
  const storagePath = `${tenant.id}/products/${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORE_ASSETS_BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: "image/jpeg",
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data } = supabase.storage.from(STORE_ASSETS_BUCKET).getPublicUrl(storagePath);

  return NextResponse.json({ image_url: data.publicUrl });
}
