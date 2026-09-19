"use client";

import { useEffect, useState } from "react";
import { ArrowDown, Bell, BellOff, BellRing, Check, Copy, Loader2, Share, SquarePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StorefrontSubpageShell } from "@/components/storefront/storefront-subpage-shell";
import { StorefrontThemeProvider, useStorefrontTheme, type StorefrontAppearanceSettings } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { readPushIdentity, savePushIdentity, saveTrackingPhone } from "@/lib/storefront/tracking-phone";
import { getCampaignPushStatus, getPushSupport, subscribeToCampaignPush, type PushSupport } from "@/lib/push/client";
import { cn } from "@/lib/utils";

// /bildirim "tek link" sayfası. Müşterinin yapacağı tek şey ad + telefon yazıp
// düğmeye basmak; iPhone'da araya Apple'ın zorunlu kıldığı "Ana Ekrana Ekle"
// adımı girer, o adım büyük ok ve resimli adımlarla anlatılır. Ana ekrandan
// (standalone) açılınca form tekrar sorulmaz: davet token'ından ad/telefon
// gelir, tek büyük düğme kalır.
type Invite = { name: string; phone: string; subscribed: boolean } | null;
type Step = "loading" | "form" | "install" | "one_tap" | "done" | "denied" | "unsupported";

function isIosSafari() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
}
function isIpad() {
  return /iPad/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function PushInviteCard({
  subdomain,
  tenantName,
  vapidPublicKey,
  token,
  invite,
}: {
  subdomain: string;
  tenantName: string;
  vapidPublicKey: string;
  token: string | null;
  invite: Invite;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [step, setStep] = useState<Step>("loading");
  const [support, setSupport] = useState<PushSupport>("unsupported");
  const [name, setName] = useState(invite?.name ?? "");
  const [phone, setPhone] = useState(invite?.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safari, setSafari] = useState(true);
  const [ipad, setIpad] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      const s = getPushSupport();
      if (cancelled) return;
      setSupport(s);
      setSafari(isIosSafari());
      setIpad(isIpad());
      if (!vapidPublicKey) { setStep("unsupported"); return; }
      const saved = readPushIdentity();
      if (!invite && saved) { setName((c) => c || saved.name); setPhone((c) => c || saved.phone); }
      if (s === "unsupported") {
        // iPhone'da Safari dışı tarayıcı (Chrome vb.) da buraya düşer: Safari'ye
        // yönlendirilir; gerçekten desteklemeyen cihazlarda mesaj gösterilir.
        setStep(/iPhone|iPad|iPod/i.test(navigator.userAgent) ? "install" : "unsupported");
        return;
      }
      if (s === "ios_needs_install") { setStep(token ? "install" : "form"); return; }
      if (Notification.permission === "denied") { setStep("denied"); return; }
      const status = await getCampaignPushStatus({ subdomain });
      if (cancelled) return;
      if (status.subscribed) { if (status.name) setName(status.name); if (status.phone) setPhone(status.phone); setStep("done"); return; }
      setStep(token && invite ? "one_tap" : "form");
    });
    return () => { cancelled = true; };
  }, [subdomain, token, invite, vapidPublicKey]);

  function validate() {
    if (name.trim().length < 2) return t("campaignPush.nameError");
    if (phone.replace(/\D/g, "").length < 10) return t("campaignPush.phoneError");
    return null;
  }

  async function subscribe() {
    const problem = validate();
    if (problem) { setError(problem); return; }
    setError(null); setBusy(true);
    const r = await subscribeToCampaignPush({
      subdomain, vapidPublicKey, name: name.trim(), phone: phone.trim(), inviteToken: token ?? undefined,
    }).catch(() => ({ ok: false as const, reason: "server" as const }));
    setBusy(false);
    if (r.ok) {
      savePushIdentity({ name: name.trim(), phone: phone.trim() });
      saveTrackingPhone(phone.trim());
      setStep("done");
      return;
    }
    if (Notification.permission === "denied" || r.reason === "denied") { setStep("denied"); return; }
    setError(t("campaignPush.retry"));
  }

  // iPhone Safari: ad/telefon sunucuya kaydedilir, sayfa token'lı adrese
  // geçer (manifest start_url o adresi taşır), sonra "Ana Ekrana Ekle" rehberi.
  async function createInvite() {
    const problem = validate();
    if (problem) { setError(problem); return; }
    setError(null); setBusy(true);
    const r = await fetch("/api/storefront/push/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subdomain, name: name.trim(), phone: phone.trim() }),
    }).catch(() => null);
    const data = (await r?.json().catch(() => null)) as { token?: string; error?: string } | null;
    setBusy(false);
    if (!r?.ok || !data?.token) { setError(data?.error ?? t("campaignPush.retry")); return; }
    savePushIdentity({ name: name.trim(), phone: phone.trim() });
    window.location.replace(`/bildirim?t=${encodeURIComponent(data.token)}`);
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* yok say */ }
  }

  const card = cn("rounded-3xl border p-5 sm:p-6", theme.border, theme.surface);
  const h = cn("text-xl font-bold leading-tight", theme.text);
  const p = cn("mt-2 text-sm leading-6", theme.textMuted);
  const primary = cn(theme.primaryButton, "mt-4 inline-flex h-14 w-full items-center justify-center gap-2 px-5 text-base font-bold");
  const badge = cn("flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold", theme.activeTileBg, theme.activeTileText);
  const identity = [name, phone].filter(Boolean).join(" · ");

  if (step === "loading") {
    return <div className={cn(card, "flex items-center justify-center py-16")}><Loader2 className={cn("size-6 animate-spin", theme.textMuted)} /></div>;
  }

  if (step === "unsupported") {
    return (
      <div className={card}>
        <p className={h}><BellOff className="mr-2 inline size-5 align-text-bottom" />{t("pushInvite.title")}</p>
        <p className={p}>{t("pushInvite.unsupported")}</p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- vitrin yolu proxy ile yeniden yazılır, tam yükleme istenir */}
        <a href="/" className={primary}>{t("pushInvite.goToStore")}</a>
      </div>
    );
  }

  if (step === "denied") {
    return (
      <div className={card}>
        <p className={h}><BellOff className="mr-2 inline size-5 align-text-bottom" />{t("campaignPush.deniedTitle")}</p>
        <p className={p}>{t("campaignPush.deniedBody")}</p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- vitrin yolu proxy ile yeniden yazılır, tam yükleme istenir */}
        <a href="/" className={primary}>{t("pushInvite.goToStore")}</a>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className={card}>
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500"><BellRing className="size-6" /></span>
          <div>
            <p className={h}>{t("pushInvite.doneTitle")}</p>
            {identity ? <p className={cn("mt-0.5 text-sm font-medium", theme.text)}>{identity}</p> : null}
          </div>
        </div>
        <p className={p}>{t("pushInvite.doneBody")}</p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- vitrin yolu proxy ile yeniden yazılır, tam yükleme istenir */}
        <a href="/" className={primary}>{t("pushInvite.goToStore")}</a>
      </div>
    );
  }

  if (step === "install") {
    const steps = [
      { icon: <Share className="size-5" />, text: t("pushInvite.installStep1") },
      { icon: <SquarePlus className="size-5" />, text: t("pushInvite.installStep2") },
      { icon: <Check className="size-5" />, text: t("pushInvite.installStep3") },
      { icon: <Bell className="size-5" />, text: t("pushInvite.installStep4").replace("{store}", tenantName) },
    ];
    return (
      <>
        <div className={card}>
          {identity ? <p className={cn("text-sm font-medium", theme.textMuted)}>{identity}</p> : null}
          <p className={cn(h, "mt-1")}>{t("pushInvite.installTitle")}</p>
          <p className={p}>{t("pushInvite.installIntro")}</p>
          {!safari ? (
            <div className={cn("mt-4 rounded-2xl border p-4", theme.border, theme.surfaceMuted)}>
              <p className={cn("text-sm font-semibold", theme.text)}>{t("pushInvite.openInSafari")}</p>
              <button type="button" onClick={() => void copyLink()} className={cn(theme.primaryButton, "mt-3 inline-flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold")}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? t("pushInvite.copied") : t("pushInvite.copyLink")}
              </button>
            </div>
          ) : null}
          <ol className="mt-5 space-y-3">
            {steps.map((s, i) => (
              <li key={i} className={cn("flex items-center gap-3 rounded-2xl border p-3", theme.border, theme.surfaceMuted)}>
                <span className={badge}>{i + 1}</span>
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", theme.activeTileBg, theme.activeTileText)}>{s.icon}</span>
                <span className={cn("text-sm font-semibold leading-5", theme.text)}>{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
        {safari && !ipad ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+58px)] z-30 flex flex-col items-center">
            <span className={cn("rounded-full px-3 py-1 text-xs font-bold shadow-lg", theme.activeTileBg, theme.activeTileText)}>{t("pushInvite.arrowHint")}</span>
            <ArrowDown className={cn("mt-1 size-9 animate-bounce drop-shadow", theme.text)} />
          </div>
        ) : null}
      </>
    );
  }

  if (step === "one_tap") {
    return (
      <div className={card}>
        <p className={cn("text-sm font-medium", theme.textMuted)}>{identity}</p>
        <p className={cn(h, "mt-1")}>{t("pushInvite.oneTapTitle")}</p>
        <p className={p}>{t("pushInvite.oneTapBody")}</p>
        {error ? <p className={cn("mt-2 text-sm font-medium", theme.dangerText)}>{error}</p> : null}
        <button type="button" disabled={busy} onClick={() => void subscribe()} className={primary}>
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Bell className="size-5" />}
          {t("campaignPush.enable")}
        </button>
        <button type="button" onClick={() => setStep("form")} className={cn("mt-3 w-full text-center text-xs font-semibold underline underline-offset-2", theme.textMuted)}>
          {t("campaignPush.editInfo")}
        </button>
      </div>
    );
  }

  // form
  const iosFlow = support === "ios_needs_install";
  return (
    <div className={card}>
      <p className={h}><Bell className="mr-2 inline size-5 align-text-bottom" />{t("pushInvite.title")}</p>
      <p className={p}>{t("pushInvite.intro")}</p>
      <div className="mt-4 space-y-2">
        <Input type="text" autoComplete="organization" value={name} onChange={(e) => { setName(e.target.value); setError(null); }}
          placeholder={t("campaignPush.namePlaceholder")} className={cn("h-12 rounded-[1.1rem] text-[16px]", theme.formField, theme.text)} />
        <Input type="tel" inputMode="tel" autoComplete="off" value={phone} onChange={(e) => { setPhone(e.target.value); setError(null); }}
          placeholder={t("campaignPush.phonePlaceholder")} className={cn("h-12 rounded-[1.1rem] text-[16px]", theme.formField, theme.text)} />
      </div>
      {error ? <p className={cn("mt-2 text-sm font-medium", theme.dangerText)}>{error}</p> : null}
      <button type="button" disabled={busy} onClick={() => void (iosFlow ? createInvite() : subscribe())} className={primary}>
        {busy ? <Loader2 className="size-5 animate-spin" /> : <Bell className="size-5" />}
        {iosFlow ? t("pushInvite.continue") : t("campaignPush.enable")}
      </button>
      <p className={cn("mt-3 text-[11px] leading-4", theme.textTertiary)}>{t("campaignPush.privacy")}</p>
    </div>
  );
}

export function PushInviteView(props: {
  subdomain: string;
  tenantName: string;
  logoUrl: string | null;
  appearance?: StorefrontAppearanceSettings;
  vapidPublicKey: string;
  token: string | null;
  invite: Invite;
}) {
  return (
    <StorefrontThemeProvider
      themeKey={props.appearance?.theme_key ?? "minimal"}
      brandPrimaryColor={props.appearance?.brand_primary_color}
      brandAccentColor={props.appearance?.brand_accent_color}
    >
      <StorefrontSubpageShell logoUrl={props.logoUrl} title={props.tenantName} maxWidthClassName="max-w-md" hideThemeToggle>
        <PushInviteCard subdomain={props.subdomain} tenantName={props.tenantName} vapidPublicKey={props.vapidPublicKey} token={props.token} invite={props.invite} />
      </StorefrontSubpageShell>
    </StorefrontThemeProvider>
  );
}
