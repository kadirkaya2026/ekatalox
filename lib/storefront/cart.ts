import { defaultCurrencyCode } from "@/lib/products/constants";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/lib/types";

export function getCartTotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
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
    return `• ${item.product_name} x ${item.quantity} = ${formatCurrency(lineTotal, item.currency)}`;
  });

  const noteLine = params.note?.trim() ? `\nNot: ${params.note.trim()}` : "";

  return [
    `Merhaba, ${params.tenantName} için sipariş oluşturmak istiyorum.`,
    "",
    ...lines,
    "",
    `Toplam: ${formatCurrency(getCartTotal(params.items), getCartCurrency(params.items))}`,
    noteLine,
  ]
    .filter(Boolean)
    .join("\n");
}