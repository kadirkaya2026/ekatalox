import type { OrderStatus, StorefrontOrder } from "@/lib/types";
import { getStatusDescription, getStatusLabel } from "@/lib/orders/status";
import { normalizeCustomerPhone } from "@/lib/storefront/customer-phone";
import { formatOrderNo } from "@/lib/orders/format";

// Telefonlu siparişte doğrudan müşterinin numarasına, telefonsuz siparişte
// (toptancı/genel tenant, 0127) numarasız wa.me linki: WhatsApp açılır, bayi
// kişiyi kendisi seçer (vitrindeki sipariş gönderimiyle aynı yöntem, 14 Eki 2026).
function buildWaHref(phone: string | null, text: string): string {
  const encoded = encodeURIComponent(text);
  if (!phone) return `https://wa.me/?text=${encoded}`;
  const digits = normalizeCustomerPhone(phone);
  // TR yerel biçim (05xx…) → uluslararası (905xx…)
  const intl = digits.startsWith("0") ? `9${digits}` : digits.startsWith("90") ? digits : `90${digits}`;
  return `https://wa.me/${intl}?text=${encoded}`;
}

// Bayinin tek tıkla göndereceği durum mesajı. WhatsApp Business API yok;
// otomatik gönderim yapılamaz, bu yüzden hazır metinle wa.me linki.
export function buildOrderStatusWhatsAppHref(params: {
  order: Pick<StorefrontOrder, "customer_phone" | "customer_name" | "order_number" | "order_no" | "cancel_reason" | "tracking_token">;
  status: OrderStatus;
  tenantName: string;
  isTekel: boolean;
  isWholesale?: boolean;
  trackingUrl: string | null;
}): string {
  const ad = params.order.customer_name.trim().split(/\s+/)[0] || "";
  const lines = [
    `Merhaba ${ad}, ${params.tenantName} — ${formatOrderNo(params.order)} numaralı siparişiniz:`,
    `✅ Durum: ${getStatusLabel(params.status, { isTekel: params.isTekel })}`,
    getStatusDescription(params.status, { isTekel: params.isTekel, isWholesale: params.isWholesale }),
  ];
  if (params.status === "cancelled" && params.order.cancel_reason) {
    lines.push(`Sebep: ${params.order.cancel_reason}`);
  }
  // Takip linki mesaja eklenmiyor (kullanıcı kararı, 29 Ağu 2026); müşteri
  // vitrindeki "Sipariş Takip" ikonundan numarasıyla ulaşıyor.
  return buildWaHref(params.order.customer_phone, lines.join("\n"));
}

// Fiş düzenlendikten sonra müşteriye gönderilecek güncel fiş (0154): kalemler,
// adetler ve toplam metin olarak + güncel fişin linki (takip sayfası DB'den
// okur, düzenlenmiş hâli gösterir). Otomatik gitmez; bayi wa.me ile gönderir.
export function buildOrderUpdatedWhatsAppHref(params: {
  order: Pick<
    StorefrontOrder,
    "customer_phone" | "customer_name" | "order_number" | "order_no" | "items" | "total_amount" | "currency"
  >;
  tenantName: string;
  formatMoney: (value: number) => string;
  trackingUrl?: string | null;
}): string {
  const ad = params.order.customer_name.trim().split(/\s+/)[0] || "";
  const priced = params.order.currency !== "CATALOG";
  const lines = [
    `Merhaba ${ad}, ${params.tenantName} — ${formatOrderNo(params.order)} numaralı siparişiniz güncellendi. Güncel fişiniz:`,
    "",
    ...params.order.items.map((item) => {
      const name = item.product_name + (item.variant_name ? ` (${item.variant_name})` : "");
      return priced && item.price !== null
        ? `• ${item.quantity} × ${name} — ${params.formatMoney(item.price * item.quantity)}`
        : `• ${item.quantity} × ${name}`;
    }),
  ];
  if (priced) lines.push("", `Toplam: ${params.formatMoney(params.order.total_amount)}`);
  if (params.trackingUrl) lines.push("", `Güncel fişinizi buradan görebilirsiniz: ${params.trackingUrl}`);
  return buildWaHref(params.order.customer_phone, lines.join("\n"));
}
