export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PasswordGate } from "@/components/storefront/password-gate";
import { StoreClosedNotice } from "@/components/storefront/store-closed-notice";
import { StorefrontSuspendedNotice } from "@/components/storefront/storefront-suspended-notice";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { StorefrontClient } from "@/components/storefront/storefront-client";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { StorefrontLocaleProvider } from "@/lib/storefront/locale-context";
import { isTrialExpired } from "@/lib/billing/trial";
import {
  getStorefrontProducts,
  getStorefrontSections,
  getStorefrontTenant,
  getTenantCategories,
  getTenantStorefrontSettings,
} from "@/lib/data";
import {
  getRequestHostFromHeaders,
  isTenantCustomDomainHost,
} from "@/lib/tenancy/request-host";
import { getStorefrontHomePath } from "@/lib/storefront/paths";
import {
  isStorefrontPriceListStateValid,
  readStorefrontPriceList,
} from "@/lib/storefront/session";

export async function generateMetadata(
  props: PageProps<"/store/[subdomain]">,
): Promise<Metadata> {
  const { subdomain } = await props.params;
  const tenant = await getStorefrontTenant(subdomain);

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

export default async function StorefrontPage(props: PageProps<"/store/[subdomain]">) {
  const { subdomain } = await props.params;
  const tenant = await getStorefrontTenant(subdomain);

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

  const priceListState = await readStorefrontPriceList(subdomain);

  if (
    !priceListState ||
    !isStorefrontPriceListStateValid({ cookieState: priceListState, tenant })
  ) {
    if (!tenant.is_password_protected) {
      redirect(
        `/api/storefront/auto-enter?subdomain=${encodeURIComponent(subdomain)}&redirectTo=${encodeURIComponent(getStorefrontHomePath())}`,
      );
    }

    const settings = await getTenantStorefrontSettings(tenant.id);

    return (
      <StorefrontPageShell storefrontSettings={settings} subdomain={subdomain}>
        <PasswordGate
          subdomain={subdomain}
          companyName={tenant.company_name}
          themeKey={settings.theme_key}
          isThemeToggleVisible={settings.is_theme_toggle_visible}
        />
      </StorefrontPageShell>
    );
  }

  const [products, categories, storefrontSettings, sections] = await Promise.all([
    getStorefrontProducts({
      tenantId: tenant.id,
      priceListId: priceListState.priceListId,
      isCatalogOnly: priceListState.isCatalogOnly,
    }),
    getTenantCategories(tenant.id),
    getTenantStorefrontSettings(tenant.id),
    getStorefrontSections(
      tenant.id,
      priceListState.priceListId,
      priceListState.isCatalogOnly,
    ),
  ]);
  const footerVisible = storefrontSettings.is_footer_visible;
  const headersList = await headers();
  const requestHost = getRequestHostFromHeaders(headersList);
  const copyrightTenantName = isTenantCustomDomainHost(requestHost, tenant)
    ? tenant.company_name
    : null;

  return (
    <StorefrontPageShell
      storefrontSettings={storefrontSettings}
      subdomain={subdomain}
      className={footerVisible ? "pb-0" : undefined}
    >
      <StorefrontClient
        tenant={tenant}
        categories={categories}
        products={products}
        storefrontSettings={storefrontSettings}
        sections={sections}
        subdomain={subdomain}
        hasPageFooter={footerVisible}
        isCatalogOnly={priceListState.isCatalogOnly}
      />
      {footerVisible ? (
        <StorefrontFooter
          settings={storefrontSettings}
          copyrightTenantName={copyrightTenantName}
        />
      ) : null}
    </StorefrontPageShell>
  );
}