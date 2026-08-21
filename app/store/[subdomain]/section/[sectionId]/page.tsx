export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PasswordGate } from "@/components/storefront/password-gate";
import { StoreClosedNotice } from "@/components/storefront/store-closed-notice";
import { StoreOutsideHoursNotice } from "@/components/storefront/store-outside-hours-notice";
import { StorefrontSuspendedNotice } from "@/components/storefront/storefront-suspended-notice";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { buildStorefrontIcons, buildStorefrontTitle, isWhiteLabelStorefront } from "@/lib/storefront/white-label";
import { StorefrontClient } from "@/components/storefront/storefront-client";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { StorefrontSectionBreadcrumb } from "@/components/storefront/storefront-section-breadcrumb";
import { StorefrontLocaleProvider } from "@/lib/storefront/locale-context";
import { getAppearanceFromSettings } from "@/lib/storefront/theme-context";
import { isTrialExpired } from "@/lib/billing/trial";
import {
  getStorefrontSections,
  getStorefrontTenant,
  getTenantCategories,
  getTenantStorefrontSettings,
} from "@/lib/data";
import { getStorefrontHomePath, getStorefrontSectionPath } from "@/lib/storefront/paths";
import { getNextOpening, isStoreOpenNow } from "@/lib/storefront/business-hours";
import { filterHiddenCategoriesAndProducts } from "@/lib/categories/tree";
import {
  getRequestHostFromHeaders,
  isTenantCustomDomainHost,
} from "@/lib/tenancy/request-host";
import {
  isStorefrontPriceListStateValid,
  readStorefrontPriceList,
} from "@/lib/storefront/session";

export async function generateMetadata(props: {
  params: Promise<{ subdomain: string; sectionId: string }>;
}): Promise<Metadata> {
  // Başlık verilmezse kök layout'un varsayılanı ("eKatalox — Toptan
  // Ticaretin Dijital İşletim Sistemi") sekmede görünüyordu.
  const { subdomain } = await props.params;
  const tenant = await getStorefrontTenant(subdomain);
  const settings = tenant ? await getTenantStorefrontSettings(tenant.id) : null;
  const title =
    settings?.site_tab_title ?? settings?.storefront_title ?? tenant?.company_name ?? "";

  return {
    ...(tenant ? { title: buildStorefrontTitle(title, tenant) } : {}),
    icons: buildStorefrontIcons(settings?.site_favicon_url, tenant),
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

export default async function SectionDetailPage(props: {
  params: Promise<{ subdomain: string; sectionId: string }>;
}) {
  const { subdomain, sectionId } = await props.params;
  const tenant = await getStorefrontTenant(subdomain);

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

  const hoursSettings = await getTenantStorefrontSettings(tenant.id);

  if (!isStoreOpenNow(hoursSettings)) {
    return (
      <StorefrontLocaleProvider subdomain={subdomain} initialLocale={hoursSettings.default_locale}>
        <StoreOutsideHoursNotice
          nextOpening={getNextOpening(hoursSettings)}
          appearance={getAppearanceFromSettings(hoursSettings)}
        />
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
        `/api/storefront/auto-enter?subdomain=${encodeURIComponent(subdomain)}&redirectTo=${encodeURIComponent(getStorefrontSectionPath(sectionId))}`,
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

  const [sections, rawCategories, storefrontSettings] = await Promise.all([
    getStorefrontSections(
      tenant.id,
      priceListState.priceListId,
      priceListState.isCatalogOnly,
    ),
    getTenantCategories(tenant.id),
    getTenantStorefrontSettings(tenant.id),
  ]);

  const section = sections.find((s) => s.id === sectionId);

  if (!section) {
    notFound();
  }

  const { categories, products: sectionProducts } = filterHiddenCategoriesAndProducts(
    rawCategories,
    section.products,
  );

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
      hidePoweredBy={isWhiteLabelStorefront(tenant)}
      className={footerVisible ? "pb-0" : undefined}
    >
      <div className="container-shell py-4">
        <StorefrontSectionBreadcrumb
          homeHref={getStorefrontHomePath()}
          sectionTitle={section.title}
        />
      </div>

      <StorefrontClient
        tenant={tenant}
        categories={categories}
        initialProducts={sectionProducts}
        initialProductTotal={sectionProducts.length}
        promoProducts={[]}
        bestSellerProducts={[]}
        recommendationPool={sectionProducts}
        storefrontSettings={storefrontSettings}
        sections={[]}
        subdomain={subdomain}
        pageTitle={section.title}
        homeHref={getStorefrontHomePath()}
        hasPageFooter={footerVisible}
        isCatalogOnly={priceListState.isCatalogOnly}
        sectionMode
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
