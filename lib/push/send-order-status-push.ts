import webpush from "web-push";
import { phoneReachKey } from "@/lib/push/reach";
import { appEnv, hasWebPushEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStatusDescription } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/types";

// Durum değişince müşterinin abone cihazlarına bildirim. Best-effort:
// hata sipariş akışını etkilemez; ölü abonelikler (404/410) silinir,
// 5 kez üst üste başarısız olanlar temizlenir.
function getPushTitle(status: OrderStatus, isTekel: boolean, isWholesale = false) {
  switch (status) {
    case "new":
      return "Siparişiniz alındı";
    case "confirmed":
      return "Siparişiniz onaylandı ✅";
    case "preparing":
      return "Siparişiniz hazırlanıyor 🛒";
    case "shipped":
      return isTekel ? "Siparişiniz hazır 🛍️" : isWholesale ? "Siparişiniz yola çıktı 🚚" : "Siparişiniz yola çıktı 🛵";
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
  /** Siparişin şifresi: kişiye özel bayi şifresine bağlı abonelik de alır (0138). */
  accessCodeId?: string | null;
  /** Kampanya aboneliğinde yazılan telefonla eşleşme (müşteri kaydı bağlanmamış olabilir). */
  customerPhone?: string | null;
  // Görünen numara (#100042). Bildirimde uzun depolama kodu asla yer almaz.
  orderNo: string;
  status: OrderStatus;
  // Bildirim ikonu (Android/masaüstü). iOS kendi uygulama ikonunu kullanır.
  iconUrl: string | null;
  tenantName: string;
  isTekel: boolean;
  isWholesale?: boolean;
  trackingUrl: string | null;
}) {
  if (!hasWebPushEnv()) return;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  // Alıcılar panelin "Bildirim açık" işaretiyle AYNI kuralla seçilir
  // (lib/push/reach.ts): sipariş takibi, müşteri kaydı, kişiye özel şifre ya
  // da abonelikteki telefon. Eskiden yalnız ilk ikisine bakılıyordu; bayi
  // müşterisinin Kampanyalar/davet aboneliği (customer_id boş) bildirim
  // almıyordu.
  const phoneKey = phoneReachKey(params.customerPhone);
  const conditions = [`order_id.eq.${params.orderId}`];
  if (params.customerId) conditions.push(`customer_id.eq.${params.customerId}`);
  if (params.accessCodeId) conditions.push(`access_code_id.eq.${params.accessCodeId}`);
  if (phoneKey) conditions.push("subscriber_phone.not.is.null");
  const { data: rows } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, failure_count, order_id, customer_id, access_code_id, subscriber_phone")
    .eq("tenant_id", params.tenantId)
    .or(conditions.join(","));
  if (!rows?.length) return;

  // Ortak liste şifresi kimlik değildir: şifre eşleşmesi yalnız kişiye özelse.
  let personalCode = false;
  if (params.accessCodeId && rows.some((row) => row.access_code_id === params.accessCodeId)) {
    const { data: code } = await supabase
      .from("access_codes")
      .select("is_personal")
      .eq("tenant_id", params.tenantId)
      .eq("id", params.accessCodeId)
      .maybeSingle();
    personalCode = Boolean(code?.is_personal);
  }
  const subs = rows.filter(
    (row) =>
      row.order_id === params.orderId ||
      (params.customerId && row.customer_id === params.customerId) ||
      (personalCode && row.access_code_id === params.accessCodeId) ||
      (phoneKey && phoneReachKey(row.subscriber_phone) === phoneKey),
  );
  if (!subs.length) return;

  webpush.setVapidDetails(appEnv.vapidSubject, appEnv.vapidPublicKey, appEnv.vapidPrivateKey);
  // iOS bildirimi zaten "from {uygulama adı}" satırı ekliyor; başlıkta mağaza
  // adını tekrar etmiyoruz. Başlık = olay, gövde = numara + kısa açıklama.
  const payload = JSON.stringify({
    title: getPushTitle(params.status, params.isTekel, params.isWholesale),
    body: `Sipariş ${params.orderNo} · ${getStatusDescription(params.status, { isTekel: params.isTekel, isWholesale: params.isWholesale })}`,
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
