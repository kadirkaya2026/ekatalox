import webpush from "web-push";
import { appEnv, hasWebPushEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Müşterinin abone cihazlarına genel amaçlı bildirim (kupon duyurusu vb.).
// Sipariş durumu bildirimi ayrı (send-order-status-push.ts); ikisi de aynı
// push_subscriptions tablosunu, aynı temizlik kuralını kullanır.
export async function sendCustomerPush(params: {
  tenantId: string;
  customerId: string;
  title: string;
  body: string;
  url: string;
  iconUrl?: string | null;
  tag?: string;
}) {
  if (!hasWebPushEnv()) return 0;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return 0;
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, failure_count")
    .eq("tenant_id", params.tenantId)
    .eq("customer_id", params.customerId);
  if (!subs?.length) return 0;

  webpush.setVapidDetails(appEnv.vapidSubject, appEnv.vapidPublicKey, appEnv.vapidPrivateKey);
  const payload = JSON.stringify({
    title: params.title,
    body: params.body,
    icon: params.iconUrl ?? undefined,
    url: params.url,
    tag: params.tag ?? `customer-${params.customerId}`,
  });
  let sent = 0;
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 7 * 86_400, urgency: "normal" },
        );
        sent += 1;
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
  return sent;
}
