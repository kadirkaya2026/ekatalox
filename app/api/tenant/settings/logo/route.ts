import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { shouldAllowDemoFallback } from "@/lib/env";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildTenantBrandingPath,
  STOREFRONT_BRANDING_BUCKET,
} from "@/lib/storage/branding";
import { getStorageObjectPathFromPublicUrl } from "@/lib/storage/storage-helpers";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import {
  allowedLogoMimeTypes,
  maxLogoFileSizeBytes,
} from "@/lib/validators/storefront-settings";

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const formData = await request.formData();
  const logo = formData.get("logo");

  if (!(logo instanceof File)) {
    return NextResponse.json({ error: "Logo dosyası zorunludur." }, { status: 400 });
  }

  if (!allowedLogoMimeTypes.includes(logo.type as (typeof allowedLogoMimeTypes)[number])) {
    return NextResponse.json(
      { error: "Logo yalnız PNG, JPEG veya WEBP olabilir." },
      { status: 400 },
    );
  }

  if (logo.size > maxLogoFileSizeBytes) {
    return NextResponse.json(
      { error: "Logo boyutu en fazla 1MB olabilir." },
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
      logo_url: `https://example.com/${session.tenant!.id}/branding/${logo.name}`,
    });
  }

  const { data: existingSettings } = await supabase
    .from("tenant_storefront_settings")
    .select("logo_url, theme_key, storefront_title, storefront_description, hero_heading, hero_cta_label")
    .eq("tenant_id", session.tenant!.id)
    .maybeSingle();

  const filePath = buildTenantBrandingPath({
    tenantId: session.tenant!.id,
    fileName: logo.name,
  });

  const { error: uploadError } = await supabase.storage
    .from(STOREFRONT_BRANDING_BUCKET)
    .upload(filePath, logo, {
      upsert: true,
      contentType: logo.type,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data: publicUrlData } = supabase.storage
    .from(STOREFRONT_BRANDING_BUCKET)
    .getPublicUrl(filePath);

  const { data: storefrontSettings, error: storefrontError } = await supabase
    .from("tenant_storefront_settings")
    .upsert(
      {
        tenant_id: session.tenant!.id,
        theme_key: existingSettings?.theme_key ?? "minimal",
        storefront_title: existingSettings?.storefront_title ?? null,
        storefront_description: existingSettings?.storefront_description ?? null,
        hero_heading: existingSettings?.hero_heading ?? null,
        hero_cta_label: existingSettings?.hero_cta_label ?? null,
        logo_url: publicUrlData.publicUrl,
      },
      { onConflict: "tenant_id" },
    )
    .select("*")
    .single();

  if (storefrontError) {
    await supabase.storage.from(STOREFRONT_BRANDING_BUCKET).remove([filePath]);
    return NextResponse.json({ error: storefrontError.message }, { status: 400 });
  }

  const oldLogoPath = getStorageObjectPathFromPublicUrl(
    existingSettings?.logo_url ?? null,
    STOREFRONT_BRANDING_BUCKET,
  );

  if (oldLogoPath && oldLogoPath !== filePath) {
    await supabase.storage.from(STOREFRONT_BRANDING_BUCKET).remove([oldLogoPath]);
  }

  revalidateStorefrontCache({
    tenantId: session.tenant!.id,
    subdomain: session.tenant!.subdomain,
  });

  return NextResponse.json({ storefrontSettings });
}