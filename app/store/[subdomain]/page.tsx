export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PasswordGate } from "@/components/storefront/password-gate";
import { StorefrontClient } from "@/components/storefront/storefront-client";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import {
  getStorefrontProducts,
  getStorefrontSections,
  getStorefrontTenant,
  getTenantCategories,
  getTenantStorefrontSettings,
} from "@/lib/data";
import { storefrontThemes } from "@/lib/storefront/themes";
import {
  getRequestHostFromHeaders,
  isTenantCustomDomainHost,
} from "@/lib/tenancy/request-host";
import { cn } from "@/lib/utils";
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
    return (
      <div className="container-shell flex min-h-screen items-center justify-center py-8">
        <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Bu mağaza geçici olarak kapalı
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Tenant askıya alındığı için katalog şu an görüntülenemiyor.
          </p>
        </div>
      </div>
    );
  }

  const priceListState = await readStorefrontPriceList(subdomain);

  if (
    !priceListState ||
    !isStorefrontPriceListStateValid({ cookieState: priceListState, tenant })
  ) {
    return (
      <PasswordGate subdomain={subdomain} companyName={tenant.company_name} />
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
  const theme =
    storefrontThemes[storefrontSettings.theme_key] ?? storefrontThemes.minimal;
  const footerVisible = storefrontSettings.is_footer_visible;
  const headersList = await headers();
  const requestHost = getRequestHostFromHeaders(headersList);
  const copyrightTenantName = isTenantCustomDomainHost(requestHost, tenant)
    ? tenant.company_name
    : null;

  return (
    <div className={cn(theme.page, footerVisible && "pb-0")}>
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
    </div>
  );
}