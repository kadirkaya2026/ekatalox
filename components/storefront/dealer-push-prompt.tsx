"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2, X } from "lucide-react";
import { getCampaignPushStatus, getPushSupport, subscribeToCampaignPush } from "@/lib/push/client";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { savePushIdentity } from "@/lib/storefront/tracking-phone";
import { formatDealerDisplayName, type DealerProfile } from "@/lib/kurumsal/dealer-profile";
import { cn } from "@/lib/utils";

// Kişiye özel bayi şifresiyle İLK girişte (cihaz + şifre başına bir kez)
// bildirim daveti (27 Eyl 2026). Ad/telefon şifreden bilindiği için form yok:
// Android/masaüstü tek dokunuşla abone olur (abonelik çerezdeki erişim koduna
// bağlanır → panelden kişiye özel bildirim gider); iPhone'da Apple ana ekran
// şartı olduğu için hazır /bildirim rehberine gider (ad/telefon dolu gelir).

type Mode = "hidden" | "ask" | "ask_ios" | "busy" | "done" | "denied";

const storageKey = (accessCodeId: string) => `ek_dealer_push_prompt_${accessCodeId}`;

function markSeen(accessCodeId: string) {
  try {
    window.localStorage.setItem(storageKey(accessCodeId), new Date().toISOString());
  } catch {
    /* özel pencere / depolama kapalı */
  }
}

export function DealerPushPrompt({
  subdomain,
  vapidPublicKey,
  profile,
}: {
  subdomain: string;
  vapidPublicKey: string;
  profile: DealerProfile;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [mode, setMode] = useState<Mode>("hidden");
  const accessCodeId = profile.accessCodeId;
  const displayName = formatDealerDisplayName(profile);
  const phone = profile.phone?.trim() ?? "";

  useEffect(() => {
    if (!vapidPublicKey) return;
    try {
      if (window.localStorage.getItem(storageKey(accessCodeId))) return;
    } catch {
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const support = getPushSupport();
      if (support === "unsupported") return;
      if (support === "ios_needs_install") {
        if (!cancelled) setMode("ask_ios");
        return;
      }
      if (Notification.permission === "denied") return;
      const status = await getCampaignPushStatus({ subdomain }).catch(() => ({ subscribed: false }));
      if (cancelled) return;
      if (status.subscribed) {
        markSeen(accessCodeId);
        return;
      }
      setMode("ask");
    }, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [accessCodeId, subdomain, vapidPublicKey]);

  if (mode === "hidden") return null;

  const close = () => {
    markSeen(accessCodeId);
    setMode("hidden");
  };

  async function enable() {
    // Telefonsuz müşteri: /bildirim formu eksik bilgiyi sorar.
    if (mode === "ask_ios" || phone.replace(/\D/g, "").length < 10) {
      savePushIdentity({ name: displayName, phone });
      markSeen(accessCodeId);
      window.location.href = "/bildirim";
      return;
    }
    setMode("busy");
    const result = await subscribeToCampaignPush({ subdomain, vapidPublicKey, name: displayName, phone }).catch(() => ({
      ok: false as const,
      reason: "server" as const,
    }));
    markSeen(accessCodeId);
    if (result.ok) {
      savePushIdentity({ name: displayName, phone });
      setMode("done");
      window.setTimeout(() => setMode("hidden"), 2200);
      return;
    }
    setMode(Notification.permission === "denied" || result.reason === "denied" ? "denied" : "ask");
  }

  const firstName = profile.name?.trim().split(/\s+/)[0];
  const title = t("dealerPush.title").replace("{name}", firstName ? `, ${firstName}` : "");

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dealer-push-title"
    >
      <div className={cn("relative w-full max-w-sm rounded-3xl border p-6 shadow-2xl", theme.border, theme.surface)}>
        {mode !== "busy" && mode !== "done" ? (
          <button
            type="button"
            onClick={close}
            aria-label={t("dealerPush.later")}
            className={cn("absolute right-3 top-3 rounded-full p-1.5", theme.textMuted)}
          >
            <X className="size-5" />
          </button>
        ) : null}
        <span
          className={cn(
            "flex size-14 items-center justify-center rounded-2xl",
            theme.activeTileBg,
            theme.activeTileText,
          )}
        >
          <BellRing className="size-7" />
        </span>
        {mode === "done" ? (
          <p id="dealer-push-title" className={cn("mt-4 text-lg font-bold", theme.text)}>
            {t("dealerPush.done")}
          </p>
        ) : (
          <>
            <p id="dealer-push-title" className={cn("mt-4 text-xl font-bold leading-tight", theme.text)}>
              {title}
            </p>
            <p className={cn("mt-2 text-sm leading-6", theme.textMuted)}>
              {mode === "ask_ios" ? t("dealerPush.bodyIos") : t("dealerPush.body")}
            </p>
            {mode === "denied" ? (
              <p className={cn("mt-2 text-sm font-medium", theme.dangerText)}>{t("dealerPush.denied")}</p>
            ) : null}
            {mode !== "denied" ? (
              <button
                type="button"
                disabled={mode === "busy"}
                onClick={() => void enable()}
                className={cn(theme.primaryButton, "mt-5 inline-flex w-full items-center justify-center gap-2 px-5 py-3.5 text-base font-bold")}
              >
                {mode === "busy" ? <Loader2 className="size-5 animate-spin" /> : <BellRing className="size-5" />}
                {mode === "ask_ios" ? t("dealerPush.enableIos") : t("dealerPush.enable")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={close}
              disabled={mode === "busy"}
              className={cn("mt-3 w-full text-center text-sm font-semibold", theme.textMuted)}
            >
              {t("dealerPush.later")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
