import {
  defaultCurrencyCode,
  supportedCurrencyCodes,
  type CurrencyCode,
} from "@/lib/products/constants";
import type { CartItem, CashDiscountTier, CardCampaignTier, InstallmentOption } from "@/lib/types";

export function getCartTotal(items: CartItem[]) {
  return items.reduce((total, item) => total + (item.price ?? 0) * item.quantity, 0);
}

export function getCartTotalsByCurrency(items: CartItem[]) {
  return items.reduce<Partial<Record<CurrencyCode, number>>>((totals, item) => {
    totals[item.currency] = (totals[item.currency] ?? 0) + (item.price ?? 0) * item.quantity;
    return totals;
  }, {});
}

export function getCartCurrency(items: CartItem[]) {
  return items[0]?.currency ?? defaultCurrencyCode;
}

// ─── Installment defaults ─────────────────────────────────────────────────────

export const DEFAULT_INSTALLMENT_OPTIONS: InstallmentOption[] = [
  { count: 1,  label: "Peşin",     isActive: true,  surchargePercentage: 0 },
  { count: 2,  label: "2 Taksit",  isActive: false, surchargePercentage: 0 },
  { count: 3,  label: "3 Taksit",  isActive: false, surchargePercentage: 0 },
  { count: 4,  label: "4 Taksit",  isActive: false, surchargePercentage: 0 },
  { count: 5,  label: "5 Taksit",  isActive: false, surchargePercentage: 0 },
  { count: 6,  label: "6 Taksit",  isActive: false, surchargePercentage: 0 },
  { count: 7,  label: "7 Taksit",  isActive: false, surchargePercentage: 0 },
  { count: 8,  label: "8 Taksit",  isActive: false, surchargePercentage: 0 },
  { count: 9,  label: "9 Taksit",  isActive: false, surchargePercentage: 0 },
  { count: 10, label: "10 Taksit", isActive: false, surchargePercentage: 0 },
  { count: 11, label: "11 Taksit", isActive: false, surchargePercentage: 0 },
  { count: 12, label: "12 Taksit", isActive: false, surchargePercentage: 0 },
];

// ─── Config interfaces ────────────────────────────────────────────────────────

/** Nakit iskonto tiered config */
export interface CashTieredConfig {
  tiers: CashDiscountTier[];
  isActive: boolean;
}

/** Kart 0-komisyon tiered config */
export interface CardTieredConfig {
  tiers: CardCampaignTier[];
  isActive: boolean;
}

// Backward-compat — hâlâ kullanılabilir
export interface CartDiscountConfig {
  threshold: number;
  percentage: number;
  isActive: boolean;
  conditionNote?: string | null;
}

/** Full summary combining discount + installment surcharge */
export interface CartPaymentSummary {
  currency: CurrencyCode;
  paymentMethod: "cash" | "card";
  subtotal: number;
  discountThreshold: number;
  isQualified: boolean;
  remainingAmount: number;
  discountPercentage: number;
  discountAmount: number;
  afterDiscount: number;
  selectedInstallment: InstallmentOption | null;
  surchargePercentage: number;
  surchargeAmount: number;
  finalTotal: number;
  zeroCommissionApplied: boolean;
  /** Hangi nakit tier uygulandı */
  appliedCashTier: CashDiscountTier | null;
  /** Hangi kart tier uygulandı */
  appliedCardTier: CardCampaignTier | null;
}

// ─── Tier seçim helpers ────────────────────────────────────────────────────────

function getBestCashTier(tiers: CashDiscountTier[], subtotal: number): CashDiscountTier | null {
  return (
    tiers
      .filter((t) => t.threshold > 0 && t.percentage > 0 && subtotal >= t.threshold)
      .sort((a, b) => b.threshold - a.threshold)[0] ?? null
  );
}

export function getNextCashTier(
  tiers: CashDiscountTier[],
  subtotal: number,
): CashDiscountTier | null {
  return (
    tiers
      .filter((t) => t.threshold > 0 && t.percentage > 0 && subtotal < t.threshold)
      .sort((a, b) => a.threshold - b.threshold)[0] ?? null
  );
}

function getBestCardTier(tiers: CardCampaignTier[], subtotal: number): CardCampaignTier | null {
  return (
    tiers
      .filter((t) => t.threshold > 0 && subtotal >= t.threshold)
      .sort((a, b) => b.threshold - a.threshold)[0] ?? null
  );
}

export function getNextCardTier(
  tiers: CardCampaignTier[],
  subtotal: number,
): CardCampaignTier | null {
  return (
    tiers
      .filter((t) => t.threshold > 0 && subtotal < t.threshold)
      .sort((a, b) => a.threshold - b.threshold)[0] ?? null
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roundCurrencyAmount(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatDiscountPercentage(value: number) {
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

// ─── Core calculation ─────────────────────────────────────────────────────────

export function getCartPaymentSummary(
  items: CartItem[],
  paymentMethod: "cash" | "card",
  cashConfig: CashTieredConfig | null,
  cardConfig: CardTieredConfig | null,
  selectedInstallment: InstallmentOption | null,
): CartPaymentSummary | null {
  if (!items.length) return null;

  const totalsByCurrency = getCartTotalsByCurrency(items);
  const currencies = Object.entries(totalsByCurrency).filter(
    (entry): entry is [CurrencyCode, number] => typeof entry[1] === "number",
  );
  if (currencies.length !== 1) return null;

  const [currency, subtotal] = currencies[0];
  const roundedSubtotal = roundCurrencyAmount(subtotal);

  // ── Nakit ──
  const appliedCashTier =
    paymentMethod === "cash" && cashConfig?.isActive && (cashConfig.tiers?.length ?? 0) > 0
      ? getBestCashTier(cashConfig.tiers, roundedSubtotal)
      : null;

  const discountThreshold = appliedCashTier?.threshold ?? 0;
  const isQualified = appliedCashTier !== null;
  const discountPercentage = appliedCashTier?.percentage ?? 0;
  const discountAmount =
    discountPercentage > 0
      ? roundCurrencyAmount((roundedSubtotal * discountPercentage) / 100)
      : 0;
  const afterDiscount = roundCurrencyAmount(roundedSubtotal - discountAmount);

  // ── Kart ──
  const appliedCardTier =
    paymentMethod === "card" && cardConfig?.isActive && (cardConfig.tiers?.length ?? 0) > 0
      ? getBestCardTier(cardConfig.tiers, roundedSubtotal)
      : null;

  const zeroCommissionApplied =
    paymentMethod === "card" &&
    appliedCardTier !== null &&
    selectedInstallment !== null &&
    selectedInstallment.count <= appliedCardTier.maxFreeInstallmentCount;

  const surchargePercentage = zeroCommissionApplied
    ? 0
    : paymentMethod === "card"
      ? (selectedInstallment?.surchargePercentage ?? 0)
      : 0;

  const finalTotal =
    surchargePercentage > 0
      ? roundCurrencyAmount(afterDiscount / (1 - surchargePercentage / 100))
      : afterDiscount;
  const surchargeAmount = roundCurrencyAmount(finalTotal - afterDiscount);

  const remainingForNextCashTier =
    paymentMethod === "cash" && cashConfig?.isActive
      ? roundCurrencyAmount(
          Math.max((getNextCashTier(cashConfig.tiers ?? [], roundedSubtotal)?.threshold ?? 0) - roundedSubtotal, 0),
        )
      : 0;

  return {
    currency,
    paymentMethod,
    subtotal: roundedSubtotal,
    discountThreshold,
    isQualified,
    remainingAmount:
      paymentMethod === "cash"
        ? remainingForNextCashTier
        : roundCurrencyAmount(
            Math.max((appliedCardTier?.threshold ?? cardConfig?.tiers?.[0]?.threshold ?? 0) - roundedSubtotal, 0),
          ),
    discountPercentage,
    discountAmount,
    afterDiscount,
    selectedInstallment,
    surchargePercentage,
    surchargeAmount,
    finalTotal,
    zeroCommissionApplied,
    appliedCashTier,
    appliedCardTier,
  };
}

/** Kart kampanyası upsell bar — ödeme yöntemi seçilmeden önce de gösterilir */
export interface CartCardCampaignStatus {
  currency: CurrencyCode;
  subtotal: number;
  isQualified: boolean;
  /** Ulaşılan en iyi tier */
  appliedTier: CardCampaignTier | null;
  /** Bir sonraki tier */
  nextTier: CardCampaignTier | null;
  /** Sonraki tiere kalan tutar */
  remainingAmount: number;
}

export function getCartCardCampaignStatus(
  items: CartItem[],
  config: CardTieredConfig,
): CartCardCampaignStatus | null {
  if (!items.length || !config.isActive || !config.tiers?.length) return null;

  const totalsByCurrency = getCartTotalsByCurrency(items);
  const currencies = Object.entries(totalsByCurrency).filter(
    (entry): entry is [CurrencyCode, number] => typeof entry[1] === "number",
  );
  if (currencies.length !== 1) return null;

  const [currency, subtotal] = currencies[0];
  const rounded = roundCurrencyAmount(subtotal);

  const appliedTier = getBestCardTier(config.tiers, rounded);
  const nextTier = getNextCardTier(config.tiers, rounded);

  return {
    currency,
    subtotal: rounded,
    isQualified: appliedTier !== null,
    appliedTier,
    nextTier,
    remainingAmount: roundCurrencyAmount(Math.max((nextTier?.threshold ?? 0) - rounded, 0)),
  };
}

/** Nakit kampanyası upsell bar — taksit yok, sadece iskonto özeti */
export interface CartDiscountSummary {
  currency: CurrencyCode;
  subtotal: number;
  isQualified: boolean;
  /** Ulaşılan en iyi tier */
  appliedTier: CashDiscountTier | null;
  /** Bir sonraki tier */
  nextTier: CashDiscountTier | null;
  /** Backward compat */
  threshold: number;
  percentage: number;
  remainingAmount: number;
  discountAmount: number;
  totalAfterDiscount: number;
}

export function getCartDiscountSummary(
  items: CartItem[],
  config?: CashTieredConfig | null,
): CartDiscountSummary | null {
  if (!items.length || !config?.isActive || !config.tiers?.length) return null;

  const totalsByCurrency = getCartTotalsByCurrency(items);
  const currencies = Object.entries(totalsByCurrency).filter(
    (entry): entry is [CurrencyCode, number] => typeof entry[1] === "number",
  );
  if (currencies.length !== 1) return null;

  const [currency, subtotal] = currencies[0];
  const rounded = roundCurrencyAmount(subtotal);

  const appliedTier = getBestCashTier(config.tiers, rounded);
  const nextTier = getNextCashTier(config.tiers, rounded);

  const percentage = appliedTier?.percentage ?? 0;
  const threshold = appliedTier?.threshold ?? nextTier?.threshold ?? 0;
  const discountAmount =
    appliedTier
      ? roundCurrencyAmount((rounded * appliedTier.percentage) / 100)
      : 0;

  return {
    currency,
    subtotal: rounded,
    isQualified: appliedTier !== null,
    appliedTier,
    nextTier,
    threshold,
    percentage,
    remainingAmount: roundCurrencyAmount(Math.max((nextTier?.threshold ?? 0) - rounded, 0)),
    discountAmount,
    totalAfterDiscount: roundCurrencyAmount(rounded - discountAmount),
  };
}

export function buildAppliedCampaignBenefitNotes(summary: CartPaymentSummary): string[] {
  const notes: string[] = [];
  const thresholdLabel = `${summary.discountThreshold} ${summary.currency}`;

  if (summary.paymentMethod === "cash" && summary.appliedCashTier && summary.discountAmount > 0) {
    notes.push(
      `${thresholdLabel} ve üzerine nakit alıma %${formatDiscountPercentage(summary.discountPercentage)} iskonto kampanyasından faydalanılmıştır.`,
    );
  }

  if (
    summary.paymentMethod === "card" &&
    summary.zeroCommissionApplied &&
    summary.appliedCardTier
  ) {
    notes.push(
      `${summary.appliedCardTier.threshold} ${summary.currency} ve üzerine kart ile ${summary.appliedCardTier.maxFreeInstallmentCount} taksite kadar 0 komisyon kampanyasından faydalanılmıştır.`,
    );
  }

  return notes;
}

// ─── WhatsApp message builder ─────────────────────────────────────────────────

export function buildWhatsAppMessage(params: {
  tenantName: string;
  customerReferenceName: string;
  customerAddress?: string;
  customerPhone?: string;
  pdfUrl?: string | null;
  // Alkol/sigara bayii (tekel) tenant'lar yasal olarak dağıtım/teslimat
  // yapamaz — bu mesaj adres satırı içermemeli, bunun yerine ürünün
  // mağazadan elden teslim alınacağını açıkça belirten bir ibare taşımalı
  // (kullanıcı isteği, 20 Ağu 2026). Bu, hem "adres istemedik" savunmasını
  // hem de her siparişte WhatsApp geçmişinde kayıtlı bir "elden teslim"
  // beyanını sağlar.
  isTekel?: boolean;
}) {
  const lines = [
    `Merhaba, ${params.tenantName} için sipariş oluşturmak istiyorum`,
    `👤 Müşteri/cari : ${params.customerReferenceName.trim()}`,
  ];

  if (!params.isTekel && params.customerAddress?.trim()) {
    lines.push(`📍 Adres : ${params.customerAddress.trim()}`);
  }

  if (params.customerPhone?.trim()) {
    lines.push(`📞 Telefon : ${params.customerPhone.trim()}`);
  }

  if (params.pdfUrl?.trim()) {
    lines.push(`📄 Sipariş Fişi : ${params.pdfUrl.trim()}`);
  }

  if (params.isTekel) {
    lines.push(`🏪 Bu sipariş mağazadan elden teslim alınacaktır. Kargo/gönderi yapılmamaktadır.`);
  }

  return lines.join("\n");
}

export function getCartVariantCount(items: CartItem[], productId: string) {
  return new Set(
    items
      .filter((item) => item.product_id === productId && item.variant_id)
      .map((item) => item.variant_id),
  ).size;
}

export function updateCartLineQuantity(
  items: CartItem[],
  lineId: string,
  nextQuantity: number,
) {
  if (nextQuantity <= 0) {
    return items.filter((item) => item.id !== lineId);
  }

  return items.map((item) =>
    item.id === lineId
      ? {
          ...item,
          quantity: nextQuantity,
          sales_unit: "adet" as const,
          unit_quantity: nextQuantity,
        }
      : item,
  );
}
