import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { shouldAllowDemoFallback } from "@/lib/env";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildTenantFaviconPath,
  STOREFRONT_BRANDING_BUCKET,
} from "@/lib/storage/branding";
import { getStorageObjectPathFromPublicUrl } from "@/lib/storage/storage-helpers";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import {
  allowedFaviconMimeTypes,
  maxFaviconFileSizeBytes,
} from "@/lib/validators/storefront-settings";

export async function POST(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const formData = await request.formData();
  const favicon = formData.get("favicon");

  if (!(favicon instanceof File)) {
    return NextResponse.json({ error: "Favicon dosyası zorunludur." }, { status: 400 });
  }

  if (!allowedFaviconMimeTypes.includes(favicon.type as (typeof allowedFaviconMimeTypes)[number])) {
    return NextResponse.json(
      { error: "Favicon yalnız PNG, JPEG, WEBP veya ICO olabilir." },
      { status: 400 },
    );
  }

  if (favicon.size > maxFaviconFileSizeBytes) {
    return NextResponse.json(
      { error: "Favicon boyutu en fazla 512KB olabilir." },
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
      storefrontSettings: {
        site_favicon_url: `https://example.com/${session.tenant!.id}/branding/favicon-${favicon.name}`,
      },
    });
  }

  const { data: existingSettings } = await supabase
    .from("tenant_storefront_settings")
    .select("site_favicon_url, theme_key, logo_url, storefront_title, storefront_description, banner_items, site_tab_title")
    .eq("tenant_id", session.tenant!.id)
    .maybeSingle();

  const filePath = buildTenantFaviconPath({
    tenantId: session.tenant!.id,
    fileName: favicon.name,
  });

  const { error: uploadError } = await supabase.storage
    .from(STOREFRONT_BRANDING_BUCKET)
    .upload(filePath, favicon, {
      upsert: true,
      contentType: favicon.type,
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
        logo_url: existingSettings?.logo_url ?? null,
        storefront_title: existingSettings?.storefront_title ?? null,
        storefront_description: existingSettings?.storefront_description ?? null,
        banner_items: existingSettings?.banner_items ?? [],
        site_tab_title: existingSettings?.site_tab_title ?? null,
        site_favicon_url: publicUrlData.publicUrl,
      },
      { onConflict: "tenant_id" },
    )
    .select("*")
    .single();

  if (storefrontError) {
    await supabase.storage.from(STOREFRONT_BRANDING_BUCKET).remove([filePath]);
    return NextResponse.json({ error: storefrontError.message }, { status: 400 });
  }

  const oldFaviconPath = getStorageObjectPathFromPublicUrl(
    existingSettings?.site_favicon_url ?? null,
    STOREFRONT_BRANDING_BUCKET,
  );

  if (oldFaviconPath && oldFaviconPath !== filePath) {
    await supabase.storage.from(STOREFRONT_BRANDING_BUCKET).remove([oldFaviconPath]);
  }

  revalidateStorefrontCache({
    tenantId: session.tenant!.id,
    subdomain: session.tenant!.subdomain,
  });

  return NextResponse.json({ storefrontSettings });
}
