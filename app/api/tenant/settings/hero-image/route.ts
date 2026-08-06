import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { shouldAllowDemoFallback } from "@/lib/env";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildTenantHeroImagePath,
  getHeroImageObjectPath,
  STOREFRONT_HERO_BUCKET,
} from "@/lib/storage/hero-image";
import { ensureTenantPlanFeatureResponse } from "@/lib/tenancy/guards";
import {
  allowedHeroImageMimeTypes,
  maxHeroImageFileSizeBytes,
} from "@/lib/validators/storefront-settings";

function isManagedHeroImageUrl(url: string | null, tenantId: string) {
  const objectPath = getHeroImageObjectPath(url);

  if (!objectPath) {
    return false;
  }

  return objectPath.startsWith(`${tenantId}/`);
}

export async function POST(request: Request) {
  const guard = await ensureTenantPlanFeatureResponse("advanced_appearance", {
    blockDemoWrite: true,
  });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const formData = await request.formData();
  const image = formData.get("image");
  const previousImageUrl = String(formData.get("previous_image_url") ?? "") || null;

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Hero görseli zorunludur." }, { status: 400 });
  }

  if (
    !allowedHeroImageMimeTypes.includes(
      image.type as (typeof allowedHeroImageMimeTypes)[number],
    )
  ) {
    return NextResponse.json(
      { error: "Hero görseli yalnız PNG, JPEG veya WEBP olabilir." },
      { status: 400 },
    );
  }

  if (image.size > maxHeroImageFileSizeBytes) {
    return NextResponse.json(
      { error: "Hero görseli en fazla 3MB olabilir." },
      { status: 400 },
    );
  }

  const imageBuffer = Buffer.from(await image.arrayBuffer());
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      image_url: `https://example.com/${session.tenant!.id}/hero_${Date.now()}.jpg`,
    });
  }

  const filePath = buildTenantHeroImagePath({
    tenantId: session.tenant!.id,
    fileName: image.name,
    contentType: image.type,
  });

  const { error: uploadError } = await supabase.storage
    .from(STOREFRONT_HERO_BUCKET)
    .upload(filePath, imageBuffer, {
      upsert: false,
      contentType: image.type,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data: publicUrlData } = supabase.storage
    .from(STOREFRONT_HERO_BUCKET)
    .getPublicUrl(filePath);

  if (isManagedHeroImageUrl(previousImageUrl, session.tenant!.id)) {
    const previousPath = getHeroImageObjectPath(previousImageUrl);

    if (previousPath && previousPath !== filePath) {
      await supabase.storage.from(STOREFRONT_HERO_BUCKET).remove([previousPath]);
    }
  }

  revalidateStorefrontCache({
    tenantId: session.tenant!.id,
    subdomain: session.tenant!.subdomain,
  });

  return NextResponse.json({ image_url: publicUrlData.publicUrl });
}

export async function DELETE(request: Request) {
  const guard = await ensureTenantPlanFeatureResponse("advanced_appearance", {
    blockDemoWrite: true,
  });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const { image_url } = (await request.json()) as { image_url?: string };

  if (!image_url) {
    return NextResponse.json({ error: "Silinecek hero görseli bulunamadı." }, { status: 400 });
  }

  const objectPath = getHeroImageObjectPath(image_url);

  if (!objectPath || !objectPath.startsWith(`${session.tenant!.id}/`)) {
    return NextResponse.json({ error: "Bu hero görseli silinemez." }, { status: 400 });
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

  const { error } = await supabase.storage.from(STOREFRONT_HERO_BUCKET).remove([objectPath]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidateStorefrontCache({
    tenantId: session.tenant!.id,
    subdomain: session.tenant!.subdomain,
  });

  return NextResponse.json({ success: true });
}
