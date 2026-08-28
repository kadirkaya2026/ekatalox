import { formatCurrency } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/products/constants";
import type { StorefrontOrder } from "@/lib/types";

export function formatOrderTotal(order: Pick<StorefrontOrder, "currency" | "total_amount">) {
  return order.currency === "CATALOG"
    ? "Fiyatsız katalog"
    : formatCurrency(order.total_amount, order.currency as CurrencyCode);
}

export function formatPaymentMethod(method: StorefrontOrder["payment_method"]) {
  if (method === "cash") return "Nakit";
  if (method === "card") return "Kredi Kartı";
  return null;
}
