import type { OrderStatus, StorefrontOrder } from "@/lib/types";
import { getStatusDescription, getStatusLabel } from "@/lib/orders/status";
import { normalizeCustomerPhone } from "@/lib/storefront/customer-phone";

// Bayinin tek tıkla göndereceği durum mesajı. WhatsApp Business API yok;
// otomatik gönderim yapılamaz, bu yüzden hazır metinle wa.me linki.
export function buildOrderStatusWhatsAppHref(params: {
  order: Pick<StorefrontOrder, "customer_phone" | "customer_name" | "order_number" | "cancel_reason" | "tracking_token">;
  status: OrderStatus;
  tenantName: string;
  isTekel: boolean;
  trackingUrl: string | null;
}) {
  const digits = normalizeCustomerPhone(params.order.customer_phone);
  // TR yerel biçim (05xx…) → uluslararası (905xx…)
  const intl = digits.startsWith("0") ? `9${digits}` : digits.startsWith("90") ? digits : `90${digits}`;
  const ad = params.order.customer_name.trim().split(/\s+/)[0] ?? "";
  const lines = [
    `Merhaba ${ad}, ${params.tenantName} — ${params.order.order_number} numaralı siparişiniz için bilgilendirme:`,
    `✅ Durum: ${getStatusLabel(params.status, { isTekel: params.isTekel })}`,
    getStatusDescription(params.status, { isTekel: params.isTekel }),
  ];
  if (params.status === "cancelled" && params.order.cancel_reason) {
    lines.push(`Sebep: ${params.order.cancel_reason}`);
  }
  if (params.trackingUrl) lines.push(`🔎 Takip: ${params.trackingUrl}`);
  return `https://wa.me/${intl}?text=${encodeURIComponent(lines.join("\n"))}`;
}
