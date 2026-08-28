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
