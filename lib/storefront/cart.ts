import {
  defaultCurrencyCode,
  supportedCurrencyCodes,
  type CurrencyCode,
} from "@/lib/products/constants";
import type { CartItem, InstallmentOption } from "@/lib/types";

export function getCartTotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function getCartTotalsByCurrency(items: CartItem[]) {
  return items.reduce<Partial<Record<CurrencyCode, number>>>((totals, item) => {
    totals[item.currency] = (totals[item.currency] ?? 0) + item.price * item.quantity;
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

// ─── Interfaces ───────────────────────────────────────────────────────────────

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
  /** Sepet ham toplamı */
  subtotal: number;
  /** İskonto uygulanmak için gereken minimum tutar */
  discountThreshold: number;
  /** Baraj erişildi mi */
  isQualified: boolean;
  /** Baraj'a kalan tutar */
  remainingAmount: number;
  /** Uygulanan iskonto yüzdesi (0 = iskonto yok) */
  discountPercentage: number;
  /** İskonto tutarı */
  discountAmount: number;
  /** İskonto sonrası ara toplam */
  afterDiscount: number;
  /** Seçilen taksit seçeneği */
  selectedInstallment: InstallmentOption | null;
  /** Vade farkı yüzdesi (0 = vade farkı yok) */
  surchargePercentage: number;
  /** Vade farkı tutarı */
  surchargeAmount: number;
  /** Nihai tutar (iskonto - vade farkı dahil) */
  finalTotal: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roundCurrencyAmount(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatDiscountPercentage(value: number) {
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

const whatsappCurrencySymbols: Record<CurrencyCode, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
};

function formatWhatsAppMoney(value: number, currency: CurrencyCode) {
  return `${roundCurrencyAmount(value).toFixed(2)} ${whatsappCurrencySymbols[currency]}`;
}

// ─── Core calculation ─────────────────────────────────────────────────────────

export function getCartPaymentSummary(
  items: CartItem[],
  paymentMethod: "cash" | "card",
  discountConfig: CartDiscountConfig | null,
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

  const threshold = discountConfig?.threshold ?? 0;
  const discountActive =
    !!(discountConfig?.isActive) && threshold > 0 && (discountConfig?.percentage ?? 0) > 0;
  const isQualified = discountActive && roundedSubtotal >= threshold;
  const discountPercentage = isQualified ? (discountConfig?.percentage ?? 0) : 0;
  const discountAmount = isQualified
    ? roundCurrencyAmount((roundedSubtotal * discountPercentage) / 100)
    : 0;
  const afterDiscount = roundCurrencyAmount(roundedSubtotal - discountAmount);

  const surchargePercentage =
    paymentMethod === "card" ? (selectedInstallment?.surchargePercentage ?? 0) : 0;
  const surchargeAmount =
    surchargePercentage > 0
      ? roundCurrencyAmount((afterDiscount * surchargePercentage) / 100)
      : 0;
  const finalTotal = roundCurrencyAmount(afterDiscount + surchargeAmount);

  return {
    currency,
    paymentMethod,
    subtotal: roundedSubtotal,
    discountThreshold: threshold,
    isQualified,
    remainingAmount: roundCurrencyAmount(Math.max(threshold - roundedSubtotal, 0)),
    discountPercentage,
    discountAmount,
    afterDiscount,
    selectedInstallment,
    surchargePercentage,
    surchargeAmount,
    finalTotal,
  };
}

/** Backward-compat wrapper — sadece iskonto özeti (taksit yok) */
export interface CartDiscountSummary {
  currency: CurrencyCode;
  threshold: number;
  percentage: number;
  subtotal: number;
  remainingAmount: number;
  discountAmount: number;
  totalAfterDiscount: number;
  isQualified: boolean;
}

export function getCartDiscountSummary(
  items: CartItem[],
  config?: CartDiscountConfig | null,
): CartDiscountSummary | null {
  if (!items.length || !config?.isActive || config.threshold <= 0 || config.percentage <= 0) {
    return null;
  }

  const totalsByCurrency = getCartTotalsByCurrency(items);
  const currencies = Object.entries(totalsByCurrency).filter(
    (entry): entry is [CurrencyCode, number] => typeof entry[1] === "number",
  );

  if (currencies.length !== 1) return null;

  const [currency, subtotal] = currencies[0];
  const isQualified = subtotal >= config.threshold;
  const discountAmount = isQualified
    ? roundCurrencyAmount((subtotal * config.percentage) / 100)
    : 0;

  return {
    currency,
    threshold: config.threshold,
    percentage: config.percentage,
    subtotal: roundCurrencyAmount(subtotal),
    remainingAmount: roundCurrencyAmount(Math.max(config.threshold - subtotal, 0)),
    discountAmount,
    totalAfterDiscount: roundCurrencyAmount(subtotal - discountAmount),
    isQualified,
  };
}

// ─── WhatsApp message builder ─────────────────────────────────────────────────

export function buildWhatsAppMessage(params: {
  tenantName: string;
  items: CartItem[];
  note?: string;
  paymentMethod?: "cash" | "card" | null;
  selectedInstallment?: InstallmentOption | null;
  discountConfig?: CartDiscountConfig | null;
  discountConditionNote?: string | null;
}) {
  const lines = params.items.map((item) => {
    const lineTotal = item.price * item.quantity;
    const productLabel = item.variant_name
      ? `${item.product_name} / ${item.variant_name}`
      : item.product_name;
    return `• ${productLabel} x ${item.quantity} adet = ${formatWhatsAppMoney(lineTotal, item.currency)}`;
  });

  const paymentMethod = params.paymentMethod ?? null;

  let paymentLine: string | null = null;
  if (paymentMethod === "cash") {
    paymentLine = "Ödeme Yöntemi: Nakit";
  } else if (paymentMethod === "card") {
    const inst = params.selectedInstallment;
    if (inst) {
      const surchargeStr =
        inst.surchargePercentage > 0
          ? ` - %${formatDiscountPercentage(inst.surchargePercentage)} Vade Farkı`
          : "";
      paymentLine = `Ödeme Yöntemi: Kredi Kartı - ${inst.label}${surchargeStr}`;
    } else {
      paymentLine = "Ödeme Yöntemi: Kredi Kartı";
    }
  }

  const summary =
    paymentMethod
      ? getCartPaymentSummary(
          params.items,
          paymentMethod,
          params.discountConfig ?? null,
          params.selectedInstallment ?? null,
        )
      : null;

  const totalsByCurrency = getCartTotalsByCurrency(params.items);
  const totalLines = supportedCurrencyCodes
    .map((currency) => ({ currency, total: totalsByCurrency[currency] }))
    .filter(
      (item): item is { currency: CurrencyCode; total: number } =>
        typeof item.total === "number",
    );

  let totalSection: string[];

  if (summary) {
    const hasDiscount = summary.isQualified && summary.discountAmount > 0;
    const hasSurcharge = summary.surchargeAmount > 0;
    const showBreakdown = hasDiscount || hasSurcharge;

    if (showBreakdown) {
      totalSection = [
        "----------------------------",
        `Ara Toplam: ${formatWhatsAppMoney(summary.subtotal, summary.currency)}`,
        ...(hasDiscount
          ? [
              `İskonto (%${formatDiscountPercentage(summary.discountPercentage)}): -${formatWhatsAppMoney(summary.discountAmount, summary.currency)}`,
            ]
          : []),
        ...(hasSurcharge
          ? [
              `Vade Farkı (%${formatDiscountPercentage(summary.surchargePercentage)}): +${formatWhatsAppMoney(summary.surchargeAmount, summary.currency)}`,
            ]
          : []),
        `Genel Toplam: ${formatWhatsAppMoney(summary.finalTotal, summary.currency)}`,
        "----------------------------",
      ];
    } else {
      totalSection = [
        "----------------------------",
        `Genel Toplam: ${formatWhatsAppMoney(summary.finalTotal, summary.currency)}`,
        "----------------------------",
      ];
    }
  } else if (totalLines.length === 1) {
    totalSection = [
      "----------------------------",
      `Genel Toplam: ${formatWhatsAppMoney(totalLines[0].total, totalLines[0].currency)}`,
      "----------------------------",
    ];
  } else {
    totalSection = [
      "Toplamlar:",
      ...totalLines.map(
        ({ currency, total }) => `${currency}: ${formatWhatsAppMoney(total, currency)}`,
      ),
    ];
  }

  const conditionLine =
    params.discountConditionNote?.trim()
      ? `⚠️ İskonto Şartı: ${params.discountConditionNote.trim()}`
      : null;
  const noteLine = params.note?.trim() ? `Not: ${params.note.trim()}` : null;

  return [
    `Merhaba, ${params.tenantName} için sipariş oluşturmak istiyorum.`,
    "",
    ...(paymentLine ? [paymentLine, ""] : []),
    ...lines,
    "",
    ...totalSection,
    ...(conditionLine ? ["", conditionLine] : []),
    ...(noteLine ? ["", noteLine] : []),
  ]
    .filter((line, i, arr) => {
      // remove consecutive empty lines
      if (line === "" && arr[i - 1] === "") return false;
      return true;
    })
    .join("\n");
}

export function getCartVariantCount(items: CartItem[], productId: string) {
  return new Set(
    items
      .filter((item) => item.product_id === productId && item.variant_id)
      .map((item) => item.variant_id),
  ).size;
}
