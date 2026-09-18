import webpush from "web-push";
import { appEnv, hasWebPushEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Bayinin duyuru bildirimi: Kampanyalar panelinden abone olan (kind =
// 'campaign') tüm cihazlara, istenirse yalnız bir fiyat listesinin
// müşterilerine. Sipariş durumu ve kişiye özel kupon bildirimleri ayrı
// dosyalarda; temizlik kuralı (404/410 ya da 5 hata → sil) aynı.
export async function countTenantBroadcastSubscribers(tenantId: string, priceListId?: string | null) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return 0;
  let q = supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("kind", "campaign");
  if (priceListId) q = q.eq("price_list_id", priceListId);
  const { count } = await q;
  return count ?? 0;
}

export async function sendTenantBroadcastPush(params: {
  tenantId: string;
  title: string;
  body: string;
  url: string;
  iconUrl?: string | null;
  tag?: string;
  priceListId?: string | null;
}) {
  if (!hasWebPushEnv()) return 0;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return 0;
  let q = supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, failure_count")
    .eq("tenant_id", params.tenantId)
    .eq("kind", "campaign");
  if (params.priceListId) q = q.eq("price_list_id", params.priceListId);
  const { data: subs } = await q;
  if (!subs?.length) return 0;

  webpush.setVapidDetails(appEnv.vapidSubject, appEnv.vapidPublicKey, appEnv.vapidPrivateKey);
  const payload = JSON.stringify({
    title: params.title,
    body: params.body,
    icon: params.iconUrl ?? undefined,
    url: params.url,
    tag: params.tag ?? `broadcast-${Date.now()}`,
  });
  let sent = 0;
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 3 * 86_400, urgency: "normal" },
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

// Bildirimdeki bağlantı bayinin kendi adresine gitsin (özel alan adı varsa o).
export function getTenantStorefrontOrigin(tenant: { subdomain: string; custom_domain?: string | null }) {
  return tenant.custom_domain?.trim()
    ? `https://${tenant.custom_domain.trim()}`
    : `https://${tenant.subdomain}.${appEnv.rootDomain}`;
}
