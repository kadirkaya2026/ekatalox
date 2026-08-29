import webpush from "web-push";
import { appEnv, hasWebPushEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStatusDescription } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/types";

// Durum değişince müşterinin abone cihazlarına bildirim. Best-effort:
// hata sipariş akışını etkilemez; ölü abonelikler (404/410) silinir,
// 5 kez üst üste başarısız olanlar temizlenir.
function getPushTitle(status: OrderStatus, isTekel: boolean) {
  switch (status) {
    case "new":
      return "Siparişiniz alındı";
    case "confirmed":
      return "Siparişiniz onaylandı ✅";
    case "preparing":
      return "Siparişiniz hazırlanıyor 🛒";
    case "shipped":
      return isTekel ? "Siparişiniz hazır 🛍️" : "Siparişiniz yola çıktı 🛵";
    case "delivered":
      return "Siparişiniz teslim edildi ✅";
    case "cancelled":
      return "Siparişiniz iptal edildi";
  }
}

export async function sendOrderStatusPush(params: {
  tenantId: string;
  orderId: string;
  customerId: string | null;
  // Görünen numara (#100042). Bildirimde uzun depolama kodu asla yer almaz.
  orderNo: string;
  status: OrderStatus;
  // Bildirim ikonu (Android/masaüstü). iOS kendi uygulama ikonunu kullanır.
  iconUrl: string | null;
  tenantName: string;
  isTekel: boolean;
  trackingUrl: string | null;
}) {
  if (!hasWebPushEnv()) return;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  const filter = params.customerId
    ? `order_id.eq.${params.orderId},customer_id.eq.${params.customerId}`
    : `order_id.eq.${params.orderId}`;
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, failure_count")
    .eq("tenant_id", params.tenantId)
    .or(filter);
  if (!subs?.length) return;

  webpush.setVapidDetails(appEnv.vapidSubject, appEnv.vapidPublicKey, appEnv.vapidPrivateKey);
  // iOS bildirimi zaten "from {uygulama adı}" satırı ekliyor; başlıkta mağaza
  // adını tekrar etmiyoruz. Başlık = olay, gövde = numara + kısa açıklama.
  const payload = JSON.stringify({
    title: getPushTitle(params.status, params.isTekel),
    body: `Sipariş ${params.orderNo} · ${getStatusDescription(params.status, { isTekel: params.isTekel })}`,
    icon: params.iconUrl ?? undefined,
    url: params.trackingUrl ?? "/",
    tag: `order-${params.orderId}`,
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 86_400, urgency: "normal" },
        );
        await supabase.from("push_subscriptions").update({ failure_count: 0, last_used_at: new Date().toISOString() }).eq("id", sub.id);
      } catch (error) {
        const status = (error as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410 || (sub.failure_count ?? 0) + 1 >= 5) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          await supabase.from("push_subscriptions").update({ failure_count: (sub.failure_count ?? 0) + 1 }).eq("id", sub.id);
        }
      }
    }),
  );
}
