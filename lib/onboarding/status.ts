// Kurulum sihirbazı durumu (21 Eyl 2026). Adımların "tamamlandı" bilgisi
// ayrıca saklanmaz; gerçek verilerden hesaplanır (logo yüklü mü, kategori
// var mı, ürün var mı...). Böylece bayi adımı sihirbaz dışından (normal
// ayar sayfasından) yapsa da ilerleme doğru görünür.
// Genel Bakış (app/dashboard/page.tsx) hesaplar, sihirbaz + ilerleme kartı
// (components/dashboard/onboarding-wizard.tsx) gösterir.
import { hasPlanFeature } from "@/lib/billing/plans";
import {
  getTenantAccessCodes,
  getTenantCategories,
  getTenantPriceLists,
  getTenantProductCount,
  getTenantStorefrontSettings,
} from "@/lib/data";
import { STOREFRONT_THEME_PRESETS } from "@/lib/storefront/theme-presets";
import type { PriceList, Tenant, TenantStorefrontSettings } from "@/lib/types";

export type OnboardingStepId =
  | "identity"
  | "logo"
  | "theme"
  | "banner"
  | "categories"
  | "products"
  | "access_code"
  | "share";

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  /** Kısa "neden" açıklaması; sihirbazda ve kartta gösterilir. */
  summary: string;
  /** Sihirbaz dışında aynı işin yapıldığı panel sayfası (app host'ta kök yol). */
  href: string;
  completed: boolean;
}

export interface OnboardingStatus {
  steps: OnboardingStep[];
  completedCount: number;
  /** "share" adımı sayılmaz; ölçülebilir adımların yüzdesi. */
  percent: number;
  /** Sihirbazın Genel Bakış'ta kendiliğinden açılıp açılmayacağı. */
  autoOpen: boolean;
  /** Sihirbazın ihtiyaç duyduğu başlangıç verisi. */
  data: {
    storefrontTitle: string;
    storefrontDescription: string;
    logoUrl: string | null;
    themeKey: string;
    layoutKey: string;
    canUseAdvancedAppearance: boolean;
    categoryNames: string[];
    productCount: number;
    isPasswordProtected: boolean;
    accessCodeCount: number;
    pricedPriceLists: Pick<PriceList, "id" | "name">[];
    storeUrl: string;
  };
}

/** Bu tarihten sonra açılan tenant'larda sihirbaz ilk girişte kendiliğinden
 *  açılır; eski müşterilerde yalnız Genel Bakış kartı görünür (rahatsız
 *  etmemek için). Kart üzerinden herkes elle açabilir. */
export const ONBOARDING_AUTO_OPEN_SINCE = "2026-09-21T00:00:00Z";

/** Kayıtta yüklenen yer tutucu SVG gerçek logo sayılmaz. Yol
 *  `{tenantId}/branding/logo-placeholder.svg` (buildTenantBrandingPath
 *  "logo-" öneki ekler), o yüzden yalnız dosya adına bakılır. */
export function isRealLogo(logoUrl: string | null | undefined) {
  return Boolean(logoUrl) && !/placeholder\.svg(\?|$)/i.test(logoUrl ?? "");
}

export function isThemeCustomized(
  settings: Pick<TenantStorefrontSettings, "theme_key" | "layout_key" | "brand_primary_color" | "brand_accent_color">,
) {
  return (
    settings.theme_key !== "minimal" ||
    settings.layout_key !== "classic-grid" ||
    Boolean(settings.brand_primary_color || settings.brand_accent_color)
  );
}

export function buildOnboardingSteps(input: {
  settings: TenantStorefrontSettings;
  categoryCount: number;
  productCount: number;
  isPasswordProtected: boolean;
  accessCodeCount: number;
}): OnboardingStep[] {
  const { settings } = input;
  const steps: OnboardingStep[] = [
    {
      id: "identity",
      title: "Mağaza adı ve tanıtım",
      summary: "Katalogun başlığı ve bayilerinizin ilk göreceği bir cümle.",
      href: "/settings/site",
      completed: Boolean(settings.storefront_title?.trim()) && Boolean(settings.storefront_description?.trim()),
    },
    {
      id: "logo",
      title: "Logo",
      summary: "Üst barda ve ana ekran ikonunda firmanızın logosu görünsün.",
      href: "/settings/site",
      completed: isRealLogo(settings.logo_url),
    },
    {
      id: "theme",
      title: "Tema",
      summary: "Sektörünüze uygun hazır bir görünüm seçin.",
      href: "/settings/theme",
      completed: isThemeCustomized(settings),
    },
    {
      id: "banner",
      title: "Banner",
      summary: "Kampanya ya da marka görseliyle vitrini renklendirin.",
      href: "/settings/banner",
      completed: (settings.banner_items ?? []).length > 0,
    },
    {
      id: "categories",
      title: "Kategoriler",
      summary: "Ürünlerinizi gruplayın; bayiler aradığını hızlı bulsun.",
      href: "/categories",
      completed: input.categoryCount > 0,
    },
    {
      id: "products",
      title: "Ürünler",
      summary: "Excel ile toplu yükleyin ya da tek tek ekleyin.",
      href: "/products",
      completed: input.productCount > 0,
    },
  ];

  if (input.isPasswordProtected) {
    steps.push({
      id: "access_code",
      title: "Bayi şifresi",
      summary: "Fiyatları görmek için bayilerinize vereceğiniz şifre.",
      href: "/access-codes",
      completed: input.accessCodeCount > 0,
    });
  }

  steps.push({
    id: "share",
    title: "Bayilerinize gönderin",
    summary: "Katalog linkini WhatsApp'tan paylaşın.",
    href: "/",
    completed: false,
  });

  return steps;
}

export function summarizeOnboarding(steps: OnboardingStep[]) {
  const measurable = steps.filter((s) => s.id !== "share");
  const completedCount = measurable.filter((s) => s.completed).length;
  const percent = measurable.length ? Math.round((completedCount / measurable.length) * 100) : 100;
  return { completedCount, total: measurable.length, percent };
}

export async function getTenantOnboardingStatus(tenant: Tenant, storeUrl: string): Promise<OnboardingStatus> {
  const [settings, categories, productCount, accessCodes, priceLists] = await Promise.all([
    getTenantStorefrontSettings(tenant.id),
    getTenantCategories(tenant.id),
    getTenantProductCount(tenant.id),
    tenant.is_password_protected ? getTenantAccessCodes(tenant.id) : Promise.resolve([]),
    tenant.is_password_protected ? getTenantPriceLists(tenant.id) : Promise.resolve([]),
  ]);

  const steps = buildOnboardingSteps({
    settings,
    categoryCount: categories.length,
    productCount,
    isPasswordProtected: tenant.is_password_protected,
    accessCodeCount: accessCodes.length,
  });
  const { completedCount, percent } = summarizeOnboarding(steps);

  const createdAfterLaunch =
    new Date(tenant.created_at).getTime() >= new Date(ONBOARDING_AUTO_OPEN_SINCE).getTime();
  const autoOpen = !tenant.is_demo && !tenant.onboarding_dismissed_at && percent < 100 && createdAfterLaunch;

  return {
    steps,
    completedCount,
    percent,
    autoOpen,
    data: {
      storefrontTitle: settings.storefront_title ?? "",
      storefrontDescription: settings.storefront_description ?? "",
      logoUrl: isRealLogo(settings.logo_url) ? settings.logo_url : null,
      themeKey: settings.theme_key,
      layoutKey: settings.layout_key,
      canUseAdvancedAppearance: hasPlanFeature(tenant.plan, "advanced_appearance"),
      categoryNames: categories.filter((c) => !c.parent_id).map((c) => c.name),
      productCount,
      isPasswordProtected: tenant.is_password_protected,
      accessCodeCount: accessCodes.length,
      pricedPriceLists: priceLists.filter((p) => !p.is_catalog_only).map((p) => ({ id: p.id, name: p.name })),
      storeUrl,
    },
  };
}

/** Sihirbazın tema adımında gösterilen hazır paketler (sunucu → istemci). */
export type OnboardingThemePreset = ReturnType<typeof getOnboardingThemePresets>[number];
export function getOnboardingThemePresets() {
  return STOREFRONT_THEME_PRESETS.map((p) => ({
    key: p.key,
    title: p.title,
    description: p.description,
    thumbnailMobile: p.thumbnailMobile,
    settings: p.settings,
  }));
}
