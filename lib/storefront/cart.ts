import {
  defaultCurrencyCode,
  supportedCurrencyCodes,
  type CurrencyCode,
} from "@/lib/products/constants";
import type { CartItem } from "@/lib/types";

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

export interface CartDiscountConfig {
  threshold: number;
  percentage: number;
  isActive: boolean;
}

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

function roundCurrencyAmount(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const whatsappCurrencySymbols: Record<CurrencyCode, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
};

function formatWhatsAppMoney(value: number, currency: CurrencyCode) {
  return `${roundCurrencyAmount(value).toFixed(2)} ${whatsappCurrencySymbols[currency]}`;
}

export function formatDiscountPercentage(value: number) {
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
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
    (
      entry,
    ): entry is [CurrencyCode, number] => typeof entry[1] === "number",
  );

  if (currencies.length !== 1) {
    return null;
  }

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

export function buildWhatsAppMessage(params: {
  tenantName: string;
  items: CartItem[];
  note?: string;
  discountConfig?: CartDiscountConfig | null;
}) {
  const lines = params.items.map((item) => {
    const lineTotal = item.price * item.quantity;
    const productLabel = item.variant_name
      ? `${item.product_name} / ${item.variant_name}`
      : item.product_name;
    return `• ${productLabel} x ${item.quantity} adet = ${formatWhatsAppMoney(lineTotal, item.currency)}`;
  });
  const discountSummary = getCartDiscountSummary(params.items, params.discountConfig);
  const totalsByCurrency = getCartTotalsByCurrency(params.items);
  const totalLines = supportedCurrencyCodes
    .map((currency) => ({
      currency,
      total: totalsByCurrency[currency],
    }))
    .filter(
      (
        item,
      ): item is {
        currency: CurrencyCode;
        total: number;
      } => typeof item.total === "number",
    );
  const totalSection = discountSummary
    ? [
        "----------------------------",
        ...(discountSummary.isQualified
          ? [
              `Ara Toplam: ${formatWhatsAppMoney(
                discountSummary.subtotal,
                discountSummary.currency,
              )}`,
              `İskonto (%${formatDiscountPercentage(
                discountSummary.percentage,
              )}): -${formatWhatsAppMoney(
                discountSummary.discountAmount,
                discountSummary.currency,
              )}`,
              `Genel Toplam: ${formatWhatsAppMoney(
                discountSummary.totalAfterDiscount,
                discountSummary.currency,
              )}`,
            ]
          : [
              `Genel Toplam: ${formatWhatsAppMoney(
                discountSummary.subtotal,
                discountSummary.currency,
              )}`,
            ]),
        "----------------------------",
      ]
    : totalLines.length === 1
      ? [
          "----------------------------",
          `Genel Toplam: ${formatWhatsAppMoney(
            totalLines[0].total,
            totalLines[0].currency,
          )}`,
          "----------------------------",
        ]
      : [
          "Toplamlar:",
          ...totalLines.map(
            ({ currency, total }) => `${currency}: ${formatWhatsAppMoney(total, currency)}`,
          ),
        ];
  const noteLine = params.note?.trim() ? `Not: ${params.note.trim()}` : null;

  return [
    `Merhaba, ${params.tenantName} için sipariş oluşturmak istiyorum.`,
    "",
    ...lines,
    "",
    ...totalSection,
    ...(noteLine ? ["", noteLine] : []),
  ]
    .filter(Boolean)
    .join("\n");
}

export function getCartVariantCount(items: CartItem[], productId: string) {
  return new Set(
    items
      .filter((item) => item.product_id === productId && item.variant_id)
      .map((item) => item.variant_id),
  ).size;
}