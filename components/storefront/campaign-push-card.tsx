"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2, Share } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { readTrackingPhone } from "@/lib/storefront/tracking-phone";
import {
  getCampaignPushStatus,
  getPushSupport,
  subscribeToCampaignPush,
  unsubscribeCampaignPush,
  type PushSupport,
} from "@/lib/push/client";
import { cn } from "@/lib/utils";

type State = "idle" | "subscribing" | "subscribed" | "denied" | "error";

// Kampanyalar panelinin en üstündeki bildirim kartı: ad soyad + telefon
// alıp bildirimi açar. Üye olma/şifre yok — bayi herkese aynı şifreyi
// verdiğinde de kim olduğu bilinsin, panelden kişiye özel bildirim
// gidebilsin diye. Sipariş takip sayfasındaki PushOptInBanner'dan farkı:
// sipariş gerekmez, abonelik şifre kapısındaki erişim koduna + bu bilgilere
// bağlanır. iPhone: Web Push yalnız ana ekrana eklenmiş sitede çalıştığı
// için üç adımlı yönlendirme.
export function CampaignPushCard({ subdomain, vapidPublicKey }: { subdomain: string; vapidPublicKey: string }) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [support, setSupport] = useState<PushSupport>("unsupported");
  const [state, setState] = useState<State>("idle");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Destek tespiti yalnız tarayıcıda; bir mikro görev sonra ki ilk render
    // sunucuyla aynı kalsın.
    void Promise.resolve().then(async () => {
      const s = getPushSupport();
      if (cancelled) return;
      setSupport(s);
      // Sepette girilen numara cihazda hatırlanıyor; formu onunla doldur.
      const savedPhone = readTrackingPhone();
      if (savedPhone) setPhone((current) => current || savedPhone);
      if (s !== "ok") return;
      if (Notification.permission === "denied") { setState("denied"); return; }
      const status = await getCampaignPushStatus({ subdomain });
      if (cancelled || !status.subscribed) return;
      setState("subscribed");
      if (status.name) setName(status.name);
      if (status.phone) setPhone(status.phone);
    });
    return () => { cancelled = true; };
  }, [subdomain]);

  function validate() {
    if (name.trim().length < 2) return t("campaignPush.nameError");
    if (phone.replace(/\D/g, "").length < 10) return t("campaignPush.phoneError");
    return null;
  }

  async function subscribe() {
    const problem = validate();
    if (problem) { setFormError(problem); return; }
    setFormError(null);
    setState("subscribing");
    const r = await subscribeToCampaignPush({ subdomain, vapidPublicKey, name: name.trim(), phone: phone.trim() }).catch(
      () => ({ ok: false as const, reason: "server" as const }),
    );
    if (r.ok) { setState("subscribed"); setEditing(false); return; }
    setState(Notification.permission === "denied" ? "denied" : r.reason === "denied" ? "idle" : "error");
  }

  async function unsubscribe() {
    setState("subscribing");
    await unsubscribeCampaignPush({ subdomain });
    setState("idle");
    setEditing(false);
  }

  if (!vapidPublicKey || support === "unsupported") return null;

  const box = cn("rounded-2xl border p-4", theme.border, theme.surfaceMuted);
  const title = cn("flex items-center gap-2 text-sm font-semibold", theme.text);
  const muted = cn("mt-1 text-sm leading-5", theme.textMuted);
  const stepBadge = cn("flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", theme.activeTileBg, theme.activeTileText);

  if (support === "ios_needs_install") {
    return (
      <div className={box}>
        <p className={title}><Bell className="size-4" /> {t("campaignPush.title")}</p>
        <p className={muted}>{t("campaignPush.iosIntro")}</p>
        <ol className={cn("mt-2 space-y-1.5 text-sm leading-5", theme.text)}>
          <li className="flex gap-2">
            <span className={stepBadge}>1</span>
            <span>
              {t("campaignPush.iosStep1a")} <Share className="inline size-4 align-text-bottom" /> <strong>{t("campaignPush.iosStep1b")}</strong>
            </span>
          </li>
          <li className="flex gap-2"><span className={stepBadge}>2</span><span><strong>{t("campaignPush.iosStep2")}</strong></span></li>
          <li className="flex gap-2"><span className={stepBadge}>3</span><span>{t("campaignPush.iosStep3")}</span></li>
        </ol>
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

  if (state === "subscribed" && !editing) {
    return (
      <div className={box}>
        <p className={title}><BellRing className="size-4 text-emerald-500" /> {t("campaignPush.onTitle")}</p>
        {name || phone ? (
          <p className={cn("mt-1 text-sm font-medium", theme.text)}>{[name, phone].filter(Boolean).join(" · ")}</p>
        ) : null}
        <p className={muted}>{t("campaignPush.onBody")}</p>
        <div className="mt-2 flex items-center gap-4">
          <button type="button" onClick={() => setEditing(true)} className={cn("text-xs font-semibold underline underline-offset-2", theme.textMuted)}>
            {t("campaignPush.editInfo")}
          </button>
          <button type="button" onClick={() => void unsubscribe()} className={cn("text-xs font-semibold underline underline-offset-2", theme.textMuted)}>
            {t("campaignPush.turnOff")}
          </button>
        </div>
      </div>
    );
  }

  const busy = state === "subscribing";
  return (
    <div className={box}>
      <p className={title}><Bell className="size-4" /> {t("campaignPush.title")}</p>
      <p className={muted}>{t("campaignPush.body")}</p>
      <div className="mt-3 space-y-2">
        <Input
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => { setName(event.target.value); setFormError(null); }}
          placeholder={t("campaignPush.namePlaceholder")}
          className={cn("rounded-[1.1rem] text-[16px]", theme.formField, theme.text)}
        />
        <Input
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => { setPhone(event.target.value); setFormError(null); }}
          placeholder={t("campaignPush.phonePlaceholder")}
          className={cn("rounded-[1.1rem] text-[16px]", theme.formField, theme.text)}
        />
      </div>
      {formError ? <p className={cn("mt-2 text-xs font-medium", theme.dangerText)}>{formError}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void subscribe()}
        className={cn(theme.primaryButton, "mt-3 inline-flex h-11 w-full items-center justify-center gap-2 px-5 text-sm font-semibold")}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
        {state === "error" ? t("campaignPush.retry") : editing ? t("campaignPush.save") : t("campaignPush.enable")}
      </button>
      {editing ? (
        <button type="button" onClick={() => setEditing(false)} className={cn("mt-2 w-full text-center text-xs font-semibold underline underline-offset-2", theme.textMuted)}>
          {t("campaignPush.cancel")}
        </button>
      ) : null}
      <p className={cn("mt-2 text-[11px] leading-4", theme.textTertiary)}>{t("campaignPush.privacy")}</p>
    </div>
  );
}
