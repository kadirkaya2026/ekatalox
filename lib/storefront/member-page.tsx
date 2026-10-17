// Market/tekel üyelik sayfaları (/giris, /uye-ol, /hesabim/*) için ortak sunucu
// yükleyici ve sarmalayıcı (17 Eki 2026). Oturum çerezi sunucuda okunur:
// giriş yapmamış /hesabim'a girerse /giris'e, giriş yapmış /giris'e girerse
// /hesabim'a yönlenir — sayfalar arası geri tuşu doğal tarayıcı geçmişiyle çalışır.
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getStorefrontTenantCached, getTenantStorefrontSettings } from "@/lib/data";
import { getAppearanceFromSettings } from "@/lib/storefront/appearance";
import { StorefrontLocaleProvider } from "@/lib/storefront/locale-context";
import { StorefrontThemeProvider } from "@/lib/storefront/theme-context";
import { hasStoreMembership, readMemberForTenant } from "@/lib/storefront/member";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { toWhatsAppDigits } from "@/lib/storefront/customer-phone";
import { buildStorefrontIcons, buildStorefrontTitle } from "@/lib/storefront/white-label";

export async function loadMemberPage(subdomain: string) {
  const tenant = await getStorefrontTenantCached(subdomain);
  if (!tenant || tenant.status !== "active" || !hasStoreMembership(tenant)) return null;
  const settings = await getTenantStorefrontSettings(tenant.id);
  const supabase = createSupabaseAdminClient();
  const member = supabase ? await readMemberForTenant(supabase, tenant.id) : null;
  return {
    tenant,
    settings,
    member,
    storeName: settings.storefront_title?.trim() || tenant.company_name,
    whatsapp: toWhatsAppDigits(tenant.whatsapp_number),
  };
}

export async function memberPageMetadata(subdomain: string, title: string): Promise<Metadata> {
  const tenant = await getStorefrontTenantCached(subdomain);
  if (!tenant) return {};
  const settings = await getTenantStorefrontSettings(tenant.id);
  return {
    title: buildStorefrontTitle(title, tenant),
    icons: buildStorefrontIcons(settings.site_favicon_url, tenant),
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export function MemberPageProviders({
  page,
  subdomain,
  children,
}: {
  page: NonNullable<Awaited<ReturnType<typeof loadMemberPage>>>;
  subdomain: string;
  children: ReactNode;
}) {
  const appearance = getAppearanceFromSettings(page.settings);
  return (
    <StorefrontLocaleProvider subdomain={subdomain} initialLocale={page.settings.default_locale} pickupWording={Boolean(page.tenant.is_tekel)}>
      <StorefrontThemeProvider
        themeKey={appearance.theme_key ?? "minimal"}
        brandPrimaryColor={appearance.brand_primary_color}
        brandAccentColor={appearance.brand_accent_color}
        brandPalette={appearance.brand_palette}
      >
        {children}
      </StorefrontThemeProvider>
    </StorefrontLocaleProvider>
  );
}
