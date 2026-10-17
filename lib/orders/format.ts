import { formatCurrency } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/products/constants";
import type { StorefrontOrder } from "@/lib/types";

export function formatOrderTotal(order: Pick<StorefrontOrder, "currency" | "total_amount">) {
  return order.currency === "CATALOG"
    ? "Fiyatsız katalog"
    : formatCurrency(order.total_amount, order.currency as CurrencyCode);
}

// Görünen sipariş numarası: "#100042". order_no henüz yoksa (0093 öncesi
// kayıt) eski uzun kodun son parçası ("N4MX") gösterilir; uzun kod asla.
export function formatOrderNo(order: Pick<StorefrontOrder, "order_no" | "order_number">) {
  if (typeof order.order_no === "number") return `#${order.order_no}`;
  const parts = order.order_number.split("_");
  return `#${(parts[parts.length - 1] ?? order.order_number).toUpperCase()}`;
}

export function formatPaymentMethod(method: StorefrontOrder["payment_method"]) {
  if (method === "cash") return "Nakit";
  if (method === "card") return "Kredi Kartı";
  if (method === "transfer") return "Havale / EFT";
  if (method === "online") return "Online Ödeme";
  return null;
}

/** Online ödemeli siparişin tahsilat durumu (0185); diğer yöntemlerde null. */
export function formatOnlinePaymentStatus(
  order: Pick<StorefrontOrder, "payment_method" | "payment_status">,
): { label: string; tone: "paid" | "waiting" | "failed" } | null {
  if (order.payment_method !== "online" || !order.payment_status) return null;
  if (order.payment_status === "paid") return { label: "Ödendi", tone: "paid" };
  if (order.payment_status === "failed") return { label: "Ödeme başarısız", tone: "failed" };
  return { label: "Ödeme bekleniyor", tone: "waiting" };
}
