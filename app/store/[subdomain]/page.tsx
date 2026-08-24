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
import {
  buildStorefrontIcons,
  buildStorefrontTitle,
  isMarketOrTekelTenant,
  isWhiteLabelStorefront,
} from "@/lib/storefront/white-label";
import { StorefrontClient } from "@/components/storefront/storefront-client";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { StorefrontLocaleProvider } from "@/lib/storefront/locale-context";
import { getAppearanceFromSettings } from "@/lib/storefront/appearance";
import { isTrialExpired } from "@/lib/billing/trial";
import {
  getStorefrontBestSellerProducts,
  getStorefrontCategoryRepresentativeImages,
  getStorefrontProductsPage,
  getStorefrontPromoProductCount,
  getStorefrontPromoProducts,
  getStorefrontRecommendationPool,
  getStorefrontSections,
  getStorefrontTenant,
  getTenantCategories,
  getStorefrontCampaigns,
  getTenantStorefrontSettings,
} from "@/lib/data";
import {
  getRequestHostFromHeaders,
  isTenantCustomDomainHost,
} from "@/lib/tenancy/request-host";
import { getHiddenStorefrontCategoryIds } from "@/lib/categories/tree";
import type { Category } from "@/lib/types";
import { getNextOpening, isStoreOpenNow } from "@/lib/storefront/business-hours";
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

  const rawCategories = await getTenantCategories(tenant.id);
  const hiddenCategoryIds = getHiddenStorefrontCategoryIds(rawCategories);
  const categories = rawCategories.filter((category) => !hiddenCategoryIds.includes(category.id));

  const pricingParams = {
    tenantId: tenant.id,
    priceListId: priceListState.priceListId,
    isCatalogOnly: priceListState.isCatalogOnly,
  };

  const [
    firstPage,
    storefrontSettings,
    sections,
    promoProducts,
    promoProductCount,
    recommendationPool,
    bestSellerProducts,
    categoryRepresentativeImages,
  ] = await Promise.all([
      getStorefrontProductsPage({ ...pricingParams, page: 1, excludeCategoryIds: hiddenCategoryIds }),
      getTenantStorefrontSettings(tenant.id),
      getStorefrontSections(
        tenant.id,
        priceListState.priceListId,
        priceListState.isCatalogOnly,
      ),
      getStorefrontPromoProducts({ ...pricingParams, excludeCategoryIds: hiddenCategoryIds }),
      getStorefrontPromoProductCount({
        tenantId: tenant.id,
        priceListId: priceListState.priceListId,
        excludeCategoryIds: hiddenCategoryIds,
      }),
      getStorefrontRecommendationPool({ ...pricingParams, excludeCategoryIds: hiddenCategoryIds }),
      // Ayarlar aynı anda çekildiği için henüz best_sellers_product_count'u
      // bilmiyoruz — üst sınır (24) kadar çekilip gösterim sırasında admin'in
      // seçtiği sayıya kırpılıyor (bkz. storefront-client.tsx).
      getStorefrontBestSellerProducts({ ...pricingParams, excludeCategoryIds: hiddenCategoryIds, limit: 24 }),
      getStorefrontCategoryRepresentativeImages(tenant.id, categories),
    ]);
  // "İndirimli Ürünler" kategorisi (bkz. Category.is_discount_category,
  // storefront-client.tsx) hiçbir tenant'ta admin panelinden
  // oluşturulamıyor — sadece marketgo'da elle eklenmiş bir satır olarak
  // vardı. Artık DB'ye satır eklemeden, promoProducts (zaten yukarıda
  // is_discount_active=true ürünler için çekiliyor) doluysa bu kategori
  // sanal olarak listeye ekleniyor; ürün kalmayınca otomatik kayboluyor
  // (kullanıcı isteği, 19 Ağu 2026).
  const hasManualDiscountCategory = categories.some((category) => category.is_discount_category);
  const categoriesForStorefront: Category[] =
    !hasManualDiscountCategory && promoProducts.length > 0
      ? [
          {
            id: "virtual-discount-category",
            tenant_id: tenant.id,
            name: "İndirimli Ürünler",
            parent_id: null,
            display_order: 1,
            banner_item: null,
            tile_image_url: null,
            is_discount_category: true,
            is_hidden_from_storefront: false,
            created_at: new Date(0).toISOString(),
          },
          ...categories,
        ]
      : categories;

  // Süresi geçmiş/pasif kampanyalar getStorefrontCampaigns içinde süzülüyor.
  const campaigns = await getStorefrontCampaigns(tenant.id);

  const footerVisible = storefrontSettings.is_footer_visible;
  const headersList = await headers();
  const requestHost = getRequestHostFromHeaders(headersList);
  // Boş bırakılırsa altbilgi "©2026 eKatalox" bağlantısı basıyor.
  // Market/tekel vitrinlerinde müşteriye eKatalox markası hiç
  // görünmemeli (kullanıcı isteği, 21 Ağu 2026), o yüzden özel alan
  // adı olmasa da bayinin kendi adı yazılıyor.
  const copyrightTenantName =
    isTenantCustomDomainHost(requestHost, tenant) || isMarketOrTekelTenant(tenant)
      ? (tenant.company_name ?? storefrontSettings.storefront_title ?? null)
      : null;

  return (
    <StorefrontPageShell
      storefrontSettings={storefrontSettings}
      subdomain={subdomain}
      hidePoweredBy={isWhiteLabelStorefront(tenant)}
      className={footerVisible ? "pb-0" : undefined}
    >
      <StorefrontClient
        tenant={tenant}
        categories={categoriesForStorefront}
        initialProducts={firstPage.products}
        initialProductTotal={firstPage.total}
        promoProducts={promoProducts}
        promoProductCount={promoProductCount}
        bestSellerProducts={bestSellerProducts}
        recommendationPool={recommendationPool}
        categoryRepresentativeImages={categoryRepresentativeImages}
        storefrontSettings={storefrontSettings}
        sections={sections}
        subdomain={subdomain}
        campaigns={campaigns}
        hasPageFooter={footerVisible}
        isCatalogOnly={priceListState.isCatalogOnly}
      />
      {footerVisible ? (
        <StorefrontFooter
          settings={storefrontSettings}
          copyrightTenantName={copyrightTenantName}
          hasBottomNav={isMarketOrTekelTenant(tenant)}
        />
      ) : null}
    </StorefrontPageShell>
  );
}