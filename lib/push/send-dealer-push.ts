import webpush from "web-push";
import { appEnv, hasWebPushEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/products/constants";

export interface DealerPushOrder {
  id: string;
  orderNo: number | null;
  customerName: string;
  itemCount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: "cash" | "card" | null;
}

// Bayiye (tenant admin cihazlarına) sipariş bildirimi. Best-effort: hata
// sipariş akışını etkilemez; ölü abonelikler (404/410) silinir.
export async function sendDealerOrderPush(params: {
  tenantId: string;
  kind: "new" | "customer_cancelled";
  order: DealerPushOrder;
}) {
  if (!hasWebPushEnv()) return;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  const { data: subs } = await supabase
    .from("dealer_push_subscriptions")
    .select("id, endpoint, p256dh, auth, failure_count")
    .eq("tenant_id", params.tenantId);
  if (!subs?.length) return;

  const o = params.order;
  const no = typeof o.orderNo === "number" ? `#${o.orderNo}` : "";
  const total = o.currency === "CATALOG" ? "Fiyatsız katalog" : formatCurrency(o.totalAmount, o.currency as CurrencyCode);
  const payment = o.paymentMethod === "cash" ? "Nakit" : o.paymentMethod === "card" ? "Kart" : null;
  const firstName = o.customerName.trim().split(/\s+/).slice(0, 2).join(" ");
  const bodyParts = [firstName, `${o.itemCount} ürün`, total, payment].filter(Boolean);

  // Bayi paneli app.ekatalox.com (appEnv.appDomain); /dashboard/... orada da geçerli.
  const url = `https://${appEnv.appDomain}/dashboard/siparisler?order=${o.id}`;
  const payload = JSON.stringify({
    title: params.kind === "new" ? `Yeni sipariş ${no} 🛒` : `Sipariş ${no} iptal edildi (müşteri)`,
    body: bodyParts.join(" · "),
    icon: "/ekatalox-logo-v2.png",
    url,
    tag: `dealer-order-${o.id}`,
  });

  webpush.setVapidDetails(appEnv.vapidSubject, appEnv.vapidPublicKey, appEnv.vapidPrivateKey);
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 86_400, urgency: "high" },
        );
        await supabase.from("dealer_push_subscriptions").update({ failure_count: 0, last_used_at: new Date().toISOString() }).eq("id", sub.id);
      } catch (error) {
        const status = (error as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410 || (sub.failure_count ?? 0) + 1 >= 5) {
          await supabase.from("dealer_push_subscriptions").delete().eq("id", sub.id);
        } else {
          await supabase.from("dealer_push_subscriptions").update({ failure_count: (sub.failure_count ?? 0) + 1 }).eq("id", sub.id);
        }
      }
    }),
  );
}
