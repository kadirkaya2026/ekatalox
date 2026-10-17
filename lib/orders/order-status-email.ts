// Üyeye sipariş durumu e-postası (0182, 17 Eki 2026). Telefonda bildirim
// (push) ulaşmadıysa ve üye Hesabım > Bildirimler'de e-posta bildirimini
// açtıysa gider. Gönderen adı mağazanın adı, yanıtlar mağazanın kayıtlı
// e-postasına (contact_email) düşer; adres alan adı doğrulaması gerektirdiği
// için gönderen adres platformun adresi kalır. Asla fırlatmaz.
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { button, escapeHtml, paragraph, renderEmailLayout, renderEmailText } from "@/lib/email/layout";
import { getStatusDescription, getStatusLabel } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/types";

const EMAIL_STATUSES: OrderStatus[] = ["confirmed", "preparing", "shipped", "delivered", "cancelled"];

export async function sendOrderStatusEmail(params: {
  supabase: SupabaseClient;
  memberId: string | null | undefined;
  tenantName: string;
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

    const label = getStatusLabel(params.status, { isTekel: params.isTekel });
    const description = getStatusDescription(params.status, { isTekel: params.isTekel });
    const greeting = member.full_name ? `Merhaba ${member.full_name},` : "Merhaba,";
    const reason = params.status === "cancelled" && params.cancelReason ? `İptal sebebi: ${params.cancelReason}` : null;

    return await sendEmail({
      to: member.email,
      fromName: params.tenantName,
      replyTo: params.replyTo?.trim() || undefined,
      subject: `Siparişiniz ${params.orderNo}: ${label}`,
      html: renderEmailLayout({
        title: `Sipariş ${params.orderNo} · ${label}`,
        preheader: description,
        hero: { eyebrow: params.tenantName, title: label, subtitle: `Sipariş ${params.orderNo}` },
        bodyHtml: [
          paragraph(escapeHtml(greeting)),
          paragraph(escapeHtml(description)),
          reason ? paragraph(escapeHtml(reason)) : "",
          params.trackingUrl ? button(params.trackingUrl, "Siparişi takip et") : "",
          paragraph(
            `Bu e-postayı ${escapeHtml(params.tenantName)} üyeliğinizde e-posta bildirimini açtığınız için aldınız. Hesabım &gt; Bildirimler'den kapatabilirsiniz.`,
          ),
        ].join(""),
      }),
      text: renderEmailText([
        greeting,
        "",
        `Sipariş ${params.orderNo}: ${label}`,
        description,
        ...(reason ? [reason] : []),
        ...(params.trackingUrl ? ["", `Takip: ${params.trackingUrl}`] : []),
      ]),
    });
  } catch (error) {
    console.error("[order-status-email] hata:", error);
    return false;
  }
}
