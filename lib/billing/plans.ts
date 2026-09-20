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
  | "vip"
  // Toptancı (genel) freemium merdiveni (20 Eyl 2026): free = Ücretsiz
  // (eKatalox reklamlı), starter = Başlangıç, professional = Profesyonel,
  // corporate = Kurumsal. Esnaf (pro/business) ve eski planlarla karışmaz.
  | "free"
  | "starter"
  | "professional"
  | "corporate";

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
  | "homepage_blocks_editor"
  | "sales_accounting"
  // Panelden müşterilere web push bildirimi gönderme (Bildirim & Kampanyalar).
  | "push_notifications"
  // Vitrinde eKatalox reklamı YOK. Sadece "free" planında false; reklam
  // yerleşimleri lib/ads/config.ts ile süper adminden yönetilir.
  | "ad_free";

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
  // Yeni planlar. Esnaf paketleri (Eyl 2026): pro = "Esnaf", business =
  // "Esnaf Plus" — lib/billing/esnaf-plans.ts ile senkron. start/enterprise/
  // vip mevcut tenant'lar için korunur, pazarlamada gizlidir (bkz.
  // PLAN_MARKETING_META.hidden); süper admin formlarında seçilebilir kalır.
  { id: "start", name: "Start", maxProductLimit: 200 },
  { id: "pro", name: "Esnaf", maxProductLimit: 1000 },
  { id: "business", name: "Esnaf Plus", maxProductLimit: 2500 },
  { id: "enterprise", name: "Enterprise", maxProductLimit: 2000 },
  { id: "vip", name: "VIP Custom", maxProductLimit: 5000 },
  // Toptancı freemium merdiveni — yıllık ₺0 / 5.000 / 10.000 / 15.000.
  { id: "free", name: "Ücretsiz", maxProductLimit: 200 },
  { id: "starter", name: "Başlangıç", maxProductLimit: 1000 },
  { id: "professional", name: "Profesyonel", maxProductLimit: 2500 },
  { id: "corporate", name: "Kurumsal", maxProductLimit: 5000 },
];

export interface PlanMarketingMeta {
  /** Pazarlama/kayıt/plan seçim ekranlarında görünen ad. */
  name: string;
  tagline: string;
  /** Paket kartlarındaki madde listesi. */
  bullets: string[];
  /** Öne çıkan (önerilen) paket. */
  featured: boolean;
  /**
   * true = pazarlama sitesi, kayıt formu, deneme-bitti ekranı ve tenant
   * paneli yükseltme listesinde gösterilmez; yalnızca süper admin seçebilir.
   */
  hidden: boolean;
}

// Pazarlama metinleri. pro/business içerikleri ESNAF_PLANS ile aynıdır.
export const PLAN_MARKETING_META: Record<TenantPlan, PlanMarketingMeta> = {
  baslangic: {
    name: "Başlangıç (Eski)",
    tagline: "Vitrin fikrinizi test edin",
    bullets: ["500 ürüne kadar", "3 seviyeli müşteri fiyat listesi", "WhatsApp sipariş formu"],
    featured: false,
    hidden: true,
  },
  profesyonel: {
    name: "Profesyonel (Eski)",
    tagline: "En çok tercih edilen",
    bullets: ["1.000 ürüne kadar", "10 seviyeli müşteri fiyat listesi", "Raporlar ve özel alan adı"],
    featured: false,
    hidden: true,
  },
  kurumsal: {
    name: "Kurumsal (Eski)",
    tagline: "White-label kurumsal çözüm",
    bullets: ["2.500 ürüne kadar", "Sınırsız fiyat listesi", "Online ödeme (sanal POS)"],
    featured: false,
    hidden: true,
  },
  start: {
    name: "Start",
    tagline: "Vitrin fikrinizi test edin",
    bullets: ["200 ürüne kadar", "3 seviyeli müşteri fiyat listesi", "WhatsApp sipariş formu"],
    featured: false,
    hidden: true,
  },
  pro: {
    name: "Esnaf",
    tagline: "Telefonu susturmak için gereken her şey.",
    bullets: [
      "Kendi adresinde sipariş sayfası (dukkan.ekatalox.com)",
      "Ürünlerin fotoğraf ve fiyatıyla bizim tarafımızdan yüklenmesi",
      "WhatsApp'a PDF sipariş, hazırlanıyor ve yola çıktı bildirimleri",
      "Kampanya ve indirimli ürün sayfası",
      "Yoğunum modu, çalışma saatleri, minimum sepet, yaş doğrulama",
      "100 adet QR magnet hediye",
      "1.000 ürüne kadar",
    ],
    featured: false,
    hidden: false,
  },
  business: {
    name: "Esnaf Plus",
    tagline: "Sadık müşteri ve kâr takibi isteyen dükkânlar için.",
    bullets: [
      "Esnaf paketinin tamamı",
      "Kendi alan adı (dukkanim.com)",
      "Veresiye takibi ve tahsilat bildirimi",
      "Satış ve kârlılık raporu",
      "Müşteri kuponu ve \"sizi özledik\" bildirimleri",
      "300 adet QR magnet hediye ve magnet sipariş takibi",
      "Öncelikli destek hattı, 2.500 ürüne kadar",
    ],
    featured: true,
    hidden: false,
  },
  enterprise: {
    name: "Enterprise",
    tagline: "Kurumsal ölçek için tam donanım",
    bullets: ["2.000 ürüne kadar", "20 seviyeli müşteri fiyat listesi", "Online ödeme (sanal POS)"],
    featured: false,
    hidden: true,
  },
  vip: {
    name: "VIP Custom",
    tagline: "White-label kurumsal çözüm",
    bullets: ["5.000 ürüne kadar", "Sınırsız fiyat listesi", "Özel onboarding ve hesap yöneticisi"],
    featured: false,
    hidden: true,
  },
  // Toptancı merdiveni: fiyatlandırma sayfası ayrıca yapılana kadar Esnaf
  // kayıt/pazarlama akışlarında görünmez (hidden), süper admin seçebilir.
  free: {
    name: "Ücretsiz",
    tagline: "Hemen başla, eKatalox reklamlarıyla ücretsiz kullan",
    bullets: [
      "200 ürüne kadar",
      "1 fiyat listesi, aylık 1.000 ziyaretçi",
      "WhatsApp sipariş, şifreli katalog, tema ve banner",
      "Vitrinde eKatalox reklamları gösterilir",
    ],
    featured: false,
    hidden: true,
  },
  starter: {
    name: "Başlangıç",
    tagline: "Reklamsız vitrin ve raporlar",
    bullets: ["1.000 ürüne kadar", "3 fiyat listesi, aylık 5.000 ziyaretçi", "Raporlar", "Reklamsız"],
    featured: false,
    hidden: true,
  },
  professional: {
    name: "Profesyonel",
    tagline: "Müşterilere bildirim ve ödeme ayarları",
    bullets: [
      "2.500 ürüne kadar",
      "Sınırsız fiyat listesi, aylık 20.000 ziyaretçi",
      "Müşterilere bildirim, ödeme ve vade ayarları",
    ],
    featured: true,
    hidden: true,
  },
  corporate: {
    name: "Kurumsal",
    tagline: "Özel alan adı, satış & kârlılık ve öncelikli destek",
    bullets: [
      "5.000 ürüne kadar",
      "Sınırsız fiyat listesi, aylık 50.000 ziyaretçi",
      "Özel alan adı, satış & kârlılık raporu, öncelikli destek",
    ],
    featured: false,
    hidden: true,
  },
};

export function isHiddenPlan(planId: TenantPlan): boolean {
  return PLAN_MARKETING_META[planId].hidden;
}

const LEGACY_PLAN_IDS: readonly TenantPlan[] = ["baslangic", "profesyonel", "kurumsal"];

export function isLegacyPlan(planId: TenantPlan): boolean {
  return (LEGACY_PLAN_IDS as TenantPlan[]).includes(planId);
}

// Toptancı freemium track'i (free → starter → professional → corporate).
const TOPTAN_PLAN_IDS: readonly TenantPlan[] = ["free", "starter", "professional", "corporate"];

export function isToptanPlan(planId: TenantPlan): boolean {
  return (TOPTAN_PLAN_IDS as TenantPlan[]).includes(planId);
}

export const TOPTAN_PLAN_OPTIONS = PLAN_OPTIONS.filter((plan) => isToptanPlan(plan.id));

/** Vitrinde eKatalox reklamı gösterilecek mi? (Yalnız Ücretsiz plan.) */
export function planShowsStorefrontAds(planId: TenantPlan): boolean {
  return !PLAN_FEATURES[planId].ad_free;
}

// Eski ve yeni planlar ayrı "track" olarak ele alınır: bir tenant kendi
// track'i içinde üst pakete geçer, karışık (eski+yeni) liste gösterilmez.
export const LEGACY_PLAN_OPTIONS = PLAN_OPTIONS.filter((plan) => isLegacyPlan(plan.id));
// Tüm yeni-track planlar (gizliler dahil) — süper admin ve özellik eşiği
// hesabı için.
export const ALL_NEW_PLAN_OPTIONS = PLAN_OPTIONS.filter(
  (plan) => !isLegacyPlan(plan.id) && !isToptanPlan(plan.id),
);
// Pazarlama, kayıt ve tenant panelinde sunulan planlar: yalnız Esnaf ve
// Esnaf Plus (pro/business).
export const NEW_PLAN_OPTIONS = ALL_NEW_PLAN_OPTIONS.filter((plan) => !isHiddenPlan(plan.id));

// Pazarlama sitesindeki fiyatlarla ve lib/billing/esnaf-plans.ts
// (ESNAF_PLANS yearlyPrice/monthlyPrice) ile senkron tutulmalı.
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
    monthlyPrice: "₺3.490",
    monthlyUnit: "/ Ay",
    highlight: "Telefonu susturmak için gereken her şey",
  },
  business: {
    price: "₺40.000",
    unit: "/ Yıl",
    monthlyPrice: "₺5.590",
    monthlyUnit: "/ Ay",
    highlight: "Sadık müşteri ve kâr takibi isteyen dükkânlar için",
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
  free: { price: "₺0", unit: "", highlight: "eKatalox reklamlarıyla ücretsiz" },
  starter: { price: "₺5.000", unit: "/ Yıl", highlight: "Reklamsız vitrin ve raporlar" },
  professional: { price: "₺10.000", unit: "/ Yıl", highlight: "Bayilere bildirim ve ödeme ayarları" },
  corporate: { price: "₺15.000", unit: "/ Yıl", highlight: "Özel alan adı, satış & kârlılık" },
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
  free: 1,
  starter: 3,
  professional: null,
  corporate: null,
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
  free: 1_000,
  starter: 5_000,
  professional: 20_000,
  corporate: 50_000,
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
  sales_accounting: true,
  push_notifications: true,
  ad_free: true,
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
  sales_accounting: false,
  push_notifications: true,
  ad_free: true,
};

// Esnaf (pro): banner, ürün indirimi, vitrin ürünleri, ödeme/kampanya
// ayarları ve ana sayfa blokları açık. Raporlar, satış & kârlılık, özel
// alan adı ve gelişmiş görünüm yalnızca Esnaf Plus'ta (business =
// PROFESSIONAL_FEATURES). online_payment yalnızca enterprise/vip/kurumsal.
const ESNAF_FEATURES: Record<PlanFeature, boolean> = {
  reports: false,
  payment_settings: true,
  banner_settings: true,
  product_discount: true,
  showcase_products: true,
  online_payment: false,
  custom_domain: false,
  advanced_appearance: false,
  homepage_blocks_editor: true,
  sales_accounting: false,
  push_notifications: true,
  ad_free: true,
};

// Toptancı merdiveni (20 Eyl 2026, güncelleme 21 Eyl). Ücretsiz: banner,
// indirim, vitrin ürünleri, gelişmiş görünüm ve ana sayfa blokları AÇIK;
// raporlar KİLİTLİ; vitrinde eKatalox reklamı var. Başlangıç: + raporlar,
// reklamsız. Profesyonel: + bildirim, ödeme ayarları. Kurumsal: + özel alan
// adı, satış & kârlılık (kullanıcı isteği: özel alan adı yalnız Kurumsal'da).
const TOPTAN_FREE_FEATURES: Record<PlanFeature, boolean> = {
  reports: false,
  payment_settings: false,
  banner_settings: true,
  product_discount: true,
  showcase_products: true,
  online_payment: false,
  custom_domain: false,
  advanced_appearance: true,
  homepage_blocks_editor: true,
  sales_accounting: false,
  push_notifications: false,
  ad_free: false,
};

const TOPTAN_STARTER_FEATURES: Record<PlanFeature, boolean> = {
  ...TOPTAN_FREE_FEATURES,
  reports: true,
  ad_free: true,
};

const TOPTAN_PROFESSIONAL_FEATURES: Record<PlanFeature, boolean> = {
  ...TOPTAN_STARTER_FEATURES,
  push_notifications: true,
  payment_settings: true,
};

const TOPTAN_CORPORATE_FEATURES: Record<PlanFeature, boolean> = {
  ...TOPTAN_PROFESSIONAL_FEATURES,
  custom_domain: true,
  sales_accounting: true,
  online_payment: true,
};

export const PLAN_FEATURES: Record<TenantPlan, Record<PlanFeature, boolean>> = {
  free: TOPTAN_FREE_FEATURES,
  starter: TOPTAN_STARTER_FEATURES,
  professional: TOPTAN_PROFESSIONAL_FEATURES,
  corporate: TOPTAN_CORPORATE_FEATURES,
  baslangic: STARTER_FEATURES,
  profesyonel: PROFESSIONAL_FEATURES,
  kurumsal: {
    ...PROFESSIONAL_FEATURES,
    online_payment: true,
  },
  start: STARTER_FEATURES,
  pro: ESNAF_FEATURES,
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
  sales_accounting: "Satış & Kârlılık raporu",
  push_notifications: "Müşterilere bildirim gönderme",
  ad_free: "Reklamsız vitrin",
};

const PLAN_FEATURE_UPGRADE_MESSAGES: Partial<Record<PlanFeature, string>> = {
  ad_free: "Vitrininizdeki eKatalox reklamlarını kaldırmak için bir paket seçin.",
  push_notifications:
    "Bildirim açan müşterilerinize kampanya ve ürün duyurusu gönderebilmek için paketinizi yükseltmeniz gerekmektedir.",
  sales_accounting:
    "Ciro, kâr ve kâr marjı raporlarını görmek için paketinizi yükseltmeniz gerekmektedir.",
  online_payment:
    "iyzico, Paynet gibi sanal POS firmalarından siteniz üzerinden ödeme alabilmek için paketinizi yükseltmeniz gerekmektedir.",
  custom_domain:
    "firmadınız.com gibi tamamen size ait bir alan adı kullanabilmek için paketinizi yükseltmeniz gerekmektedir.",
};

export const PAYMENT_SETTING_BODY_KEYS = [
  "card_installment_options",
  "is_cash_discount_active",
  "cash_discount_note",
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
// Aynı limit birden çok planda olabilir (profesyonel/pro = 1000,
// kurumsal/business = 2500); yeni-track plan kazanır.
// Toptancı track'i bilerek dışarıda: aynı limitler (200/1000/2500/5000)
// eski akışlarda start/pro/business/vip'e çözülmeye devam eder.
const planByLimit = new Map(
  [...LEGACY_PLAN_OPTIONS, ...ALL_NEW_PLAN_OPTIONS].map((plan) => [plan.maxProductLimit, plan]),
);

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
  if (currentPlan && isToptanPlan(currentPlan)) {
    const match = TOPTAN_PLAN_OPTIONS.find((plan) => PLAN_FEATURES[plan.id][feature]);
    return (match ?? TOPTAN_PLAN_OPTIONS[TOPTAN_PLAN_OPTIONS.length - 1]).id;
  }
  const legacy = Boolean(currentPlan && isLegacyPlan(currentPlan));
  const track = legacy ? LEGACY_PLAN_OPTIONS : NEW_PLAN_OPTIONS;
  const match =
    track.find((plan) => PLAN_FEATURES[plan.id][feature]) ??
    // Görünür paketlerde yoksa (ör. online_payment) gizli üst paketlere bak.
    (legacy ? undefined : ALL_NEW_PLAN_OPTIONS.find((plan) => PLAN_FEATURES[plan.id][feature]));
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
  "hero_style_key",
  "hero_image_url",
] as const;

export const HOMEPAGE_BLOCKS_BODY_KEYS = ["homepage_blocks"] as const;

export const BANNER_SETTING_BODY_KEYS = ["banner_items"] as const;

export function requestTouchesAdvancedAppearance(body: Record<string, unknown>): boolean {
  return ADVANCED_APPEARANCE_BODY_KEYS.some((key) => key in body);
}

export function requestTouchesHomepageBlocks(body: Record<string, unknown>): boolean {
  return HOMEPAGE_BLOCKS_BODY_KEYS.some((key) => key in body);
}

export function requestTouchesBannerSettings(body: Record<string, unknown>): boolean {
  return BANNER_SETTING_BODY_KEYS.some((key) => key in body);
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

// Süper admin'in bir tenant'a plan tabanının üzerine tanımlayabildiği hediye
// ürün kapasitesi. max_product_limit plan'a sıkı bağlı kalır (DB constraint);
// efektif limit her zaman burada hesaplanır, DB'ye geri yazılmaz.
export function getEffectiveProductLimit(planId: TenantPlan, addon = 0): number {
  return getLimitForPlan(planId) + Math.max(0, addon);
}

export function formatEffectiveProductLimit(planId: TenantPlan, addon = 0): string {
  return formatProductLimit(getEffectiveProductLimit(planId, addon));
}

export function buildCustomDomainRequestHref(
  companyName: string,
  subdomain: string,
  currentDomain?: string | null,
): string {
  const message = currentDomain
    ? `Merhaba, ${companyName} (${subdomain}.ekatalox.com) olarak özel alan adımızı (${currentDomain}) değiştirmek istiyoruz.`
    : `Merhaba, ${companyName} (${subdomain}.ekatalox.com) olarak kendi alan adımızı bağlamak istiyoruz.`;
  return `https://wa.me/${PACKAGE_UPGRADE_PHONE}?text=${encodeURIComponent(message)}`;
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
