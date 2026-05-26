import {
  defaultCurrencyCode,
  supportedCurrencyCodes,
  type CurrencyCode,
} from "@/lib/products/constants";
import { formatCurrency } from "@/lib/utils";
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

export function buildWhatsAppMessage(params: {
  tenantName: string;
  items: CartItem[];
  note?: string;
}) {
  const lines = params.items.map((item) => {
    const lineTotal = item.price * item.quantity;
    return `• ${item.product_name} x ${item.quantity} adet = ${formatCurrency(lineTotal, item.currency)}`;
  });
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
    )
    .map(({ currency, total }) => `${currency}: ${formatCurrency(total, currency)}`);

  const noteLine = params.note?.trim() ? `\nNot: ${params.note.trim()}` : "";

  return [
    `Merhaba, ${params.tenantName} için sipariş oluşturmak istiyorum.`,
    "",
    ...lines,
    "",
    "Toplamlar:",
    ...totalLines,
    noteLine,
  ]
    .filter(Boolean)
    .join("\n");
}