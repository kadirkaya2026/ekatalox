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

// Metindeki {ad} yerine abonenin adı gelir; ad yoksa belirteç ve peşindeki
// virgül/boşluk silinir ("{ad}, sadece size" → "sadece size").
export function personalize(text: string, name: string | null | undefined) {
  if (!text.includes("{ad}")) return text;
  const clean = name?.trim();
  if (clean) return text.replaceAll("{ad}", clean);
  return text.replace(/\{ad\}[,;:!\s]*/g, "").replace(/^\s+/, "").replace(/^([a-zçğıöşü])/, (m) => m.toLocaleUpperCase("tr-TR"));
}

// Bildirim hedefi → vitrin yolu. Kampanyalar hedefinde duyuru metni de
// linke biner (?bildirim=b64url {t,b}) ki panel açılınca mesaj görünsün;
// ürün/kategori hedefinde müşteri doğrudan oraya iner, metin taşınmaz.
export type PushTarget =
  | { type: "campaigns" }
  | { type: "category"; id: string }
  | { type: "product"; id: string };

function b64url(text: string) {
  return Buffer.from(text, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function buildPushTargetPath(target: PushTarget, announcement?: { title: string; body: string } | null) {
  if (target.type === "category") return `/?kategori=${encodeURIComponent(target.id)}`;
  if (target.type === "product") return `/?urun=${encodeURIComponent(target.id)}`;
  const extra = announcement ? `&bildirim=${b64url(JSON.stringify({ t: announcement.title, b: announcement.body }))}` : "";
  return `/?kampanya=1${extra}`;
}

export async function sendTenantBroadcastPush(params: {
  tenantId: string;
  title: string;
  body: string;
  /** Tam url; verilmezse origin + target'tan kişi başına üretilir */
  url?: string;
  origin?: string;
  target?: PushTarget;
  iconUrl?: string | null;
  tag?: string;
  priceListId?: string | null;
  /** Verilirse yalnız bu abonelik satırlarına gider (panelde kişi seçimi). */
  subscriptionIds?: string[] | null;
}) {
  if (!hasWebPushEnv()) return 0;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return 0;
  let q = supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, failure_count, subscriber_name")
    .eq("tenant_id", params.tenantId)
    .eq("kind", "campaign");
  if (params.priceListId) q = q.eq("price_list_id", params.priceListId);
  if (params.subscriptionIds?.length) q = q.in("id", params.subscriptionIds.slice(0, 500));
  const { data: subs } = await q;
  if (!subs?.length) return 0;

  webpush.setVapidDetails(appEnv.vapidSubject, appEnv.vapidPublicKey, appEnv.vapidPrivateKey);
  const tag = params.tag ?? `broadcast-${Date.now()}`;
  let sent = 0;
  await Promise.allSettled(
    subs.map(async (sub) => {
      const title = personalize(params.title, sub.subscriber_name);
      const body = personalize(params.body, sub.subscriber_name);
      const url =
        params.url ?? `${params.origin ?? ""}${buildPushTargetPath(params.target ?? { type: "campaigns" }, { title, body })}`;
      const payload = JSON.stringify({ title, body, icon: params.iconUrl ?? undefined, url, tag });
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
