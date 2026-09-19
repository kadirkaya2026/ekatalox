// Tarayıcı tarafı Web Push aboneliği (takip sayfası).

export type PushSupport = "ok" | "unsupported" | "ios_needs_install";

export function getPushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
    || window.matchMedia?.("(display-mode: standalone)").matches;
  // iOS Safari: Web Push yalnız ana ekrana eklenmiş (standalone) sitede (16.4+).
  if (isIos && !standalone) return "ios_needs_install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  return "ok";
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function subscribeToOrderPush(params: { token: string; vapidPublicKey: string }) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false as const, reason: "denied" as const };

  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(params.vapidPublicKey),
    }));

  const response = await fetch("/api/storefront/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: params.token, subscription: subscription.toJSON(), user_agent: navigator.userAgent }),
  });
  if (!response.ok) return { ok: false as const, reason: "server" as const };
  return { ok: true as const };
}

export async function isSubscribedToPush() {
  if (getPushSupport() !== "ok") return false;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const sub = await registration?.pushManager.getSubscription();
  return Boolean(sub) && Notification.permission === "granted";
}

// Bayi paneli: yeni sipariş bildirimi aboneliği (oturumdaki tenant'a bağlanır).
export async function subscribeToDealerPush(params: { vapidPublicKey: string }) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false as const, reason: "denied" as const };

  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(params.vapidPublicKey),
    }));

  const response = await fetch("/api/tenant/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: subscription.toJSON(), user_agent: navigator.userAgent }),
  });
  if (!response.ok) return { ok: false as const, reason: "server" as const };
  return { ok: true as const };
}

export async function unsubscribeDealerPush() {
  const registration = await navigator.serviceWorker.getRegistration("/");
  const sub = await registration?.pushManager.getSubscription();
  if (!sub) return;
  await fetch("/api/tenant/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => undefined);
  await sub.unsubscribe().catch(() => undefined);
}

// Vitrin Kampanyalar paneli: kampanya/duyuru bildirimi aboneliği. Sipariş
// gerekmez; sunucu tarafında şifre kapısı çerezindeki erişim kodu ve fiyat
// listesine bağlanır (app/api/storefront/push/campaigns/route.ts).
export async function subscribeToCampaignPush(params: {
  subdomain: string;
  vapidPublicKey: string;
  name?: string;
  phone?: string;
  /** /bildirim tek-link daveti (çerezsiz ana ekran uygulamasında bağlamı taşır). */
  inviteToken?: string;
}) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false as const, reason: "denied" as const };

  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(params.vapidPublicKey),
    }));

  const response = await fetch("/api/storefront/push/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subdomain: params.subdomain,
      subscription: subscription.toJSON(),
      user_agent: navigator.userAgent,
      name: params.name ?? null,
      phone: params.phone ?? null,
      inviteToken: params.inviteToken ?? null,
    }),
  });
  if (!response.ok) return { ok: false as const, reason: "server" as const };
  return { ok: true as const };
}

// Aynı cihaz sipariş takibi için de abone olmuş olabilir; o yüzden tarayıcı
// aboneliği iptal edilmez, yalnız duyuru işareti (kind) sunucuda kaldırılır.
export async function unsubscribeCampaignPush(params: { subdomain: string }) {
  const registration = await navigator.serviceWorker.getRegistration("/");
  const sub = await registration?.pushManager.getSubscription();
  if (!sub) return;
  await fetch("/api/storefront/push/campaigns", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subdomain: params.subdomain, endpoint: sub.endpoint }),
  }).catch(() => undefined);
}

// Bu cihaz duyuru bildirimine kayıtlı mı? Tarayıcı aboneliği tek başına
// yetmez (sipariş takibinden gelmiş olabilir); sunucuya sorulur.
export async function getCampaignPushStatus(params: { subdomain: string }) {
  const none = { subscribed: false, name: null as string | null, phone: null as string | null };
  if (getPushSupport() !== "ok" || Notification.permission !== "granted") return none;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const sub = await registration?.pushManager.getSubscription();
  if (!sub) return none;
  const r = await fetch(
    `/api/storefront/push/campaigns?subdomain=${encodeURIComponent(params.subdomain)}&endpoint=${encodeURIComponent(sub.endpoint)}`,
  ).catch(() => null);
  if (!r?.ok) return none;
  const data = (await r.json().catch(() => null)) as { subscribed?: boolean; name?: string | null; phone?: string | null } | null;
  return { subscribed: Boolean(data?.subscribed), name: data?.name ?? null, phone: data?.phone ?? null };
}
