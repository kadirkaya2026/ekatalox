// Başlıktaki "Sipariş Takip" ikonu. Market/tekel: üye girişi + siparişler
// (0180); toptancı takip mağazaları: telefon numarasıyla liste. Girişsiz; proxy.ts şifre/yaş/kota kapılarından önce buraya yazar.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MyOrdersView } from "@/components/storefront/my-orders-view";
import { getStorefrontTenantCached, getTenantStorefrontSettings } from "@/lib/data";
import { getAppearanceFromSettings } from "@/lib/storefront/appearance";
import { StorefrontLocaleProvider } from "@/lib/storefront/locale-context";
import { hasStoreMembership } from "@/lib/storefront/member";
import { buildStorefrontIcons, buildStorefrontTitle, hasOrderTracking } from "@/lib/storefront/white-label";

type MyOrdersPageProps = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ sifirla?: string | string[] }>;
};

export async function generateMetadata(props: MyOrdersPageProps): Promise<Metadata> {
  const { subdomain } = await props.params;
  const tenant = await getStorefrontTenantCached(subdomain);
  if (!tenant) return {};
  const settings = await getTenantStorefrontSettings(tenant.id);
  return {
    title: buildStorefrontTitle("Sipariş Takip", tenant),
    icons: buildStorefrontIcons(settings.site_favicon_url, tenant),
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default async function MyOrdersPage(props: MyOrdersPageProps) {
  const { subdomain } = await props.params;
  const tenant = await getStorefrontTenantCached(subdomain);
  if (!tenant || tenant.status !== "active" || !hasOrderTracking(tenant)) notFound();
  const settings = await getTenantStorefrontSettings(tenant.id);
  const { sifirla } = await props.searchParams;

  return (
    <StorefrontLocaleProvider
      subdomain={subdomain}
      initialLocale={settings.default_locale}
      pickupWording={Boolean(tenant.is_tekel)}
    >
      <MyOrdersView
        subdomain={subdomain}
        tenantName={settings.storefront_title?.trim() || tenant.company_name}
        logoUrl={settings.logo_url ?? null}
        isTekel={Boolean(tenant.is_tekel)}
        membership={hasStoreMembership(tenant)}
        resetToken={typeof sifirla === "string" ? sifirla : null}
        appearance={getAppearanceFromSettings(settings)}
      />
    </StorefrontLocaleProvider>
  );
}
