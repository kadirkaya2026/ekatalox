// "baslangic" | "profesyonel" | "kurumsal" eski (Tem 2026 öncesi) planlardır;
// mevcut tenant'lar bu planlarda kalmaya devam eder ve değiştirilmez.
// Yeni kayıtlar "start" | "pro" | "business" | "enterprise" | "vip" kullanır.
export type TenantPlan =
  | "baslangic"
  | "profesyonel"
  | "kurumsal"
  | "start"
  | "pro"
  | "business"
  | "enterprise"
  | "vip";

export type MaxProductLimit = 200 | 500 | 1000 | 2000 | 2500 | 5000;

export type PlanFeature =
  | "reports"
  | "payment_settings"
  | "banner_settings"
  | "product_discount"
  | "showcase_products"
  | "online_payment"
  | "custom_domain"
  | "advanced_appearance"
  | "homepage_blocks_editor";

export interface PlanOption {
  id: TenantPlan;
  name: string;
  maxProductLimit: MaxProductLimit;
}

export const PLAN_OPTIONS: PlanOption[] = [
  // Eski planlar — sadece mevcut tenant'lar için, admin panelinde gösterilir.
  { id: "baslangic", name: "Başlangıç (Eski)", maxProductLimit: 500 },
  { id: "profesyonel", name: "Profesyonel (Eski)", maxProductLimit: 1000 },
  { id: "kurumsal", name: "Kurumsal (Eski)", maxProductLimit: 2500 },
  // Yeni planlar — yeni kayıtlar için geçerli.
  { id: "start", name: "Start", maxProductLimit: 200 },
  { id: "pro", name: "Pro", maxProductLimit: 500 },
  { id: "business", name: "Business", maxProductLimit: 1000 },
  { id: "enterprise", name: "Enterprise", maxProductLimit: 2000 },
  { id: "vip", name: "VIP Custom", maxProductLimit: 5000 },
];

const LEGACY_PLAN_IDS: readonly TenantPlan[] = ["baslangic", "profesyonel", "kurumsal"];

export function isLegacyPlan(planId: TenantPlan): boolean {
  return (LEGACY_PLAN_IDS as TenantPlan[]).includes(planId);
}

// Eski ve yeni planlar ayrı "track" olarak ele alınır: bir tenant kendi
// track'i içinde üst pakete geçer, karışık (eski+yeni) liste gösterilmez.
export const LEGACY_PLAN_OPTIONS = PLAN_OPTIONS.filter((plan) => isLegacyPlan(plan.id));
export const NEW_PLAN_OPTIONS = PLAN_OPTIONS.filter((plan) => !isLegacyPlan(plan.id));

// Pazarlama sitesindeki (app/page.tsx Pricing) fiyatlarla senkron tutulmalı.
export const PLAN_PRICING: Record<
  TenantPlan,
  { price: string; unit: string; highlight: string; monthlyPrice?: string; monthlyUnit?: string }
> = {
  baslangic: {
    price: "₺20.000",
    unit: "/ Yıl",
    highlight: "Vitrin fikrinizi test edin",
  },
  profesyonel: {
    price: "₺45.000",
    unit: "/ Yıl",
    highlight: "En çok tercih edilen",
  },
  kurumsal: {
    price: "₺95.000",
    unit: "/ Yıl",
    highlight: "White-label kurumsal çözüm",
  },
  start: {
    price: "₺17.500",
    unit: "/ Yıl",
    monthlyPrice: "₺1.990",
    monthlyUnit: "/ Ay",
    highlight: "Vitrin fikrinizi test edin",
  },
  pro: {
    price: "₺25.000",
    unit: "/ Yıl",
    monthlyPrice: "₺2.840",
    monthlyUnit: "/ Ay",
    highlight: "Büyüyen vitrinler için",
  },
  business: {
    price: "₺35.000",
    unit: "/ Yıl",
    monthlyPrice: "₺3.980",
    monthlyUnit: "/ Ay",
    highlight: "En çok tercih edilen",
  },
  enterprise: {
    price: "₺50.000",
    unit: "/ Yıl",
    monthlyPrice: "₺5.690",
    monthlyUnit: "/ Ay",
    highlight: "Kurumsal ölçek için tam donanım",
  },
  vip: {
    price: "₺80.000",
    unit: "/ Yıl",
    monthlyPrice: "₺9.100",
    monthlyUnit: "/ Ay",
    highlight: "White-label kurumsal çözüm",
  },
};

export const PLAN_PRICE_LIST_LIMITS: Record<TenantPlan, number | null> = {
  baslangic: 3,
  profesyonel: 10,
  kurumsal: null,
  start: 3,
  pro: 5,
  business: 10,
  enterprise: 20,
  vip: null,
};

// Aylık ziyaretçi kotası — record_storefront_analytics() SQL fonksiyonundaki
// (supabase/migrations/0043_five_tier_pricing.sql) eşleşmeyle senkron tutulmalı.
export const PLAN_VISITOR_LIMITS: Record<TenantPlan, number> = {
  baslangic: 10_000,
  profesyonel: 50_000,
  kurumsal: 100_000,
  start: 10_000,
  pro: 25_000,
  business: 50_000,
  enterprise: 100_000,
  vip: 500_000,
};

export interface VisitorAddonPackage {
  visitors: number;
  monthlyPrice: string;
  yearlyPrice: string;
}

// Ek ziyaretçi kapasitesi paketleri — satın alma WhatsApp üzerinden yürür
// (gerçek online ödeme altyapısı yok, plan yükseltmeleriyle aynı akış).
export const VISITOR_ADDON_PACKAGES: VisitorAddonPackage[] = [
  { visitors: 10_000, monthlyPrice: "₺750", yearlyPrice: "₺7.500" },
  { visitors: 25_000, monthlyPrice: "₺1.500", yearlyPrice: "₺15.000" },
  { visitors: 50_000, monthlyPrice: "₺2.500", yearlyPrice: "₺25.000" },
];

const PROFESSIONAL_FEATURES: Record<PlanFeature, boolean> = {
  reports: true,
  payment_settings: true,
  banner_settings: true,
  product_discount: true,
  showcase_products: true,
  online_payment: false,
  custom_domain: true,
  advanced_appearance: true,
  homepage_blocks_editor: true,
};

const STARTER_FEATURES: Record<PlanFeature, boolean> = {
  reports: false,
  payment_settings: true,
  banner_settings: true,
  product_discount: false,
  showcase_products: false,
  online_payment: false,
  custom_domain: false,
  advanced_appearance: false,
  homepage_blocks_editor: false,
};

// pro, start'ın üstüne rapor + ürün indirimi ekler; eski "profesyonel"
// paketteki tüm özellikler business ve sonrasına (enterprise, vip) dahildir.
const PRO_FEATURES: Record<PlanFeature, boolean> = {
  ...STARTER_FEATURES,
  reports: true,
  product_discount: true,
};

export const PLAN_FEATURES: Record<TenantPlan, Record<PlanFeature, boolean>> = {
  baslangic: STARTER_FEATURES,
  profesyonel: PROFESSIONAL_FEATURES,
  kurumsal: {
    ...PROFESSIONAL_FEATURES,
    online_payment: true,
  },
  start: STARTER_FEATURES,
  pro: PRO_FEATURES,
  business: PROFESSIONAL_FEATURES,
  enterprise: {
    ...PROFESSIONAL_FEATURES,
    online_payment: true,
  },
  vip: {
    ...PROFESSIONAL_FEATURES,
    online_payment: true,
  },
};

const PLAN_FEATURE_LABELS: Record<PlanFeature, string> = {
  reports: "Raporlar",
  payment_settings: "Ödeme ve kampanya ayarları",
  banner_settings: "Banner yönetimi",
  product_discount: "Ürün indirimi",
  showcase_products: "Vitrin ürünleri",
  online_payment: "Online sanal POS ödemesi",
  custom_domain: "Özel alan adı",
  advanced_appearance: "Gelişmiş görünüm (font, kart, header)",
  homepage_blocks_editor: "Ana sayfa blok düzenleyici",
};

const PLAN_FEATURE_UPGRADE_MESSAGES: Partial<Record<PlanFeature, string>> = {
  online_payment:
    "iyzico, Paynet gibi sanal POS firmalarından siteniz üzerinden ödeme alabilmek için paketinizi yükseltmeniz gerekmektedir.",
  custom_domain:
    "firmadınız.com gibi tamamen size ait bir alan adı kullanabilmek için paketinizi yükseltmeniz gerekmektedir.",
};

export const PAYMENT_SETTING_BODY_KEYS = [
  "discount_threshold",
  "discount_percentage",
  "is_discount_active",
  "discount_condition_note",
  "discount_payment_method",
  "card_installment_options",
  "cash_discount_threshold",
  "cash_discount_percentage",
  "is_cash_discount_active",
  "cash_discount_note",
  "card_campaign_threshold",
  "is_card_campaign_active",
  "card_campaign_note",
  "cash_discount_tiers",
  "card_campaign_tiers",
] as const;

/** Future sanal POS settings fields — guard when integration is added. */
export const ONLINE_PAYMENT_BODY_KEYS = [] as const;

export const CUSTOM_DOMAIN_BODY_KEYS = ["custom_domain"] as const;

const PACKAGE_UPGRADE_PHONE = "905354172510";

const planById = new Map(PLAN_OPTIONS.map((plan) => [plan.id, plan]));
const planByLimit = new Map(PLAN_OPTIONS.map((plan) => [plan.maxProductLimit, plan]));

export const TENANT_PLAN_IDS = PLAN_OPTIONS.map((plan) => plan.id) as [
  TenantPlan,
  ...TenantPlan[],
];

export function getPlanById(planId: TenantPlan): PlanOption {
  const plan = planById.get(planId);

  if (!plan) {
    throw new Error(`Unknown tenant plan: ${planId}`);
  }

  return plan;
}

export function getPlanLabel(planId: TenantPlan): string {
  return getPlanById(planId).name;
}

export function getLimitForPlan(planId: TenantPlan): MaxProductLimit {
  return getPlanById(planId).maxProductLimit;
}

export function getPlanForLimit(limit: MaxProductLimit): TenantPlan {
  const plan = planByLimit.get(limit);

  if (!plan) {
    throw new Error(`Unknown product limit: ${limit}`);
  }

  return plan.id;
}

export function hasPlanFeature(plan: TenantPlan, feature: PlanFeature): boolean {
  return PLAN_FEATURES[plan][feature];
}

export function getMinimumPlanForFeature(
  feature: PlanFeature,
  currentPlan?: TenantPlan,
): TenantPlan {
  const track = currentPlan && isLegacyPlan(currentPlan) ? LEGACY_PLAN_OPTIONS : NEW_PLAN_OPTIONS;
  const match = track.find((plan) => PLAN_FEATURES[plan.id][feature]);
  return (match ?? track[track.length - 1]).id;
}

export function getPlanFeatureLabel(feature: PlanFeature): string {
  return PLAN_FEATURE_LABELS[feature];
}

export function getPlanFeatureUpgradeMessage(feature: PlanFeature, currentPlan?: TenantPlan): string {
  const customMessage = PLAN_FEATURE_UPGRADE_MESSAGES[feature];
  if (customMessage) {
    return customMessage;
  }

  const minimumPlan = getMinimumPlanForFeature(feature, currentPlan);
  return `${getPlanFeatureLabel(feature)} özelliği ${getPlanLabel(minimumPlan)} paketinde kullanılabilir.`;
}

export function requestTouchesOnlinePaymentSettings(body: Record<string, unknown>): boolean {
  return ONLINE_PAYMENT_BODY_KEYS.some((key) => key in body);
}

export function requestTouchesCustomDomain(body: Record<string, unknown>): boolean {
  return CUSTOM_DOMAIN_BODY_KEYS.some((key) => key in body);
}

export const ADVANCED_APPEARANCE_BODY_KEYS = [
  "font_key",
  "product_card_style",
  "header_style_key",
  "footer_style_key",
] as const;

export const HOMEPAGE_BLOCKS_BODY_KEYS = ["homepage_blocks"] as const;

export function requestTouchesAdvancedAppearance(body: Record<string, unknown>): boolean {
  return ADVANCED_APPEARANCE_BODY_KEYS.some((key) => key in body);
}

export function requestTouchesHomepageBlocks(body: Record<string, unknown>): boolean {
  return HOMEPAGE_BLOCKS_BODY_KEYS.some((key) => key in body);
}

export function requestTouchesPaymentSettings(body: Record<string, unknown>): boolean {
  return PAYMENT_SETTING_BODY_KEYS.some((key) => key in body);
}

export function buildPackageUpgradeHref(
  companyName: string,
  feature?: PlanFeature,
) {
  const featureLabel = feature ? getPlanFeatureLabel(feature) : "paket yükseltme";
  const message = `Merhaba, ${featureLabel} için paketimi yükseltmek istiyorum. Firma: ${companyName}`;
  return `https://wa.me/${PACKAGE_UPGRADE_PHONE}?text=${encodeURIComponent(message)}`;
}

export function getPlanRank(planId: TenantPlan): number {
  return PLAN_OPTIONS.findIndex((plan) => plan.id === planId);
}

export function buildPlanChangeHref(params: {
  companyName: string;
  subdomain: string;
  currentPlan: TenantPlan;
  targetPlan: TenantPlan;
  isTrial: boolean;
}): string {
  const target = getPlanLabel(params.targetPlan);
  const origin = params.isTrial
    ? "deneme sürümünden"
    : `${getPlanLabel(params.currentPlan)} paketinden`;
  const message = `Merhaba, ${params.companyName} (${params.subdomain}.ekatalox.com) olarak ${origin} ${target} paketine geçmek istiyoruz.`;
  return `https://wa.me/${PACKAGE_UPGRADE_PHONE}?text=${encodeURIComponent(message)}`;
}

export function formatProductLimit(limit: number): string {
  return limit.toLocaleString("tr-TR");
}

export function formatPlanSummary(planId: TenantPlan): string {
  const plan = getPlanById(planId);
  return `${plan.name} • ${formatProductLimit(plan.maxProductLimit)} ürün`;
}

export function formatPlanCapacityFeature(planId: TenantPlan): string {
  return `${formatProductLimit(getLimitForPlan(planId))} Ürün Kapasitesi`;
}

export function formatPlanCapacityDescription(planId: TenantPlan): string {
  return `${formatProductLimit(getLimitForPlan(planId))} ürün kapasitesi`;
}

export function getPriceListLimit(planId: TenantPlan): number | null {
  return PLAN_PRICE_LIST_LIMITS[planId];
}

export function canCreatePriceList(planId: TenantPlan, currentPricedCount: number): boolean {
  const limit = getPriceListLimit(planId);
  return limit === null || currentPricedCount < limit;
}

export function formatPriceListLimit(planId: TenantPlan): string {
  const limit = getPriceListLimit(planId);
  return limit === null ? "Sınırsız" : String(limit);
}

export function getVisitorLimitForPlan(planId: TenantPlan, addon = 0): number {
  return PLAN_VISITOR_LIMITS[planId] + Math.max(0, addon);
}

export function formatVisitorLimit(planId: TenantPlan, addon = 0): string {
  return getVisitorLimitForPlan(planId, addon).toLocaleString("tr-TR");
}

export function buildVisitorAddonHref(
  companyName: string,
  subdomain: string,
  addon: VisitorAddonPackage = VISITOR_ADDON_PACKAGES[0],
): string {
  const message = `Merhaba, ${companyName} (${subdomain}.ekatalox.com) olarak paketimize +${addon.visitors.toLocaleString(
    "tr-TR",
  )} ziyaretçi kapasitesi eklemek istiyoruz.`;
  return `https://wa.me/${PACKAGE_UPGRADE_PHONE}?text=${encodeURIComponent(message)}`;
}
