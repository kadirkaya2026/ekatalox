import type { OrderStatus } from "@/lib/types";

// Sipariş durum makinesi — SQL'deki transition_order_status (0092) ile
// birebir aynı kurallar. Burası yalnız arayüz için (hangi düğme görünsün);
// asıl doğrulama veritabanında.

export const ORDER_STATUSES: OrderStatus[] = [
  "new",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];

// Fiş düzenleme (0151): yalnız bu durumlarda adet değiştirilebilir — SQL'deki
// update_order_items ile aynı. Düzenleme olayı, from=to olan bir
// order_status_events satırı ve bu önekle başlayan reason ile tutulur.
export const ORDER_EDITABLE_STATUSES: OrderStatus[] = ["new", "confirmed", "preparing"];
export const ORDER_EDIT_EVENT_PREFIX = "Fiş düzenlendi:";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Yeni",
  confirmed: "Onaylandı",
  preparing: "Hazırlanıyor",
  shipped: "Yola çıktı",
  delivered: "Teslim edildi",
  cancelled: "İptal",
};

// Tekel (gel-al) bayide "yola çıktı" yerine "hazır" — kurye yok.
export function getStatusLabel(status: OrderStatus, options?: { isTekel?: boolean }) {
  if (options?.isTekel && status === "shipped") return "Hazır, teslim alınabilir";
  return ORDER_STATUS_LABELS[status];
}

/** Müşteriye giden açıklama cümlesi (takip sayfası, push, WhatsApp). */
// isWholesale: toptancı/genel tenant (27 Eyl 2026'dan beri onlarda da sipariş
// yönetimi var) — kurye/"afiyet olsun" gibi market cümleleri yerine sade metin.
export function getStatusDescription(
  status: OrderStatus,
  options?: { isTekel?: boolean; isWholesale?: boolean },
) {
  if (options?.isWholesale) {
    switch (status) {
      case "new":
        return "Siparişiniz alındı, en kısa sürede onaylanacak.";
      case "confirmed":
        return "Siparişiniz onaylandı, hazırlığa alınıyor.";
      case "preparing":
        return "Siparişiniz hazırlanıyor.";
      case "shipped":
        return "Siparişiniz yola çıktı.";
      case "delivered":
        return "Siparişiniz teslim edildi. Teşekkür ederiz.";
      case "cancelled":
        return "Siparişiniz iptal edildi. Sorunuz için bizimle iletişime geçebilirsiniz.";
    }
  }
  switch (status) {
    case "new":
      return "Mağaza en kısa sürede onaylayacak.";
    case "confirmed":
      return "Mağaza siparişinizi onayladı, hazırlığa alınıyor.";
    case "preparing":
      return "Ürünleriniz paketleniyor.";
    case "shipped":
      return options?.isTekel
        ? "Mağazadan teslim alabilirsiniz."
        : "Kurye yola çıktı, kısa süre içinde kapınızda.";
    case "delivered":
      return "Teslim edildi, afiyet olsun.";
    case "cancelled":
      return "Mağaza siparişi iptal etti. Sorunuz için WhatsApp'tan yazabilirsiniz.";
  }
}

// Tailwind rozet tonları (Badge içinde className olarak)
export const ORDER_STATUS_TONES: Record<OrderStatus, string> = {
  new: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  preparing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-700",
};

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["confirmed", "preparing", "cancelled"],
  confirmed: ["preparing", "shipped", "delivered", "cancelled"],
  preparing: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered", "cancelled"],
  // Teslim edilen kesin son; son iptal noktası "yola çıktı" (0095).
  delivered: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Ciroya/kâra giren tek durum. */
export const isRevenueStatus = (status: OrderStatus) => status === "delivered";

/** Henüz sonuçlanmamış: "bekleyen tutar" KPI'sı. */
export const isPendingStatus = (status: OrderStatus) =>
  status === "new" || status === "confirmed" || status === "preparing" || status === "shipped";

export const isTerminalStatus = (status: OrderStatus) =>
  status === "delivered" || status === "cancelled";

/** Arayüzde gösterilecek ileri adımlar (iptal ayrı düğme). */
export function getNextActions(status: OrderStatus): OrderStatus[] {
  return ALLOWED_TRANSITIONS[status].filter((s) => s !== "cancelled");
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as string[]).includes(value);
}
