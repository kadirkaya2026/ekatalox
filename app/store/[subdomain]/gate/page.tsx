// ISR: bu sayfa çerez okumaz; ilk anonim ziyaretin CDN'den anında dönmesi
// için statik üretilir. Tenant ayarı değişince revalidateStorefrontCache
// bu yolu da tazeler.
export const revalidate = 300;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PasswordGate } from "@/components/storefront/password-gate";
import { StoreClosedNotice } from "@/components/storefront/store-closed-notice";
import { StorefrontSuspendedNotice } from "@/components/storefront/storefront-suspended-notice";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { StorefrontLocaleProvider } from "@/lib/storefront/locale-context";
import { isTrialExpired } from "@/lib/billing/trial";
import { getStorefrontTenantCached, getTenantStorefrontSettings } from "@/lib/data";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata(
  props: PageProps<"/store/[subdomain]/gate">,
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

export default async function StorefrontGatePage(
  props: PageProps<"/store/[subdomain]/gate">,
) {
  const { subdomain } = await props.params;
  const tenant = await getStorefrontTenantCached(subdomain);

  if (!tenant) {
    notFound();
  }

  if (tenant.status === "suspended") {
    const settings = await getTenantStorefrontSettings(tenant.id);

    return (
      <StorefrontLocaleProvider subdomain={subdomain} initialLocale={settings.default_locale}>
        <StorefrontSuspendedNotice />
      </StorefrontLocaleProvider>
    );
  }

  if (isTrialExpired(tenant)) {
    const settings = await getTenantStorefrontSettings(tenant.id);

    return (
      <StorefrontLocaleProvider subdomain={subdomain} initialLocale={settings.default_locale}>
        <StoreClosedNotice />
      </StorefrontLocaleProvider>
    );
  }

  const settings = await getTenantStorefrontSettings(tenant.id);

  return (
    <StorefrontPageShell storefrontSettings={settings} subdomain={subdomain}>
      <PasswordGate
        subdomain={subdomain}
        companyName={tenant.company_name}
        themeKey={settings.theme_key}
      />
    </StorefrontPageShell>
  );
}
