"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, Loader2, Share } from "lucide-react";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { getPushSupport, isSubscribedToPush, subscribeToOrderPush, type PushSupport } from "@/lib/push/client";

type State = "idle" | "subscribing" | "subscribed" | "denied" | "error";

// Takip sayfasının üstünde belirgin bildirim şeridi.
// Android/masaüstü: sayfa açılır açılmaz izin istenir (Chrome kullanıcı
// hareketi şart koşmaz); reddedilmediyse düğme de durur. iOS Safari: Web
// Push yalnız "Ana Ekrana Ekle" ile — bunu net anlatır.
export function PushOptInBanner({ token, vapidPublicKey }: { token: string; vapidPublicKey: string }) {
  const theme = useStorefrontTheme();
  const [support, setSupport] = useState<PushSupport>("unsupported");
  const [state, setState] = useState<State>("idle");
  const autoAsked = useRef(false);

  async function subscribe() {
    setState("subscribing");
    const r = await subscribeToOrderPush({ token, vapidPublicKey }).catch(() => ({ ok: false as const, reason: "server" as const }));
    if (r.ok) { setState("subscribed"); return; }
    // "denied" yalnız tarayıcı gerçekten reddettiyse: iOS dokunmasız
    // istekte izin "default" kalır, düğme görünmeye devam etmeli.
    setState(Notification.permission === "denied" ? "denied" : r.reason === "denied" ? "idle" : "error");
  }

  useEffect(() => {
    const s = getPushSupport();
    setSupport(s);
    if (s !== "ok") return;
    if (Notification.permission === "denied") { setState("denied"); return; }
    void isSubscribedToPush().then((yes) => {
      if (yes) { setState("subscribed"); return; }
      // İlk açılışta otomatik izin iste (Safari masaüstü hareket ister; o zaman
      // sadece düğme kalır, otomatik deneme sessizce sonuçsuz kalır).
      // iOS/Safari izin için dokunma ister; orada sadece düğme. Android/Chrome
      // ve masaüstü Chrome'da sayfa açılınca izin penceresi kendiliğinden gelir.
      const isApple = /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|Android/i.test(navigator.userAgent);
      if (!isApple && !autoAsked.current && Notification.permission === "default") {
        autoAsked.current = true;
        void subscribe();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!vapidPublicKey) return null;
  const box = `mt-4 rounded-xl border p-4 ${theme.border} ${theme.surfaceMuted}`;

  if (support === "ios_needs_install") {
    return (
      <div className={box}>
        <p className={`flex items-center gap-2 text-sm font-semibold ${theme.text}`}>
          <Bell className="size-4" /> Sipariş bildirimi almak ister misiniz?
        </p>
        <p className={`mt-1 text-sm ${theme.textMuted}`}>
          iPhone&apos;da bildirim için bu sayfayı ana ekrana ekleyin: alttaki{" "}
          <Share className="inline size-4 align-text-bottom" /> <strong>Paylaş</strong> → <strong>Ana Ekrana Ekle</strong>, sonra oradan açın.
          Ayrıca mağaza her adımda WhatsApp&apos;tan da bilgilendirir.
        </p>
      </div>
    );
  }
  if (support === "unsupported") return null;

  if (state === "subscribed") {
    return (
      <div className={box}>
        <p className={`flex items-center gap-2 text-sm font-semibold ${theme.text}`}>
          <Bell className="size-4 text-emerald-500" /> Bildirimler açık
        </p>
        <p className={`mt-1 text-sm ${theme.textMuted}`}>Siparişiniz her adımda size bildirim olarak gelecek.</p>
      </div>
    );
  }
  if (state === "denied") {
    return (
      <div className={box}>
        <p className={`flex items-center gap-2 text-sm font-semibold ${theme.text}`}>
          <BellOff className="size-4" /> Bildirim izni kapalı
        </p>
        <p className={`mt-1 text-sm ${theme.textMuted}`}>Tarayıcı ayarlarından bu site için bildirimi açabilirsiniz; bu sayfa yine kendini günceller.</p>
      </div>
    );
  }

  return (
    <div className={box}>
      <p className={`flex items-center gap-2 text-sm font-semibold ${theme.text}`}>
        <Bell className="size-4" /> Siparişiniz hazır olduğunda haber verelim
      </p>
      <button
        type="button"
        disabled={state === "subscribing"}
        onClick={() => void subscribe()}
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white"
      >
        {state === "subscribing" ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
        {state === "error" ? "Tekrar dene" : "Bildirimleri aç"}
      </button>
    </div>
  );
}
