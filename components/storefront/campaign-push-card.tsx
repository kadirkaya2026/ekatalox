"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2, Share } from "lucide-react";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import {
  getPushSupport,
  isSubscribedToCampaignPush,
  subscribeToCampaignPush,
  unsubscribeCampaignPush,
  type PushSupport,
} from "@/lib/push/client";
import { cn } from "@/lib/utils";

type State = "idle" | "subscribing" | "subscribed" | "denied" | "error";

// Kampanyalar panelinin en üstündeki bildirim kartı. Sipariş takip
// sayfasındaki PushOptInBanner'dan farkı: sipariş gerekmez, abonelik şifre
// kapısındaki erişim koduna bağlanır ve bayi panelden toplu duyuru gönderir.
// Android/masaüstü: tek düğme. iPhone: Web Push yalnız ana ekrana eklenmiş
// sitede çalıştığı için üç adımlı yönlendirme gösterilir.
export function CampaignPushCard({ subdomain, vapidPublicKey }: { subdomain: string; vapidPublicKey: string }) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [support, setSupport] = useState<PushSupport>("unsupported");
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    let cancelled = false;
    // Destek tespiti yalnız tarayıcıda; bir mikro görev sonra ki ilk render
    // sunucuyla aynı kalsın.
    void Promise.resolve().then(async () => {
      const s = getPushSupport();
      if (cancelled) return;
      setSupport(s);
      if (s !== "ok") return;
      if (Notification.permission === "denied") { setState("denied"); return; }
      const yes = await isSubscribedToCampaignPush({ subdomain });
      if (!cancelled && yes) setState("subscribed");
    });
    return () => { cancelled = true; };
  }, [subdomain]);

  async function subscribe() {
    setState("subscribing");
    const r = await subscribeToCampaignPush({ subdomain, vapidPublicKey }).catch(() => ({ ok: false as const, reason: "server" as const }));
    if (r.ok) { setState("subscribed"); return; }
    setState(Notification.permission === "denied" ? "denied" : r.reason === "denied" ? "idle" : "error");
  }

  async function unsubscribe() {
    setState("subscribing");
    await unsubscribeCampaignPush({ subdomain });
    setState("idle");
  }

  if (!vapidPublicKey || support === "unsupported") return null;

  const box = cn("rounded-2xl border p-4", theme.border, theme.surfaceMuted);
  const title = cn("flex items-center gap-2 text-sm font-semibold", theme.text);
  const muted = cn("mt-1 text-sm leading-5", theme.textMuted);

  if (support === "ios_needs_install") {
    return (
      <div className={box}>
        <p className={title}><Bell className="size-4" /> {t("campaignPush.title")}</p>
        <p className={muted}>{t("campaignPush.iosIntro")}</p>
        <ol className={cn("mt-2 space-y-1.5 text-sm leading-5", theme.text)}>
          <li className="flex gap-2">
            <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", theme.activeTileBg, theme.activeTileText)}>1</span>
            <span>
              {t("campaignPush.iosStep1a")} <Share className="inline size-4 align-text-bottom" /> <strong>{t("campaignPush.iosStep1b")}</strong>
            </span>
          </li>
          <li className="flex gap-2">
            <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", theme.activeTileBg, theme.activeTileText)}>2</span>
            <span><strong>{t("campaignPush.iosStep2")}</strong></span>
          </li>
          <li className="flex gap-2">
            <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", theme.activeTileBg, theme.activeTileText)}>3</span>
            <span>{t("campaignPush.iosStep3")}</span>
          </li>
        </ol>
      </div>
    );
  }

  if (state === "subscribed") {
    return (
      <div className={box}>
        <p className={title}><BellRing className="size-4 text-emerald-500" /> {t("campaignPush.onTitle")}</p>
        <p className={muted}>{t("campaignPush.onBody")}</p>
        <button type="button" onClick={() => void unsubscribe()} className={cn("mt-2 text-xs font-semibold underline underline-offset-2", theme.textMuted)}>
          {t("campaignPush.turnOff")}
        </button>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className={box}>
        <p className={title}><BellOff className="size-4" /> {t("campaignPush.deniedTitle")}</p>
        <p className={muted}>{t("campaignPush.deniedBody")}</p>
      </div>
    );
  }

  return (
    <div className={box}>
      <p className={title}><Bell className="size-4" /> {t("campaignPush.title")}</p>
      <p className={muted}>{t("campaignPush.body")}</p>
      <button
        type="button"
        disabled={state === "subscribing"}
        onClick={() => void subscribe()}
        className={cn(theme.primaryButton, "mt-3 inline-flex h-11 w-full items-center justify-center gap-2 px-5 text-sm font-semibold")}
      >
        {state === "subscribing" ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
        {state === "error" ? t("campaignPush.retry") : t("campaignPush.enable")}
      </button>
    </div>
  );
}
