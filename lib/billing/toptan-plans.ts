// Toptancı paketleri (20 Eyl 2026 freemium konumlandırması). Pazarlama sitesi,
// kayıt formu ve fiyatlandırma sayfası bu listeyi kullanır; slug'lar
// lib/billing/plans.ts TenantPlan id'leriyle birebir aynıdır (free/starter/
// professional/corporate). Limitler PLAN_OPTIONS / PLAN_PRICE_LIST_LIMITS /
// PLAN_VISITOR_LIMITS ile senkron tutulmalı.

export type ToptanPlanSlug = "free" | "starter" | "professional" | "corporate";

export interface ToptanPlan {
  slug: ToptanPlanSlug;
  name: string;
  tagline: string;
  /** Yıllık, KDV hariç. 0 = ücretsiz. */
  yearlyPrice: number;
  featured: boolean;
  /** Vitrinde eKatalox reklamı gösterilir mi? */
  ads: boolean;
  productLimit: number;
  priceListLimit: number | null;
  visitorLimit: number;
  /** Paket kartındaki maddeler (bir öncekine ek olarak). */
  features: string[];
}

export const TOPTAN_PLANS: ToptanPlan[] = [
  {
    slug: "free",
    name: "Ücretsiz",
    tagline: "Kataloğunuzu bugün yayınlayın. Kart yok, süre yok.",
    yearlyPrice: 0,
    featured: false,
    ads: true,
    productLimit: 200,
    priceListLimit: 1,
    visitorLimit: 1_000,
    features: [
      "200 ürün, 1 fiyat listesi",
      "Şifreli bayi girişi (firma.ekatalox.com)",
      "WhatsApp'a PDF sipariş",
      "Banner, kampanya kartı, indirim ve öne çıkanlar",
      "Tema, görünüm ve ana sayfa düzenleyici",
      "Kataloğunuzda küçük eKatalox reklamları görünür",
    ],
  },
  {
    slug: "starter",
    name: "Başlangıç",
    tagline: "Reklamsız katalog, üç fiyat listesi ve raporlar.",
    yearlyPrice: 5_000,
    featured: false,
    ads: false,
    productLimit: 1_000,
    priceListLimit: 3,
    visitorLimit: 5_000,
    features: [
      "Ücretsiz planın tamamı, reklamsız",
      "1.000 ürün, 3 fiyat listesi (bayi / perakende / özel)",
      "Raporlar: kim girdi, ne baktı, hangi il",
      "Aylık 5.000 ziyaretçi",
    ],
  },
  {
    slug: "professional",
    name: "Profesyonel",
    tagline: "Bayilerinize anlık bildirim, ödeme ayarları, sınırsız fiyat listesi.",
    yearlyPrice: 10_000,
    featured: true,
    ads: false,
    productLimit: 2_500,
    priceListLimit: null,
    visitorLimit: 20_000,
    features: [
      "Başlangıç paketinin tamamı",
      "2.500 ürün, sınırsız fiyat listesi",
      "Bayilere anlık bildirim (yeni ürün, kampanya, stok)",
      "Ödeme ve vade ayarları",
      "Aylık 20.000 ziyaretçi",
    ],
  },
  {
    slug: "corporate",
    name: "Kurumsal",
    tagline: "Kendi alan adınız, satış ve kârlılık takibi, öncelikli destek.",
    yearlyPrice: 15_000,
    featured: false,
    ads: false,
    productLimit: 5_000,
    priceListLimit: null,
    visitorLimit: 50_000,
    features: [
      "Profesyonel paketinin tamamı",
      "5.000 ürün",
      "Kendi alan adınız (katalog.firmaniz.com)",
      "Satış ve kârlılık raporu",
      "Öncelikli destek hattı",
      "Aylık 50.000 ziyaretçi",
    ],
  },
];

export function getToptanPlan(slug: string | null | undefined): ToptanPlan | undefined {
  return TOPTAN_PLANS.find((plan) => plan.slug === slug);
}

export function isToptanPlanSlug(value: unknown): value is ToptanPlanSlug {
  return typeof value === "string" && TOPTAN_PLANS.some((plan) => plan.slug === value);
}

export function formatTry(amount: number): string {
  return `${amount.toLocaleString("tr-TR")} ₺`;
}

/** Kayıt formundaki sektör seçenekleri (toptancı dikeyleri). */
export const TOPTAN_SECTOR_OPTIONS = [
  { value: "telefon-aksesuar", label: "Telefon aksesuarı ve elektronik" },
  { value: "gida", label: "Gıda ve içecek" },
  { value: "tekstil", label: "Tekstil, giyim ve ayakkabı" },
  { value: "hirdavat", label: "Hırdavat, nalburiye ve yapı" },
  { value: "kozmetik", label: "Kozmetik ve kişisel bakım" },
  { value: "kirtasiye-oyuncak", label: "Kırtasiye ve oyuncak" },
  { value: "ambalaj", label: "Ambalaj ve temizlik" },
  { value: "elektrik", label: "Elektrik ve aydınlatma" },
  { value: "ev-mutfak", label: "Ev, mutfak ve züccaciye" },
  { value: "yedek-parca", label: "Otomotiv ve yedek parça" },
  { value: "diger", label: "Diğer toptan / üretim" },
] as const;

export type ToptanSectorValue = (typeof TOPTAN_SECTOR_OPTIONS)[number]["value"];
export const TOPTAN_SECTOR_VALUES = TOPTAN_SECTOR_OPTIONS.map((option) => option.value) as [
  ToptanSectorValue,
  ...ToptanSectorValue[],
];
