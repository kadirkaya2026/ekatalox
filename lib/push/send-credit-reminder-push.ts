import webpush from "web-push";
import { appEnv, hasWebPushEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Tahsilat hatırlatması: müşterinin abone cihazlarına "veresiye borcunuz var"
// bildirimi. send-order-status-push ile aynı temizlik kuralları: ölü
// abonelikler (404/410) silinir, 5 üst üste hata temizlenir. Kaç cihaza
// ulaşıldığı döner — bayi "abonelik yok" durumunu panelde görür.
export async function sendCreditReminderPush(params: {
  tenantId: string;
  customerId: string;
  // Müşterinin açık veresiye siparişleri — takip sayfasından abone olunan
  // cihazlar customer_id yerine order_id ile kayıtlı olabilir.
  orderIds: string[];
  tenantName: string;
  totalLabel: string;
  iconUrl: string | null;
  url: string | null;
}): Promise<number> {
  if (!hasWebPushEnv()) return 0;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return 0;

  const orClauses = [
    `customer_id.eq.${params.customerId}`,
    ...(params.orderIds.length ? [`order_id.in.(${params.orderIds.join(",")})`] : []),
  ].join(",");

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, failure_count")
    .eq("tenant_id", params.tenantId)
    .or(orClauses);
  if (!subs?.length) return 0;

  webpush.setVapidDetails(appEnv.vapidSubject, appEnv.vapidPublicKey, appEnv.vapidPrivateKey);

  const payload = JSON.stringify({
    title: "Ödeme hatırlatması 💳",
    body: `${params.tenantName}: ${params.totalLabel} tutarında veresiye borcunuz bulunuyor. Uygun bir zamanınızda ödemenizi rica ederiz.`,
    icon: params.iconUrl ?? undefined,
    url: params.url ?? "/",
    tag: `credit-${params.customerId}`,
  });

  let sent = 0;
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 86_400, urgency: "normal" },
        );
        sent += 1;
        await supabase
          .from("push_subscriptions")
          .update({ failure_count: 0, last_used_at: new Date().toISOString() })
          .eq("id", sub.id);
      } catch (error) {
        const status = (error as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410 || (sub.failure_count ?? 0) + 1 >= 5) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          await supabase
            .from("push_subscriptions")
            .update({ failure_count: (sub.failure_count ?? 0) + 1 })
            .eq("id", sub.id);
        }
      }
    }),
  );

  return sent;
}
