"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { getPushSupport, isSubscribedToPush, subscribeToOrderPush, type PushSupport } from "@/lib/push/client";

type State = "idle" | "subscribing" | "subscribed" | "denied" | "error";

export function PushOptInButton({ token, vapidPublicKey }: { token: string; vapidPublicKey: string }) {
  const [support, setSupport] = useState<PushSupport>("unsupported");
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    const s = getPushSupport();
    setSupport(s);
    if (s === "ok") {
      if (Notification.permission === "denied") setState("denied");
      else void isSubscribedToPush().then((yes) => yes && setState("subscribed"));
    }
  }, []);

  if (!vapidPublicKey) return null;

  if (support === "ios_needs_install") {
    return (
      <p className="rounded-xl border border-current/15 px-3 py-2 text-xs opacity-80">
        iPhone&apos;da bildirim almak için bu sayfayı <strong>Paylaş → Ana Ekrana Ekle</strong> ile ekleyip
        oradan açın; sonra &quot;Bildirimleri aç&quot; düğmesi görünür.
      </p>
    );
  }
  if (support === "unsupported") return null;

  if (state === "subscribed") {
    return (
      <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold opacity-80">
        <Bell className="size-4" /> Bildirimler açık — durum değişince haber vereceğiz.
      </p>
    );
  }
  if (state === "denied") {
    return (
      <p className="inline-flex items-center justify-center gap-2 text-xs opacity-60">
        <BellOff className="size-4" /> Bildirim izni kapalı; tarayıcı ayarlarından açabilirsiniz.
      </p>
    );
  }

  return (
    <button
      type="button"
      disabled={state === "subscribing"}
      onClick={async () => {
        setState("subscribing");
        const r = await subscribeToOrderPush({ token, vapidPublicKey }).catch(() => ({ ok: false as const, reason: "server" as const }));
        setState(r.ok ? "subscribed" : r.reason === "denied" ? "denied" : "error");
      }}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-current/10 px-5 text-sm font-semibold"
    >
      {state === "subscribing" ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
      {state === "error" ? "Tekrar dene" : "Durum değişince bildirim al"}
    </button>
  );
}
