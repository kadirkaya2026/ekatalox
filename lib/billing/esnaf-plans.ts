// Esnaf paketleri (8 Eyl 2026): pazarlama sitesi, kayıt formu ve kupon
// hesabı buradan okur. Kimlikler mevcut plan sistemine bağlıdır (pro/business)
// ki canlıdaki mağazalar bozulmasın; görünen ad ve içerik esnaf diliyle.
// lib/billing/plans.ts PLAN_PRICING ve PLAN_MARKETING_META bununla senkron tutulur.
import type { TenantPlan } from "@/lib/billing/plans";

export type EsnafPlanSlug = "esnaf" | "esnaf_plus";
export type BillingPeriod = "monthly" | "yearly";

export interface EsnafPlan {
  slug: EsnafPlanSlug;
  planId: TenantPlan;
  name: string;
  tagline: string;
  yearlyPrice: number;
  monthlyPrice: number;
  featured: boolean;
  magnetCount: number;
  productLimit: number;
  features: string[];
}

export const ESNAF_PLANS: EsnafPlan[] = [
  {
    slug: "esnaf",
    planId: "pro",
    name: "Esnaf",
    tagline: "Telefonu susturmak için gereken her şey.",
    yearlyPrice: 25000,
    monthlyPrice: 3490,
    featured: false,
    magnetCount: 100,
    productLimit: 1000,
    features: [
      "Kendi adresinde sipariş sayfası (dukkan.ekatalox.com)",
      "Ürünlerin fotoğraf ve fiyatıyla bizim tarafımızdan yüklenmesi",
      "WhatsApp'a PDF sipariş, hazırlanıyor ve yola çıktı bildirimleri",
      "Kampanya ve indirimli ürün sayfası",
      "Yoğunum modu, çalışma saatleri, minimum sepet, yaş doğrulama",
      "100 adet QR magnet hediye",
      "1.000 ürüne kadar",
    ],
  },
  {
    slug: "esnaf_plus",
    planId: "business",
    name: "Esnaf Plus",
    tagline: "Sadık müşteri ve kâr takibi isteyen dükkânlar için.",
    yearlyPrice: 40000,
    monthlyPrice: 5590,
    featured: true,
    magnetCount: 300,
    productLimit: 2500,
    features: [
      "Esnaf paketinin tamamı",
      "Kendi alan adı (dukkanim.com)",
      "Veresiye takibi ve tahsilat bildirimi",
      "Satış ve kârlılık raporu",
      "Müşteri kuponu ve \"sizi özledik\" bildirimleri",
      "300 adet QR magnet hediye ve magnet sipariş takibi",
      "Öncelikli destek hattı, 2.500 ürüne kadar",
    ],
  },
];

export const ESNAF_TRIAL_DAYS = 30;

export function getEsnafPlan(slug: string): EsnafPlan | null {
  return ESNAF_PLANS.find((p) => p.slug === slug) ?? null;
}

export function getEsnafPlanByPlanId(planId: string): EsnafPlan | null {
  return ESNAF_PLANS.find((p) => p.planId === planId) ?? null;
}

export function getPlanPrice(plan: EsnafPlan, period: BillingPeriod) {
  return period === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
}

/** Yıllık ödemenin aylığın 12 katına göre yüzde tasarrufu (≈ %40). */
export function yearlySavingsPct(plan: EsnafPlan) {
  return Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100);
}

export function formatTry(amount: number) {
  return `${amount.toLocaleString("tr-TR")} ₺`;
}
