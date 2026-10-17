// Üyeye sipariş durumu e-postası (0182, 17 Eki 2026). Telefonda bildirim
// (push) ulaşmadıysa ve üye Hesabım > Bildirimler'de e-posta bildirimini
// açtıysa gider. Tasarım tüm mağazalarda ortak (lib/email/store-layout.ts),
// yalnız mağazanın logosu ve adı değişir; gönderen adı mağazanın adı,
// yanıtlar mağazanın e-postasına düşer. Asla fırlatmaz.
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { buildStoreOrderStatusEmail, type StoreBrand } from "@/lib/email/store-layout";
import { getStatusDescription, getStatusLabel } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/types";

const EMAIL_STATUSES: OrderStatus[] = ["confirmed", "preparing", "shipped", "delivered", "cancelled"];

export function orderStatusEmailTitle(status: OrderStatus, isTekel: boolean) {
  switch (status) {
    case "new":
      return "Siparişiniz alındı";
    case "confirmed":
      return "Siparişiniz onaylandı";
    case "preparing":
      return "Siparişiniz hazırlanıyor";
    case "shipped":
      return isTekel ? "Siparişiniz hazır" : "Siparişiniz yola çıktı";
    case "delivered":
      return "Siparişiniz teslim edildi";
    case "cancelled":
      return "Siparişiniz iptal edildi";
  }
}

export async function sendOrderStatusEmail(params: {
  supabase: SupabaseClient;
  memberId: string | null | undefined;
  brand: StoreBrand;
  replyTo: string | null | undefined;
  orderNo: string;
  status: OrderStatus;
  isTekel: boolean;
  trackingUrl: string | null;
  cancelReason?: string | null;
}) {
  if (!params.memberId || !EMAIL_STATUSES.includes(params.status)) return false;
  try {
    const { data: member } = await params.supabase
      .from("store_members")
      .select("full_name, email, email_notifications")
      .eq("id", params.memberId)
      .maybeSingle();
    if (!member?.email || !member.email_notifications) return false;

    const email = buildStoreOrderStatusEmail({
      brand: params.brand,
      customerName: member.full_name || null,
      orderNo: params.orderNo,
      status: params.status,
      statusLabel: getStatusLabel(params.status, { isTekel: params.isTekel }),
      statusTitle: orderStatusEmailTitle(params.status, params.isTekel),
      description: getStatusDescription(params.status, { isTekel: params.isTekel }),
      isTekel: params.isTekel,
      trackingUrl: params.trackingUrl,
      cancelReason: params.cancelReason,
    });
    return await sendEmail({
      to: member.email,
      fromName: params.brand.name,
      store: true,
      replyTo: params.replyTo?.trim() || undefined,
      ...email,
    });
  } catch (error) {
    console.error("[order-status-email] hata:", error);
    return false;
  }
}
