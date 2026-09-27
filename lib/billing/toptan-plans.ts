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
    tagline: "İlk kataloğunu açıp bayilerinden sipariş toplamaya başlamak isteyenler için.",
    yearlyPrice: 0,
    featured: false,
    ads: true,
    productLimit: 250,
    priceListLimit: 2,
    visitorLimit: 1_000,
    features: [
      "250 ürün, 2 fiyat listesi",
      "Şifreli bayi girişi (firma.ekatalox.com)",
      "WhatsApp ile PDF sipariş fişi bağlantısı",
      "Banner, kampanya kartı, indirim ve öne çıkanlar",
      "Tema, görünüm ve ana sayfa düzenleyici",
      "Kataloğunuzda küçük eKatalox reklamları görünür",
    ],
  },
  {
    slug: "starter",
    name: "Başlangıç",
    tagline: "Ürün yelpazesi büyüyen, reklamsız katalog ve ziyaret raporları isteyenler için.",
    yearlyPrice: 5_000,
    featured: false,
    ads: false,
    productLimit: 2_500,
    priceListLimit: 3,
    visitorLimit: 5_000,
    features: [
      "Ücretsiz planın özellikleri, reklamsız katalog",
      "2.500 ürün, 3 fiyat listesi (bayi / perakende / özel)",
      "Arama, sepete ekleme ve il–fiyat listesi raporları",
      "Aylık 5.000 ziyaretçi",
    ],
  },
  {
    slug: "professional",
    name: "Profesyonel",
    tagline: "Farklı bayi gruplarıyla çalışan, kampanya bildirimi ve vade ayarları isteyenler için.",
    yearlyPrice: 10_000,
    featured: true,
    ads: false,
    productLimit: 5_000,
    priceListLimit: 15,
    visitorLimit: 20_000,
    features: [
      "Başlangıç paketinin tamamı",
      "5.000 ürün, 15 fiyat listesi",
      "Bayilere anlık bildirim (yeni ürün, kampanya, stok)",
      "Ödeme ve vade ayarları",
      "Aylık 20.000 ziyaretçi",
    ],
  },
  {
    slug: "corporate",
    name: "Kurumsal",
    tagline: "Kendi alan adı, kurumsal site, bayi başvuruları ve katalogdan ödeme isteyenler için.",
    yearlyPrice: 15_000,
    featured: false,
    ads: false,
    productLimit: 20_000,
    priceListLimit: null,
    visitorLimit: 50_000,
    features: [
      "Profesyonel paketinin tamamı",
      "20.000 ürün, sınırsız fiyat listesi",
      "Kendi alan adınız (katalog.firmaniz.com)",
      "Pakete dahil SEO uyumlu kurumsal site ve Bayimiz ol formu",
      "İyzico/Paytr ile katalogdan ödeme",
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
