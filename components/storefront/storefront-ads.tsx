"use client";

import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { EkataloxLogo } from "@/components/brand/ekatalox-logo";
import { buildStorefrontAdHref, type StorefrontAdsConfig } from "@/lib/ads/config";
import { cn } from "@/lib/utils";

// eKatalox'un kendi reklam yerleşimleri — yalnız Ücretsiz plandaki vitrinlerde
// (bkz. lib/ads/server.ts resolveStorefrontAds). Tema/renkten bağımsız, her
// zaman aynı görünür: bayi bunları panelden değiştiremez, kaldıramaz.

type AdProps = { ads: StorefrontAdsConfig; subdomain?: string | null };

const AD_LABEL = "eKatalox Reklamları";

function OwnerLine({ ads, subdomain, className }: AdProps & { className?: string }) {
  if (!ads.owner_text) return null;
  return (
    <a
      href={buildStorefrontAdHref(ads.owner_url, "bottom_bar", subdomain)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("text-[10px] text-slate-400 underline-offset-2 hover:underline", className)}
    >
      {ads.owner_text}
    </a>
  );
}

/** 1) Sayfanın altında sabit bant — eski "eKatalox ile yapıldı" rozetinin yerine. */
export function StorefrontAdBottomBar({ ads, subdomain }: AdProps) {
  if (!ads.bottom_bar.enabled) return null;
  return (
    <div className="sticky bottom-0 z-30 border-t border-slate-800 bg-black py-2 text-slate-200">
      <div className="container-shell flex flex-col items-center gap-1 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px]">
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            Reklam
          </span>
          <EkataloxLogo variant="dark" alt="eKatalox" className="h-3.5 w-[62px]" />
          <span>{ads.bottom_bar.text}</span>
          <a
            href={buildStorefrontAdHref(ads.cta_url, "bottom_bar", subdomain)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-300 hover:text-emerald-200"
          >
            {ads.bottom_bar.cta_label} →
          </a>
        </div>
        <OwnerLine ads={ads} subdomain={subdomain} />
      </div>
    </div>
  );
}

/** 2) Ürün listesinde her N üründe bir reklam kartı. */
export function StorefrontAdProductCard({ ads, subdomain, compact = false }: AdProps & { compact?: boolean }) {
  if (!ads.product_card.enabled) return null;
  const href = buildStorefrontAdHref(ads.cta_url, "product_card", subdomain);

  if (compact) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 px-3 py-2 text-slate-800"
      >
        <EkataloxLogo variant="light" alt="eKatalox" className="h-4 w-[70px] shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{ads.product_card.title}</p>
          <p className="truncate text-xs text-slate-600">{ads.product_card.text}</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
          {ads.product_card.cta_label}
        </span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-full min-h-[220px] flex-col justify-between rounded-2xl border border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-4 text-slate-800 transition hover:border-emerald-400 hover:shadow-md"
    >
      <div>
        <div className="flex items-center justify-between">
          <EkataloxLogo variant="light" alt="eKatalox" className="h-4 w-[70px]" />
          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600">
            Reklam
          </span>
        </div>
        <p className="mt-4 text-base font-semibold leading-snug">{ads.product_card.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{ads.product_card.text}</p>
      </div>
      <span className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
        {ads.product_card.cta_label}
      </span>
    </a>
  );
}

/** 5) Ürün detayı altı / 6) şifre ekranı — küçük kutu. */
export function StorefrontAdInline({
  ads,
  subdomain,
  placement,
}: AdProps & { placement: "product_detail" | "password_gate" }) {
  const block = ads[placement];
  if (!block.enabled) return null;
  const title = placement === "password_gate" ? ads.password_gate.title : AD_LABEL;
  const href = buildStorefrontAdHref(ads.cta_url, placement, subdomain);

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700",
        placement === "password_gate" ? "mx-auto mt-6 w-full max-w-md" : "mt-4",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <EkataloxLogo variant="light" alt="eKatalox" className="h-3.5 w-[62px]" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{title}</span>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed">{block.text}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
        >
          {block.cta_label} <ExternalLink className="size-3" />
        </a>
        {placement === "password_gate" ? <OwnerLine ads={ads} subdomain={subdomain} /> : null}
      </div>
    </div>
  );
}

function popupStorageKey(subdomain?: string | null) {
  const day = new Date().toISOString().slice(0, 10);
  return `ekatalox-ad-popup:${subdomain ?? "store"}:${day}`;
}

function readPopupCount(key: string): number {
  try {
    return Number(window.localStorage.getItem(key) ?? "0") || 0;
  } catch {
    return 0;
  }
}

function writePopupCount(key: string, value: number) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // özel mod / engelli depolama: sayaç tutulamazsa yine de göster
  }
}

/**
 * 3) Açılış pop-up'ı. delay_seconds sonra, günde max_per_day kez (cihaz
 * başına). `suspended` (sepet, ürün detayı, arama açıkken) doluyken
 * beklemeye alır; kapanınca gösterir. Sipariş akışını hiç kesmez.
 */
export function StorefrontAdPopup({ ads, subdomain, suspended = false }: AdProps & { suspended?: boolean }) {
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const { enabled, delay_seconds: delay, max_per_day: maxPerDay } = ads.popup;

  useEffect(() => {
    if (!enabled || maxPerDay <= 0) return;
    const key = popupStorageKey(subdomain);
    if (readPopupCount(key) >= maxPerDay) return;
    const timer = window.setTimeout(() => setArmed(true), Math.max(0, delay) * 1000);
    return () => window.clearTimeout(timer);
  }, [enabled, maxPerDay, delay, subdomain]);

  // Süre doldu ama sepet/detay açıksa bekle; kapanınca bir sonraki tick'te göster.
  useEffect(() => {
    if (!armed || suspended || open) return;
    const timer = window.setTimeout(() => {
      const key = popupStorageKey(subdomain);
      const count = readPopupCount(key);
      if (count >= maxPerDay) return;
      writePopupCount(key, count + 1);
      setArmed(false);
      setOpen(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [armed, suspended, open, maxPerDay, subdomain]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={AD_LABEL}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-800 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EkataloxLogo variant="light" alt="eKatalox" className="h-4 w-[70px]" />
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Reklam
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Kapat"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-4 text-lg font-semibold leading-snug">{ads.popup.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{ads.popup.text}</p>
        <a
          href={buildStorefrontAdHref(ads.cta_url, "popup", subdomain)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {ads.popup.cta_label}
        </a>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-2 w-full py-1.5 text-xs text-slate-500 hover:text-slate-700"
        >
          Kataloğa devam et
        </button>
        <OwnerLine ads={ads} subdomain={subdomain} className="mt-2 block text-center" />
      </div>
    </div>
  );
}
