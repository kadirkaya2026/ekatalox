// ISR: proxy.ts bu sayfaya, tenant'ın aylık ziyaretçi kotası dolduğunda
// oturum çerezinden bağımsız olarak yönlendirir. Kota altındaki bütün
// trafiği karşılayacağı için CDN'den statik dönmesi kritik.
export const revalidate = 300;

import type { Metadata } from "next";
import { buildStorefrontIcons, buildStorefrontTitle, isWhiteLabelStorefront } from "@/lib/storefront/white-label";
import { notFound } from "next/navigation";
import { VisitorQuotaNotice } from "@/components/storefront/visitor-quota-notice";
import { getStorefrontTenantCached, getTenantStorefrontSettings } from "@/lib/data";
import { StorefrontLocaleProvider } from "@/lib/storefront/locale-context";
import { getAppearanceFromSettings } from "@/lib/storefront/appearance";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata(
  props: PageProps<"/store/[subdomain]/yogunluk">,
): Promise<Metadata> {
  const { subdomain } = await props.params;
  const tenant = await getStorefrontTenantCached(subdomain);

  if (!tenant) {
    return {};
  }

  const settings = await getTenantStorefrontSettings(tenant.id);
  const title =
    settings.site_tab_title ?? settings.storefront_title ?? tenant.company_name;

  return {
    title: buildStorefrontTitle(title, tenant),
    icons: buildStorefrontIcons(settings.site_favicon_url, tenant),
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default async function StorefrontVisitorQuotaPage(
  props: PageProps<"/store/[subdomain]/yogunluk">,
) {
  const { subdomain } = await props.params;
  const tenant = await getStorefrontTenantCached(subdomain);

  if (!tenant) {
    notFound();
  }

  const settings = await getTenantStorefrontSettings(tenant.id);

  return (
    <StorefrontLocaleProvider subdomain={subdomain} initialLocale={settings.default_locale}>
      <VisitorQuotaNotice appearance={getAppearanceFromSettings(settings)} />
    </StorefrontLocaleProvider>
  );
}
