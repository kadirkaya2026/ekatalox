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
import {
  requestTouchesAdvancedAppearance,
  requestTouchesBannerSettings,
  requestTouchesHomepageBlocks,
  requestTouchesPaymentSettings,
} from "@/lib/billing/plans";
import { ensureTenantAdminResponse, ensureTenantPlanFeatureResponse } from "@/lib/tenancy/guards";
import { storefrontSettingsSchema } from "@/lib/validators/storefront-settings";
import { isHeroOnlyVisibilityChange, isHomepageBlockVisible } from "@/lib/storefront/homepage-blocks";

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
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const body = await request.json();

  const supabase = createSupabaseAdminClient();

  let existingSettings = getDefaultTenantStorefrontSettings(
    session.tenant!.id,
    session.tenant!.subdomain,
  );

  if (supabase) {
    const { data } = await supabase
      .from("tenant_storefront_settings")
      .select(
        "tenant_id, theme_key, layout_key, logo_url, storefront_title, storefront_description, banner_items, site_tab_title, site_favicon_url, announcement_title, announcement_body, is_active, version, max_display_count, card_installment_options, is_cash_discount_active, cash_discount_note, is_card_campaign_active, card_campaign_note, cash_discount_tiers, card_campaign_tiers, price_update_date, is_price_update_date_visible, is_footer_visible, is_footer_logo_visible, is_footer_social_visible, is_footer_location_visible, is_footer_copyright_visible, footer_location, footer_copyright, footer_instagram_url, footer_youtube_url, footer_x_url, footer_facebook_url, footer_whatsapp, is_footer_instagram_visible, is_footer_youtube_visible, is_footer_x_visible, is_footer_facebook_visible, is_footer_whatsapp_visible, footer_website_url, is_footer_website_visible, footer_phone, footer_email, is_footer_contact_visible, recommendation_mode, default_locale",
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

  if (requestTouchesPaymentSettings(body)) {
    const paymentGuard = await ensureTenantPlanFeatureResponse("payment_settings");
    if (paymentGuard) {
      return paymentGuard;
    }
  }

  if (requestTouchesBannerSettings(body)) {
    const bannerGuard = await ensureTenantPlanFeatureResponse("banner_settings");
    if (bannerGuard) {
      return bannerGuard;
    }
  }

  if (requestTouchesAdvancedAppearance(body)) {
    const appearanceGuard = await ensureTenantPlanFeatureResponse("advanced_appearance");
    if (appearanceGuard) {
      return appearanceGuard;
    }
  }

  if (
    requestTouchesHomepageBlocks(body) &&
    !isHeroOnlyVisibilityChange(existingSettings.homepage_blocks, body.homepage_blocks)
  ) {
    const blocksGuard = await ensureTenantPlanFeatureResponse("homepage_blocks_editor");
    if (blocksGuard) {
      return blocksGuard;
    }
  }

  const parsed = storefrontSettingsSchema.safeParse({
    whatsapp_number: body.whatsapp_number ?? session.tenant!.whatsapp_number,
    is_whatsapp_order_direct:
      body.is_whatsapp_order_direct ??
      session.tenant!.is_whatsapp_order_direct ??
      true,
    storefront_title: body.storefront_title ?? existingSettings.storefront_title,
    storefront_description:
      body.storefront_description ?? existingSettings.storefront_description,
    hero_heading: body.hero_heading ?? existingSettings.hero_heading,
    hero_cta_label: body.hero_cta_label ?? existingSettings.hero_cta_label,
    hero_image_url:
      "hero_image_url" in body ? body.hero_image_url : existingSettings.hero_image_url,
    hero_style_key: body.hero_style_key ?? existingSettings.hero_style_key,
    is_hero_visible: body.is_hero_visible ?? existingSettings.is_hero_visible,
    brand_primary_color:
      "brand_primary_color" in body
        ? body.brand_primary_color
        : existingSettings.brand_primary_color,
    brand_accent_color:
      "brand_accent_color" in body
        ? body.brand_accent_color
        : existingSettings.brand_accent_color,
    font_key: body.font_key ?? existingSettings.font_key,
    product_card_style: body.product_card_style ?? existingSettings.product_card_style,
    header_style_key: body.header_style_key ?? existingSettings.header_style_key,
    footer_style_key: body.footer_style_key ?? existingSettings.footer_style_key,
    homepage_blocks: body.homepage_blocks ?? existingSettings.homepage_blocks,
    banner_items: body.banner_items ?? existingSettings.banner_items,
    theme_key: body.theme_key ?? existingSettings.theme_key,
    layout_key: body.layout_key ?? existingSettings.layout_key,
    site_tab_title: body.site_tab_title ?? existingSettings.site_tab_title,
    site_favicon_url: body.site_favicon_url ?? existingSettings.site_favicon_url,
    announcement_title:
      body.announcement_title ?? existingSettings.announcement_title,
    announcement_body: body.announcement_body ?? existingSettings.announcement_body,
    is_active: body.is_active ?? existingSettings.is_active,
    max_display_count:
      body.max_display_count ?? existingSettings.max_display_count,
    card_installment_options:
      body.card_installment_options ?? existingSettings.card_installment_options,
    is_cash_discount_active:
      body.is_cash_discount_active ?? existingSettings.is_cash_discount_active,
    cash_discount_note:
      body.cash_discount_note ?? existingSettings.cash_discount_note,
    is_card_campaign_active:
      body.is_card_campaign_active ?? existingSettings.is_card_campaign_active,
    card_campaign_note:
      body.card_campaign_note ?? existingSettings.card_campaign_note,
    cash_discount_tiers:
      body.cash_discount_tiers ?? existingSettings.cash_discount_tiers,
    card_campaign_tiers:
      body.card_campaign_tiers ?? existingSettings.card_campaign_tiers,
    price_update_date:
      body.price_update_date ?? existingSettings.price_update_date,
    is_price_update_date_visible:
      body.is_price_update_date_visible ??
      existingSettings.is_price_update_date_visible,
    is_footer_visible: body.is_footer_visible ?? existingSettings.is_footer_visible,
    is_footer_logo_visible:
      body.is_footer_logo_visible ?? existingSettings.is_footer_logo_visible,
    is_footer_social_visible:
      body.is_footer_social_visible ?? existingSettings.is_footer_social_visible,
    is_footer_location_visible:
      body.is_footer_location_visible ?? existingSettings.is_footer_location_visible,
    is_footer_copyright_visible:
      body.is_footer_copyright_visible ?? existingSettings.is_footer_copyright_visible,
    footer_location: body.footer_location ?? existingSettings.footer_location,
    footer_copyright: body.footer_copyright ?? existingSettings.footer_copyright,
    footer_instagram_url:
      body.footer_instagram_url ?? existingSettings.footer_instagram_url,
    footer_youtube_url: body.footer_youtube_url ?? existingSettings.footer_youtube_url,
    footer_x_url: body.footer_x_url ?? existingSettings.footer_x_url,
    footer_facebook_url:
      body.footer_facebook_url ?? existingSettings.footer_facebook_url,
    footer_whatsapp: body.footer_whatsapp ?? existingSettings.footer_whatsapp,
    is_footer_instagram_visible:
      body.is_footer_instagram_visible ?? existingSettings.is_footer_instagram_visible,
    is_footer_youtube_visible:
      body.is_footer_youtube_visible ?? existingSettings.is_footer_youtube_visible,
    is_footer_x_visible: body.is_footer_x_visible ?? existingSettings.is_footer_x_visible,
    is_footer_facebook_visible:
      body.is_footer_facebook_visible ?? existingSettings.is_footer_facebook_visible,
    is_footer_whatsapp_visible:
      body.is_footer_whatsapp_visible ?? existingSettings.is_footer_whatsapp_visible,
    footer_website_url:
      body.footer_website_url ?? existingSettings.footer_website_url,
    is_footer_website_visible:
      body.is_footer_website_visible ?? existingSettings.is_footer_website_visible,
    footer_phone: body.footer_phone ?? existingSettings.footer_phone,
    footer_email: body.footer_email ?? existingSettings.footer_email,
    is_footer_contact_visible:
      body.is_footer_contact_visible ?? existingSettings.is_footer_contact_visible,
    recommendation_mode:
      body.recommendation_mode ?? existingSettings.recommendation_mode,
    default_locale: body.default_locale ?? existingSettings.default_locale,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ayarlar doğrulanamadı." },
      { status: 400 },
    );
  }

  // homepage_blocks içindeki "hero" girdisinin görünürlüğü kanonik kaynaktır;
  // is_hero_visible artık client'tan güvenilmez, DB'de sadece bununla senkron
  // tutulur (bkz. StorefrontHeroBlock / storefront-client.tsx).
  const derivedIsHeroVisible = isHomepageBlockVisible(parsed.data.homepage_blocks, "hero");

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
        is_whatsapp_order_direct: parsed.data.is_whatsapp_order_direct,
      },
      storefrontSettings: {
        tenant_id: session.tenant!.id,
        theme_key: parsed.data.theme_key,
        layout_key: parsed.data.layout_key,
        logo_url: null,
        storefront_title: parsed.data.storefront_title,
        storefront_description: parsed.data.storefront_description,
        hero_heading: parsed.data.hero_heading,
        hero_cta_label: parsed.data.hero_cta_label,
        hero_image_url: parsed.data.hero_image_url,
        hero_style_key: parsed.data.hero_style_key,
        is_hero_visible: derivedIsHeroVisible,
        brand_primary_color: parsed.data.brand_primary_color,
        brand_accent_color: parsed.data.brand_accent_color,
        font_key: parsed.data.font_key,
        product_card_style: parsed.data.product_card_style,
        header_style_key: parsed.data.header_style_key,
        footer_style_key: parsed.data.footer_style_key,
        homepage_blocks: parsed.data.homepage_blocks,
        banner_items: parsed.data.banner_items,
        site_tab_title: parsed.data.site_tab_title,
        site_favicon_url: parsed.data.site_favicon_url,
        announcement_title: parsed.data.announcement_title,
        announcement_body: parsed.data.announcement_body,
        is_active: parsed.data.is_active,
        version: nextAnnouncementVersion,
        max_display_count: parsed.data.max_display_count,
        card_installment_options: parsed.data.card_installment_options,
        is_cash_discount_active: parsed.data.is_cash_discount_active,
        cash_discount_note: parsed.data.cash_discount_note,
        is_card_campaign_active: parsed.data.is_card_campaign_active,
        card_campaign_note: parsed.data.card_campaign_note,
        cash_discount_tiers: parsed.data.cash_discount_tiers,
        card_campaign_tiers: parsed.data.card_campaign_tiers,
        price_update_date: parsed.data.price_update_date,
        is_price_update_date_visible: parsed.data.is_price_update_date_visible,
        is_footer_visible: parsed.data.is_footer_visible,
        is_footer_logo_visible: parsed.data.is_footer_logo_visible,
        is_footer_social_visible: parsed.data.is_footer_social_visible,
        is_footer_location_visible: parsed.data.is_footer_location_visible,
        is_footer_copyright_visible: parsed.data.is_footer_copyright_visible,
        footer_location: parsed.data.footer_location,
        footer_copyright: parsed.data.footer_copyright,
        footer_instagram_url: parsed.data.footer_instagram_url,
        footer_youtube_url: parsed.data.footer_youtube_url,
        footer_x_url: parsed.data.footer_x_url,
        footer_facebook_url: parsed.data.footer_facebook_url,
        footer_whatsapp: parsed.data.footer_whatsapp,
        is_footer_instagram_visible: parsed.data.is_footer_instagram_visible,
        is_footer_youtube_visible: parsed.data.is_footer_youtube_visible,
        is_footer_x_visible: parsed.data.is_footer_x_visible,
        is_footer_facebook_visible: parsed.data.is_footer_facebook_visible,
        is_footer_whatsapp_visible: parsed.data.is_footer_whatsapp_visible,
        footer_website_url: parsed.data.footer_website_url,
        is_footer_website_visible: parsed.data.is_footer_website_visible,
        footer_phone: parsed.data.footer_phone,
        footer_email: parsed.data.footer_email,
        is_footer_contact_visible: parsed.data.is_footer_contact_visible,
        recommendation_mode: parsed.data.recommendation_mode,
        default_locale: parsed.data.default_locale,
      },
    });
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .update({
      whatsapp_number: parsed.data.whatsapp_number,
      is_whatsapp_order_direct: parsed.data.is_whatsapp_order_direct,
    })
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
    layout_key: parsed.data.layout_key,
    storefront_title: parsed.data.storefront_title,
    storefront_description: parsed.data.storefront_description,
    hero_heading: parsed.data.hero_heading,
    hero_cta_label: parsed.data.hero_cta_label,
    hero_image_url: parsed.data.hero_image_url,
    hero_style_key: parsed.data.hero_style_key,
    is_hero_visible: derivedIsHeroVisible,
    brand_primary_color: parsed.data.brand_primary_color,
    brand_accent_color: parsed.data.brand_accent_color,
    font_key: parsed.data.font_key,
    product_card_style: parsed.data.product_card_style,
    header_style_key: parsed.data.header_style_key,
    footer_style_key: parsed.data.footer_style_key,
    homepage_blocks: parsed.data.homepage_blocks,
    banner_items: parsed.data.banner_items,
    site_tab_title: parsed.data.site_tab_title,
    site_favicon_url: parsed.data.site_favicon_url,
    announcement_title: parsed.data.announcement_title,
    announcement_body: parsed.data.announcement_body,
    is_active: parsed.data.is_active,
    version: nextAnnouncementVersion,
    max_display_count: parsed.data.max_display_count,
    card_installment_options: parsed.data.card_installment_options,
    is_cash_discount_active: parsed.data.is_cash_discount_active,
    cash_discount_note: parsed.data.cash_discount_note ?? null,
    is_card_campaign_active: parsed.data.is_card_campaign_active,
    card_campaign_note: parsed.data.card_campaign_note ?? null,
    cash_discount_tiers: parsed.data.cash_discount_tiers,
    card_campaign_tiers: parsed.data.card_campaign_tiers,
    price_update_date: parsed.data.price_update_date,
    is_price_update_date_visible: parsed.data.is_price_update_date_visible,
    is_footer_visible: parsed.data.is_footer_visible,
    is_footer_logo_visible: parsed.data.is_footer_logo_visible,
    is_footer_social_visible: parsed.data.is_footer_social_visible,
    is_footer_location_visible: parsed.data.is_footer_location_visible,
    is_footer_copyright_visible: parsed.data.is_footer_copyright_visible,
    footer_location: parsed.data.footer_location,
    footer_copyright: parsed.data.footer_copyright,
    footer_instagram_url: parsed.data.footer_instagram_url,
    footer_youtube_url: parsed.data.footer_youtube_url,
    footer_x_url: parsed.data.footer_x_url,
    footer_facebook_url: parsed.data.footer_facebook_url,
    footer_whatsapp: parsed.data.footer_whatsapp,
    is_footer_instagram_visible: parsed.data.is_footer_instagram_visible,
    is_footer_youtube_visible: parsed.data.is_footer_youtube_visible,
    is_footer_x_visible: parsed.data.is_footer_x_visible,
    is_footer_facebook_visible: parsed.data.is_footer_facebook_visible,
    is_footer_whatsapp_visible: parsed.data.is_footer_whatsapp_visible,
    footer_website_url: parsed.data.footer_website_url,
    is_footer_website_visible: parsed.data.is_footer_website_visible,
    footer_phone: parsed.data.footer_phone,
    footer_email: parsed.data.footer_email,
    is_footer_contact_visible: parsed.data.is_footer_contact_visible,
    recommendation_mode: parsed.data.recommendation_mode,
    default_locale: parsed.data.default_locale,
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

  try {
    revalidateStorefrontCache({
      tenantId: session.tenant!.id,
      subdomain: session.tenant!.subdomain,
    });
  } catch {
    // Kayıt başarılı; cache revalidation hatası yanıtı bozmasın.
  }

  return NextResponse.json({ tenant, storefrontSettings });
}
