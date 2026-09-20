import { cache } from "react";
import { planShowsStorefrontAds } from "@/lib/billing/plans";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Tenant } from "@/lib/types";
import {
  DEFAULT_STOREFRONT_ADS_CONFIG,
  normalizeStorefrontAdsConfig,
  STOREFRONT_ADS_SETTINGS_KEY,
  type StorefrontAdsConfig,
} from "@/lib/ads/config";

// platform_settings tablosu (0125) henüz uygulanmadıysa ya da satır yoksa
// sessizce varsayılana düşer — vitrin hiçbir zaman bu yüzden çökmemeli.
export const getStorefrontAdsConfig = cache(async function getStorefrontAdsConfig(): Promise<StorefrontAdsConfig> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return DEFAULT_STOREFRONT_ADS_CONFIG;

  try {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", STOREFRONT_ADS_SETTINGS_KEY)
      .maybeSingle();

    if (error || !data) return DEFAULT_STOREFRONT_ADS_CONFIG;
    return normalizeStorefrontAdsConfig(data.value);
  } catch {
    return DEFAULT_STOREFRONT_ADS_CONFIG;
  }
});

export async function saveStorefrontAdsConfig(
  config: StorefrontAdsConfig,
  updatedBy?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Supabase production yapılandırması eksik." };

  const { error } = await supabase.from("platform_settings").upsert(
    {
      key: STOREFRONT_ADS_SETTINGS_KEY,
      value: config,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy ?? null,
    },
    { onConflict: "key" },
  );

  if (error) {
    const missingTable = /platform_settings/.test(error.message) && /does not exist|schema cache/i.test(error.message);
    return {
      ok: false,
      error: missingTable
        ? "platform_settings tablosu yok. supabase/migrations/0125_freemium_ads.sql dosyasını SQL Editor'den uygulayın."
        : error.message,
    };
  }
  return { ok: true };
}

/**
 * Bu vitrinde reklam gösterilecek mi? Ücretsiz plan + ana şalter açık ise
 * yapılandırmayı, aksi halde null döner. Sayfalar/route'lar bunu tek yerden alır.
 */
export async function resolveStorefrontAds(
  tenant: Pick<Tenant, "plan">,
): Promise<StorefrontAdsConfig | null> {
  if (!planShowsStorefrontAds(tenant.plan)) return null;
  const config = await getStorefrontAdsConfig();
  return config.enabled ? config : null;
}
