import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildTenantCampaignImagePath,
  getBannerObjectPath,
  STOREFRONT_BANNERS_BUCKET,
} from "@/lib/storage/banners";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import {
  allowedCampaignImageMimeTypes,
  maxCampaignImageSizeBytes,
} from "@/lib/validators/campaign";

// Kampanya görseli. Banner rotasından (app/api/tenant/settings/banner-image)
// tek farkı: banner'daki birebir çözünürlük zorunluluğu BURADA YOK —
// kampanya kartı daha küçük ve bayiyi tam piksel ölçüsüne zorlamak
// gereksiz. Sadece mime ve boyut sınırı uygulanıyor.
//
// Depo olarak storefront-banners bucket'ı kullanılıyor; RLS ${tenantId}/
// önekine bakıyor (bkz. 0011), o yüzden yeni bucket gerekmedi.

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const formData = await request.formData();
  const image = formData.get("image");
  const previousImageUrl = String(formData.get("previous_image_url") ?? "") || null;

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Kampanya görseli zorunludur." }, { status: 400 });
  }

  if (
    !allowedCampaignImageMimeTypes.includes(
      image.type as (typeof allowedCampaignImageMimeTypes)[number],
    )
  ) {
    return NextResponse.json(
      { error: "Görsel yalnız PNG, JPEG veya WEBP olabilir." },
      { status: 400 },
    );
  }

  if (image.size > maxCampaignImageSizeBytes) {
    return NextResponse.json(
      { error: "Kampanya görseli en fazla 4MB olabilir." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      image_url: `https://example.com/${session.tenant!.id}/campaign_${Date.now()}.jpg`,
    });
  }

  const imageBuffer = Buffer.from(await image.arrayBuffer());
  const filePath = buildTenantCampaignImagePath({
    tenantId: session.tenant!.id,
    fileName: image.name,
    contentType: image.type,
  });

  const { error: uploadError } = await supabase.storage
    .from(STOREFRONT_BANNERS_BUCKET)
    .upload(filePath, imageBuffer, { upsert: false, contentType: image.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data: publicUrlData } = supabase.storage
    .from(STOREFRONT_BANNERS_BUCKET)
    .getPublicUrl(filePath);

  // Eskisini temizle — sadece bu bayinin kendi klasöründeyse.
  const previousPath = getBannerObjectPath(previousImageUrl);
  if (
    previousPath &&
    previousPath !== filePath &&
    previousPath.startsWith(`${session.tenant!.id}/`)
  ) {
    await supabase.storage.from(STOREFRONT_BANNERS_BUCKET).remove([previousPath]);
  }

  return NextResponse.json({ image_url: publicUrlData.publicUrl });
}

export async function DELETE(request: Request) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const { image_url } = (await request.json().catch(() => ({}))) as { image_url?: string };

  if (!image_url) {
    return NextResponse.json({ error: "Silinecek görsel bulunamadı." }, { status: 400 });
  }

  const objectPath = getBannerObjectPath(image_url);

  if (!objectPath || !objectPath.startsWith(`${session.tenant!.id}/`)) {
    return NextResponse.json({ error: "Bu görsel silinemez." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  }

  await supabase.storage.from(STOREFRONT_BANNERS_BUCKET).remove([objectPath]);

  return NextResponse.json({ success: true });
}
