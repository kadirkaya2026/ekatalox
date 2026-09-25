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
import { decodeBrandPaletteParam } from "@/lib/storefront/brand-palette";
import { isTrialExpired } from "@/lib/billing/trial";
import {
  getStorefrontBestSellerProducts,
  getStorefrontCategoryProductCounts,
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
import {
  getEmptyStorefrontCategoryIds,
  getHiddenStorefrontCategoryIds,
  isUncategorizedBucketCategory,
} from "@/lib/categories/tree";
import type { Category } from "@/lib/types";
import { getNextOpening, isStoreOpenNow } from "@/lib/storefront/business-hours";
import { getStorefrontHomePath } from "@/lib/storefront/paths";
import { STOREFRONT_THEME_PRESETS } from "@/lib/storefront/theme-presets";
import { StorefrontPreviewBar } from "@/components/storefront/storefront-preview-bar";
import { appEnv } from "@/lib/env";
import { resolveStorefrontAds } from "@/lib/ads/server";
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

  const base = buildStorefrontIcons(settings.site_favicon_url, tenant);
  // iPhone "Ana Ekrana Ekle": ikon apple-touch-icon'dan (logo, yoksa favicon),
  // ad/standalone manifest'ten. Web Push iOS'ta yalnız böyle çalışıyor.
  const appleIcon = settings.logo_url || settings.site_favicon_url || null;

  return {
    title: buildStorefrontTitle(title, tenant),
    icons: appleIcon ? { ...base, apple: appleIcon } : base,
    appleWebApp: { capable: true, title, statusBarStyle: "default" },
    manifest: `/api/storefront/manifest?subdomain=${encodeURIComponent(subdomain)}`,
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

// Panelden tema önizlemesi (?preview=1): kaydedilmemiş tema seçimini URL'den
// alıp görünüm ayarlarının üstüne yazar. Yalnız görsel; şifre kapısı, fiyat
// listesi ve yetki kontrolleri aynen uygulanır (bayi iframe'de şifresini girer).
function applyPreviewOverrides<T extends object>(
  settings: T,
  sp: Record<string, string | string[] | undefined>,
): T {
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : null);
  const o: Record<string, string> = {};
  // Hazır paket: tüm paket ayarları (tema, düzen, header, footer, hero, kart, yazı tipi)
  const preset = str("preset") ? STOREFRONT_THEME_PRESETS.find((x) => x.key === str("preset")) : null;
  if (preset) Object.assign(o, preset.settings as unknown as Record<string, string>);
  if (str("theme")) o.theme_key = str("theme")!;
  if (str("layout")) o.layout_key = str("layout")!;
  if (str("header")) o.header_style_key = str("header")!;
  if (str("footer")) o.footer_style_key = str("footer")!;
  if (str("hero")) o.hero_style_key = str("hero")!;
  if (str("bp")) o.brand_primary_color = str("bp")!;
  if (str("ba")) o.brand_accent_color = str("ba")!;
  // Buton / bölüm renkleri (?pal= base64url JSON, 25 Eyl 2026). Parametre
  // varsa kayıtlı paletin yerine geçer (panelde temizlenen roller de boş görünsün).
  const palette = decodeBrandPaletteParam(str("pal"));
  if (palette) return { ...settings, ...o, brand_palette: palette } as T;
  return { ...settings, ...o } as T;
}

export default async function StorefrontPage(props: PageProps<"/store/[subdomain]">) {
  const { subdomain } = await props.params;
  const searchParams = ((await props.searchParams) ?? {}) as Record<string, string | string[] | undefined>;
  const isPreview = searchParams.preview === "1";
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

    const [settings, ads] = await Promise.all([
      getTenantStorefrontSettings(tenant.id),
      resolveStorefrontAds(tenant),
    ]);

    return (
      <StorefrontPageShell
        storefrontSettings={settings}
        subdomain={subdomain}
        hidePoweredBy={isWhiteLabelStorefront(tenant)}
        ads={ads}
      >
        <PasswordGate
          subdomain={subdomain}
          companyName={tenant.company_name}
          themeKey={settings.theme_key}
          isThemeToggleVisible={settings.is_theme_toggle_visible}
          appearance={getAppearanceFromSettings(settings)}
          ads={ads}
        />
      </StorefrontPageShell>
    );
  }

  const rawCategories = await getTenantCategories(tenant.id);
  const hiddenCategoryIds = getHiddenStorefrontCategoryIds(rawCategories);

  // Icinde (ve alt agacinda) hic urun olmayan kategoriler musteriye
  // gosterilmiyor: tiklayinca bos liste aciliyordu.
  //
  // Bunlar bilerek hiddenCategoryIds'e EKLENMIYOR: o kume urun
  // sorgularinda `category_id not in (...)` olarak kullaniliyor ve bos
  // kategoriler zaten hicbir urun getirmiyor. Buyuk bayilerde 200+ bos
  // kategori id'si sorgu dizesini gereksizce sisirirdi.
  const categoryCounts = await getStorefrontCategoryProductCounts(tenant.id);
  const emptyCategoryIds = categoryCounts
    ? new Set(getEmptyStorefrontCategoryIds(rawCategories, categoryCounts))
    : new Set<string>();

  // "Kategorisiz" kovası kategori menüsünde/kutucuklarda gösterilmez; ürünleri
  // hiddenCategoryIds'e EKLENMEDİĞİ için "Tüm Ürünler" ve aramada yayında kalır.
  const categories = rawCategories.filter(
    (category) =>
      !hiddenCategoryIds.includes(category.id) &&
      !emptyCategoryIds.has(category.id) &&
      !isUncategorizedBucketCategory(category),
  );

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
  // vardı (o satır da aşağıdaki kurala tabi). DB'ye satır eklemeden,
  // promoProducts (zaten yukarıda is_discount_active=true ürünler için
  // çekiliyor) doluysa bu kategori sanal olarak listeye ekleniyor; ürün
  // kalmayınca otomatik kayboluyor (kullanıcı isteği, 19 Ağu 2026).
  //
  // Her zaman EN BAŞTA: display_order=1 vermek yetmiyordu, çünkü bayinin
  // kendi kategorilerinden biri display_order=0 (ya da negatif) olabilir
  // ve önüne geçebiliyordu — diğer tüm kategorilerin en küçük değerinden
  // bir eksiği veriliyor ki hep ilk sırada kalsın. Manuel (gerçek DB
  // satırı) durumda da aynı kural + boşken gizleme uygulanır (kullanıcı
  // isteği, 4 Eyl 2026).
  const manualDiscountCategory = categories.find((category) => category.is_discount_category);
  const otherCategories = categories.filter((category) => !category.is_discount_category);
  const hasDiscountedProducts = promoProducts.length > 0;
  const minOtherDisplayOrder = otherCategories.length
    ? Math.min(...otherCategories.map((category) => category.display_order))
    : 0;

  const categoriesForStorefront: Category[] = !hasDiscountedProducts
    ? otherCategories
    : [
        {
          ...(manualDiscountCategory ?? {
            id: "virtual-discount-category",
            tenant_id: tenant.id,
            name: "İndirimli Ürünler",
            parent_id: null,
            banner_item: null,
            tile_image_url: null,
            is_discount_category: true,
            is_hidden_from_storefront: false,
            created_at: new Date(0).toISOString(),
          }),
          display_order: minOtherDisplayOrder - 1,
        },
        ...otherCategories,
      ];

  // Süresi geçmiş/pasif kampanyalar getStorefrontCampaigns içinde süzülüyor.
  const campaigns = await getStorefrontCampaigns(tenant.id);

  const viewSettings = isPreview ? applyPreviewOverrides(storefrontSettings, searchParams) : storefrontSettings;
  const previewPreset = isPreview && typeof searchParams.preset === "string"
    ? STOREFRONT_THEME_PRESETS.find((x) => x.key === searchParams.preset) ?? null
    : null;
  const previewLabel = previewPreset ? previewPreset.title : String(viewSettings.theme_key);
  const applyQuery = new URLSearchParams({ apply: "1" });
  for (const k of ["preset", "theme", "layout", "header", "footer", "hero", "bp", "ba", "pal"]) {
    const v = searchParams[k];
    if (typeof v === "string" && v) applyQuery.set(k, v);
  }
  const previewApplyHref = `https://app.${appEnv.rootDomain}/settings/theme?${applyQuery.toString()}`;
  const footerVisible = viewSettings.is_footer_visible;
  const ads = await resolveStorefrontAds(tenant);
  const headersList = await headers();
  const requestHost = getRequestHostFromHeaders(headersList);
  // Boş bırakılırsa altbilgi "©2026 eKatalox" bağlantısı basıyor.
  // Market/tekel vitrinlerinde müşteriye eKatalox markası hiç
  // görünmemeli (kullanıcı isteği, 21 Ağu 2026), o yüzden özel alan
  // adı olmasa da bayinin kendi adı yazılıyor.
  const copyrightTenantName =
    isTenantCustomDomainHost(requestHost, tenant) || isMarketOrTekelTenant(tenant)
      ? (tenant.company_name ?? viewSettings.storefront_title ?? null)
      : null;

  return (
    <StorefrontPageShell
      storefrontSettings={viewSettings}
      subdomain={subdomain}
      hidePoweredBy={isWhiteLabelStorefront(tenant)}
      pickupWording={Boolean(tenant.is_tekel)}
      className={footerVisible ? "pb-0" : undefined}
      ads={ads}
    >
      <StorefrontClient
        tenant={tenant}
        ads={ads}
        categories={categoriesForStorefront}
        initialProducts={firstPage.products}
        initialProductTotal={firstPage.total}
        promoProducts={promoProducts}
        promoProductCount={promoProductCount}
        bestSellerProducts={bestSellerProducts}
        recommendationPool={recommendationPool}
        categoryRepresentativeImages={categoryRepresentativeImages}
        storefrontSettings={viewSettings}
        sections={sections}
        subdomain={subdomain}
        campaigns={campaigns}
        hasPageFooter={footerVisible}
        isCatalogOnly={priceListState.isCatalogOnly}
      />
      {footerVisible ? (
        <StorefrontFooter
          settings={viewSettings}
          copyrightTenantName={copyrightTenantName}
          hasBottomNav={isMarketOrTekelTenant(tenant)}
        />
      ) : null}
      {isPreview ? <StorefrontPreviewBar applyHref={previewApplyHref} label={previewLabel} /> : null}
    </StorefrontPageShell>
  );
}