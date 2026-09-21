"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StorefrontThemeKey } from "@/lib/types";
import { StorefrontThemeProvider, useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { StorefrontThemeToggle } from "@/components/storefront/storefront-theme-toggle";
import { StorefrontLanguageSwitcher } from "@/components/storefront/storefront-language-switcher";
import { StorefrontAdInline } from "@/components/storefront/storefront-ads";
import type { StorefrontAdsConfig } from "@/lib/ads/config";
import { getGateBrandingCopy, type GateBranding } from "@/lib/storefront/gate-branding";
import { cn } from "@/lib/utils";

function PasswordGateForm({
  subdomain,
  companyName,
  ads,
  branding,
}: {
  subdomain: string;
  companyName: string;
  ads?: StorefrontAdsConfig | null;
  branding?: GateBranding | null;
}) {
  const theme = useStorefrontTheme();
  const { t, locale } = useStorefrontLocale();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/storefront/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain, code }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? t("gate.defaultError"));
        return;
      }

      // Şifre kapısı rewrite ile gösterilir (adres çubuğu istenen sayfada kalır);
      // girişten sonra ana sayfaya değil, o sayfaya dön (ör. /bildirim?t=…).
      const { pathname, search } = window.location;
      window.location.assign(pathname && pathname !== "/" ? `${pathname}${search}` : "/");
    });
  }

  const card = (
    <div className={cn(theme.gateCard, branding && "shadow-[0_30px_80px_rgba(0,0,0,0.45)]")}>
      <p className={theme.gateEyebrow}>{t("gate.eyebrow")}</p>
      <h1 className={theme.gateTitle}>{companyName}</h1>
      <p className={theme.gateDescription}>
        {t("gate.description")}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Input
          inputMode="numeric"
          aria-label={t("gate.passwordPlaceholder")}
          placeholder={t("gate.passwordPlaceholder")}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className={theme.formField}
        />
        <Button type="submit" className={`w-full ${theme.primaryButton}`} disabled={pending}>
          {pending ? t("gate.verifying") : t("gate.submit")}
        </Button>
        {error ? <p className={`text-sm ${theme.gateError}`}>{error}</p> : null}
      </form>
      {ads ? <StorefrontAdInline ads={ads} subdomain={subdomain} placement="password_gate" /> : null}
    </div>
  );

  if (!branding) {
    return (
      <div className="container-shell flex min-h-screen items-center justify-center py-8">
        {card}
      </div>
    );
  }

  // Markalı kapı: tam ekran koyu ürün sahnesi, solda marka metni, sağda kart.
  const copy = getGateBrandingCopy(branding, locale);

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-cover bg-[position:72%_center] lg:bg-[position:right_center]"
        style={{ backgroundImage: `url(${branding.backgroundImage})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(6,6,7,0.96)_0%,rgba(6,6,7,0.88)_30%,rgba(6,6,7,0.55)_50%,rgba(6,6,7,0.08)_72%,rgba(6,6,7,0.2)_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-64 bg-[linear-gradient(180deg,rgba(6,6,7,0)_0%,rgba(6,6,7,0.85)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/3 -z-10 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl"
        style={{ background: `radial-gradient(circle, ${branding.accentColor}55 0%, transparent 70%)` }}
      />

      <div className="container-shell flex min-h-screen flex-col justify-center py-20 sm:py-24">
        <div className="w-full max-w-md lg:max-w-[460px]">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={branding.logoMark} alt="" className="h-8 w-auto sm:h-10" />
            <span className="text-lg font-bold tracking-[0.18em] sm:text-xl">{branding.wordmark}</span>
          </div>
          <p
            className="mt-7 text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: branding.accentColor }}
          >
            {copy.eyebrow}
          </p>
          <h2 className="mt-2 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            {copy.headline}
          </h2>
          <p className="mt-4 text-sm leading-6 text-white/70 sm:text-base sm:leading-7">{copy.tagline}</p>

          <div className="mt-7">{card}</div>

          <ul className="mt-6 flex flex-wrap gap-2">
            {copy.chips.map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-medium tracking-wide text-white/80 backdrop-blur-sm"
              >
                {chip}
              </li>
            ))}
          </ul>
          {copy.helpLine ? (
            <p className="mt-5 text-xs text-white/50 sm:text-sm">{copy.helpLine}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PasswordGate({
  subdomain,
  companyName,
  themeKey = "minimal",
  isThemeToggleVisible = true,
  ads,
  branding,
}: {
  subdomain: string;
  companyName: string;
  themeKey?: StorefrontThemeKey | string;
  isThemeToggleVisible?: boolean;
  ads?: StorefrontAdsConfig | null;
  branding?: GateBranding | null;
}) {
  return (
    <StorefrontThemeProvider themeKey={themeKey}>
      <div data-storefront className="relative min-h-screen">
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-6 sm:top-6">
          <StorefrontLanguageSwitcher />
          {isThemeToggleVisible ? <StorefrontThemeToggle /> : null}
        </div>
        <PasswordGateForm subdomain={subdomain} companyName={companyName} ads={ads} branding={branding} />
      </div>
    </StorefrontThemeProvider>
  );
}
