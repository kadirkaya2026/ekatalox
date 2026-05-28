import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { shouldAllowDemoFallback } from "@/lib/env";
import { getDefaultTenantStorefrontSettings } from "@/lib/data";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getBannerObjectPath,
  STOREFRONT_BANNERS_BUCKET,
} from "@/lib/storage/banners";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { storefrontSettingsSchema } from "@/lib/validators/storefront-settings";

function hasAnnouncementChanged(
  existingSettings: {
    announcement_title: string | null;
    announcement_body: string | null;
    max_display_count: number;
  },
  nextSettings: {
    announcement_title: string | null;
    announcement_body: string | null;
    max_display_count: number;
  },
) {
  return (
    existingSettings.announcement_title !== nextSettings.announcement_title ||
    existingSettings.announcement_body !== nextSettings.announcement_body ||
    existingSettings.max_display_count !== nextSettings.max_display_count
  );
}

function getNextAnnouncementVersion(params: {
  previousVersion: number;
  wasActive: boolean;
  willBeActive: boolean;
  announcementChanged: boolean;
}) {
  if (!params.willBeActive) {
    return params.previousVersion;
  }

  if (params.previousVersion <= 0) {
    return 1;
  }

  if (!params.wasActive || params.announcementChanged) {
    return params.previousVersion + 1;
  }

  return params.previousVersion;
}

export async function PATCH(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const body = await request.json();
  const supabase = createSupabaseAdminClient();

  let existingSettings = getDefaultTenantStorefrontSettings(session.tenant!.id);

  if (supabase) {
    const { data } = await supabase
      .from("tenant_storefront_settings")
      .select(
        "tenant_id, theme_key, logo_url, storefront_title, storefront_description, banner_items, site_tab_title, site_favicon_url, announcement_title, announcement_body, is_active, version, max_display_count, discount_threshold, discount_percentage, is_discount_active, discount_condition_note",
      )
      .eq("tenant_id", session.tenant!.id)
      .maybeSingle();

    if (data) {
      existingSettings = {
        ...existingSettings,
        ...data,
      };
    }
  }

  const parsed = storefrontSettingsSchema.safeParse({
    whatsapp_number: body.whatsapp_number ?? session.tenant!.whatsapp_number,
    storefront_title: body.storefront_title ?? existingSettings.storefront_title,
    storefront_description:
      body.storefront_description ?? existingSettings.storefront_description,
    banner_items: body.banner_items ?? existingSettings.banner_items,
    theme_key: body.theme_key ?? existingSettings.theme_key,
    site_tab_title: body.site_tab_title ?? existingSettings.site_tab_title,
    site_favicon_url: body.site_favicon_url ?? existingSettings.site_favicon_url,
    announcement_title:
      body.announcement_title ?? existingSettings.announcement_title,
    announcement_body: body.announcement_body ?? existingSettings.announcement_body,
    is_active: body.is_active ?? existingSettings.is_active,
    max_display_count:
      body.max_display_count ?? existingSettings.max_display_count,
    discount_threshold:
      body.discount_threshold ?? existingSettings.discount_threshold,
    discount_percentage:
      body.discount_percentage ?? existingSettings.discount_percentage,
    is_discount_active:
      body.is_discount_active ?? existingSettings.is_discount_active,
    discount_condition_note:
      body.discount_condition_note ?? existingSettings.discount_condition_note,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ayarlar doğrulanamadı." },
      { status: 400 },
    );
  }

  const nextAnnouncementVersion = getNextAnnouncementVersion({
    previousVersion: existingSettings.version,
    wasActive: existingSettings.is_active,
    willBeActive: parsed.data.is_active,
    announcementChanged: hasAnnouncementChanged(
      {
        announcement_title: existingSettings.announcement_title,
        announcement_body: existingSettings.announcement_body,
        max_display_count: existingSettings.max_display_count,
      },
      {
        announcement_title: parsed.data.announcement_title,
        announcement_body: parsed.data.announcement_body,
        max_display_count: parsed.data.max_display_count,
      },
    ),
  });

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      tenant: {
        ...session.tenant,
        whatsapp_number: parsed.data.whatsapp_number,
      },
      storefrontSettings: {
        tenant_id: session.tenant!.id,
        theme_key: parsed.data.theme_key,
        logo_url: null,
        storefront_title: parsed.data.storefront_title,
        storefront_description: parsed.data.storefront_description,
        banner_items: parsed.data.banner_items,
        site_tab_title: parsed.data.site_tab_title,
        site_favicon_url: parsed.data.site_favicon_url,
        announcement_title: parsed.data.announcement_title,
        announcement_body: parsed.data.announcement_body,
        is_active: parsed.data.is_active,
        version: nextAnnouncementVersion,
        max_display_count: parsed.data.max_display_count,
        discount_threshold: parsed.data.discount_threshold,
        discount_percentage: parsed.data.discount_percentage,
        is_discount_active: parsed.data.is_discount_active,
        discount_condition_note: parsed.data.discount_condition_note,
      },
    });
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .update({ whatsapp_number: parsed.data.whatsapp_number })
    .eq("id", session.tenant!.id)
    .select("*")
    .single();

  if (tenantError) {
    return NextResponse.json({ error: tenantError.message }, { status: 400 });
  }

  const previousManagedBannerPaths = new Set(
    (existingSettings.banner_items ?? [])
      .map((item) => getBannerObjectPath(item.image_url))
      .filter((path): path is string => typeof path === "string")
      .filter((path) => path.startsWith(`${session.tenant!.id}/`)),
  );
  const nextManagedBannerPaths = new Set(
    parsed.data.banner_items
      .map((item) => getBannerObjectPath(item.image_url))
      .filter((path): path is string => typeof path === "string")
      .filter((path) => path.startsWith(`${session.tenant!.id}/`)),
  );

  const storefrontPayload = {
    tenant_id: session.tenant!.id,
    theme_key: parsed.data.theme_key,
    storefront_title: parsed.data.storefront_title,
    storefront_description: parsed.data.storefront_description,
    banner_items: parsed.data.banner_items,
    site_tab_title: parsed.data.site_tab_title,
    site_favicon_url: parsed.data.site_favicon_url,
    announcement_title: parsed.data.announcement_title,
    announcement_body: parsed.data.announcement_body,
    is_active: parsed.data.is_active,
    version: nextAnnouncementVersion,
    max_display_count: parsed.data.max_display_count,
    discount_threshold: parsed.data.discount_threshold,
    discount_percentage: parsed.data.discount_percentage,
    is_discount_active: parsed.data.is_discount_active,
    discount_condition_note: parsed.data.discount_condition_note,
  };

  const { data: storefrontSettings, error: storefrontError } = await supabase
    .from("tenant_storefront_settings")
    .upsert(storefrontPayload, { onConflict: "tenant_id" })
    .select("*")
    .single();

  if (storefrontError) {
    return NextResponse.json({ error: storefrontError.message }, { status: 400 });
  }

  const staleBannerPaths = [...previousManagedBannerPaths].filter(
    (path) => !nextManagedBannerPaths.has(path),
  );

  if (staleBannerPaths.length) {
    await supabase.storage.from(STOREFRONT_BANNERS_BUCKET).remove(staleBannerPaths);
  }

  revalidateStorefrontCache({
    tenantId: session.tenant!.id,
    subdomain: session.tenant!.subdomain,
  });

  return NextResponse.json({ tenant, storefrontSettings });
}
