// ISR: proxy.ts bu sayfaya, tenant'ın aylık ziyaretçi kotası dolduğunda
// oturum çerezinden bağımsız olarak yönlendirir. Kota altındaki bütün
// trafiği karşılayacağı için CDN'den statik dönmesi kritik.
export const revalidate = 300;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VisitorQuotaNotice } from "@/components/storefront/visitor-quota-notice";
import { getStorefrontTenantCached, getTenantStorefrontSettings } from "@/lib/data";

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
    title,
    icons: settings.site_favicon_url
      ? { icon: settings.site_favicon_url }
      : undefined,
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

  return <VisitorQuotaNotice />;
}
