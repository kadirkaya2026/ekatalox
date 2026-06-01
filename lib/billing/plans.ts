export type TenantPlan = "baslangic" | "profesyonel" | "kurumsal";

export type MaxProductLimit = 500 | 1000 | 2500;

export type PlanFeature =
  | "reports"
  | "payment_settings"
  | "banner_settings"
  | "product_discount"
  | "showcase_products"
  | "online_payment"
  | "custom_domain";

export interface PlanOption {
  id: TenantPlan;
  name: string;
  maxProductLimit: MaxProductLimit;
}

export const PLAN_OPTIONS: PlanOption[] = [
  { id: "baslangic", name: "Başlangıç", maxProductLimit: 500 },
  { id: "profesyonel", name: "Profesyonel", maxProductLimit: 1000 },
  { id: "kurumsal", name: "Kurumsal", maxProductLimit: 2500 },
];

export const PLAN_PRICE_LIST_LIMITS: Record<TenantPlan, number | null> = {
  baslangic: 3,
  profesyonel: 10,
  kurumsal: null,
};

const PROFESSIONAL_FEATURES: Record<PlanFeature, boolean> = {
  reports: true,
  payment_settings: true,
  banner_settings: true,
  product_discount: true,
  showcase_products: true,
  online_payment: false,
  custom_domain: true,
};

export const PLAN_FEATURES: Record<TenantPlan, Record<PlanFeature, boolean>> = {
  baslangic: {
    reports: false,
    payment_settings: true,
    banner_settings: true,
    product_discount: false,
    showcase_products: false,
    online_payment: false,
    custom_domain: false,
  },
  profesyonel: PROFESSIONAL_FEATURES,
  kurumsal: {
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

export function getMinimumPlanForFeature(feature: PlanFeature): TenantPlan {
  if (PLAN_FEATURES.baslangic[feature]) {
    return "baslangic";
  }

  if (PLAN_FEATURES.profesyonel[feature]) {
    return "profesyonel";
  }

  return "kurumsal";
}

export function getPlanFeatureLabel(feature: PlanFeature): string {
  return PLAN_FEATURE_LABELS[feature];
}

export function getPlanFeatureUpgradeMessage(feature: PlanFeature): string {
  const customMessage = PLAN_FEATURE_UPGRADE_MESSAGES[feature];
  if (customMessage) {
    return customMessage;
  }

  const minimumPlan = getMinimumPlanForFeature(feature);
  return `${getPlanFeatureLabel(feature)} özelliği ${getPlanLabel(minimumPlan)} paketinde kullanılabilir.`;
}

export function requestTouchesOnlinePaymentSettings(body: Record<string, unknown>): boolean {
  return ONLINE_PAYMENT_BODY_KEYS.some((key) => key in body);
}

export function requestTouchesCustomDomain(body: Record<string, unknown>): boolean {
  return CUSTOM_DOMAIN_BODY_KEYS.some((key) => key in body);
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
