// Vitrin "Hesabım" (8 Eki 2026, önce Lucatech): kişiye özel bayi şifresiyle
// girene siparişlerim / tekrar sipariş / bilgilerim / adreslerim. Şifre kapısı
// proxy'de uygulanır; kimlik ve yetki /api/storefront/account'ta çerezden.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountView } from "@/components/storefront/account-view";
import { getStorefrontTenantCached, getTenantStorefrontSettings } from "@/lib/data";
import { getAppearanceFromSettings } from "@/lib/storefront/appearance";
import { StorefrontLocaleProvider } from "@/lib/storefront/locale-context";
import { buildStorefrontIcons, buildStorefrontTitle, hasAccountPage } from "@/lib/storefront/white-label";

type AccountPageProps = { params: Promise<{ subdomain: string }> };

export async function generateMetadata(props: AccountPageProps): Promise<Metadata> {
  const { subdomain } = await props.params;
  const tenant = await getStorefrontTenantCached(subdomain);
  if (!tenant) return {};
  const settings = await getTenantStorefrontSettings(tenant.id);
  return {
    title: buildStorefrontTitle("Hesabım", tenant),
    icons: buildStorefrontIcons(settings.site_favicon_url, tenant),
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default async function AccountPage(props: AccountPageProps) {
  const { subdomain } = await props.params;
  const tenant = await getStorefrontTenantCached(subdomain);
  if (!tenant || tenant.status !== "active" || !hasAccountPage(tenant)) notFound();
  const settings = await getTenantStorefrontSettings(tenant.id);

  return (
    <StorefrontLocaleProvider
      subdomain={subdomain}
      initialLocale={settings.default_locale}
      pickupWording={Boolean(tenant.is_tekel)}
    >
      <AccountView
        subdomain={subdomain}
        tenantName={settings.storefront_title?.trim() || tenant.company_name}
        logoUrl={settings.logo_url ?? null}
        appearance={getAppearanceFromSettings(settings)}
      />
    </StorefrontLocaleProvider>
  );
}
