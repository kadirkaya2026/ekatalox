// ISR: bu sayfa çerez okumaz; ilk anonim ziyaretin CDN'den anında dönmesi
// için statik üretilir. Tenant ayarı değişince revalidateStorefrontCache
// bu yolu da tazeler.
export const revalidate = 300;

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PasswordGate } from "@/components/storefront/password-gate";
import { StoreClosedNotice } from "@/components/storefront/store-closed-notice";
import { StorefrontSuspendedNotice } from "@/components/storefront/storefront-suspended-notice";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { buildStorefrontIcons, buildStorefrontTitle, isWhiteLabelStorefront } from "@/lib/storefront/white-label";
import { StorefrontLocaleProvider } from "@/lib/storefront/locale-context";
import { getAppearanceFromSettings } from "@/lib/storefront/appearance";
import { isTrialExpired } from "@/lib/billing/trial";
import { getStorefrontTenantCached, getTenantStorefrontSettings } from "@/lib/data";
import { getStorefrontHomePath } from "@/lib/storefront/paths";

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
        <StorefrontSuspendedNotice appearance={getAppearanceFromSettings(settings)} />
      </StorefrontLocaleProvider>
    );
  }

  if (isTrialExpired(tenant)) {
    const settings = await getTenantStorefrontSettings(tenant.id);

    return (
      <StorefrontLocaleProvider subdomain={subdomain} initialLocale={settings.default_locale}>
        <StoreClosedNotice appearance={getAppearanceFromSettings(settings)} />
      </StorefrontLocaleProvider>
    );
  }

  if (!tenant.is_password_protected) {
    redirect(
      `/api/storefront/auto-enter?subdomain=${encodeURIComponent(subdomain)}&redirectTo=${encodeURIComponent(getStorefrontHomePath())}`,
    );
  }

  const settings = await getTenantStorefrontSettings(tenant.id);

  return (
    <StorefrontPageShell
        storefrontSettings={settings}
        subdomain={subdomain}
        hidePoweredBy={isWhiteLabelStorefront(tenant)}
      >
      <PasswordGate
        subdomain={subdomain}
        companyName={tenant.company_name}
        themeKey={settings.theme_key}
        isThemeToggleVisible={settings.is_theme_toggle_visible}
      />
    </StorefrontPageShell>
  );
}
