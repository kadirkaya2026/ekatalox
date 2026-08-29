"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Share, Volume2 } from "lucide-react";
import { playOrderRing } from "@/lib/dashboard/order-ring";
import { Button } from "@/components/ui/button";
import { getPushSupport, isSubscribedToPush, subscribeToDealerPush, unsubscribeDealerPush, type PushSupport } from "@/lib/push/client";

// Siparişler sayfasının üstünde: bayi bir kez izin verir, her yeni siparişte
// (ve müşteri iptalinde) telefon/bilgisayarına bildirim gelir; bildirime
// dokununca sipariş onay ekranı açılır.
export function DealerPushOptIn({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [support, setSupport] = useState<PushSupport>("unsupported");
  const [state, setState] = useState<"idle" | "busy" | "on" | "denied" | "error">("idle");

  useEffect(() => {
    const s = getPushSupport();
    setSupport(s);
    if (s !== "ok") return;
    if (Notification.permission === "denied") setState("denied");
    else void isSubscribedToPush().then((on) => setState(on ? "on" : "idle"));
  }, []);

  if (!vapidPublicKey) return null;

  if (support === "ios_needs_install") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <Bell className="mt-0.5 size-4 shrink-0" />
        <p>
          iPhone&apos;da yeni sipariş bildirimi için paneli ana ekrana ekleyin: Safari&apos;de{" "}
          <Share className="inline size-4 align-text-bottom" /> <strong>Paylaş → Ana Ekrana Ekle</strong>, sonra oradan açıp bu düğmeye basın. Tek seferlik.
        </p>
      </div>
    );
  }
  if (support === "unsupported") return null;

  const enable = async () => {
    setState("busy");
    const r = await subscribeToDealerPush({ vapidPublicKey }).catch(() => ({ ok: false as const, reason: "server" as const }));
    setState(r.ok ? "on" : r.reason === "denied" ? "denied" : "error");
  };
  const disable = async () => {
    setState("busy");
    await unsubscribeDealerPush();
    setState("idle");
  };

  if (state === "on") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-1.5 text-xs text-emerald-900">
        <span className="flex items-center gap-2"><BellRing className="size-3.5" /> Yeni sipariş bildirimleri bu cihazda açık.</span>
        <span className="flex items-center gap-1">
          <Button variant="ghost" onClick={playOrderRing} className="text-emerald-900" title="Panel açıkken çalan sipariş zili">
            <Volume2 className="size-4" /> Sesi dene
          </Button>
          <Button variant="ghost" onClick={() => void disable()} className="text-emerald-900">
            <BellOff className="size-4" /> Kapat
          </Button>
        </span>
      </div>
    );
  }
  if (state === "denied") {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        Bildirim izni bu tarayıcıda reddedilmiş. Adres çubuğundaki kilit simgesinden bildirimlere izin verip sayfayı yenileyin.
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
      <span className="flex items-center gap-2">
        <Bell className="size-4 text-slate-500" />
        Sipariş gelince telefonunuza / bilgisayarınıza bildirim gelsin; dokununca onay ekranı açılır.
      </span>
      <span className="flex items-center gap-1">
        <Button variant="ghost" onClick={playOrderRing} title="Panel açıkken çalan sipariş zili">
          <Volume2 className="size-4" /> Sesi dene
        </Button>
        <Button onClick={() => void enable()} disabled={state === "busy"}>
          {state === "busy" ? "Açılıyor…" : "Bildirimleri aç"}
        </Button>
      </span>
      {state === "error" ? <span className="w-full text-xs text-rose-600">Abonelik kaydedilemedi, tekrar deneyin.</span> : null}
    </div>
  );
}
