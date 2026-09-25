"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StorefrontThemeKey } from "@/lib/types";
import {
  StorefrontThemeProvider,
  useStorefrontTheme,
  type StorefrontAppearanceSettings,
} from "@/lib/storefront/theme-context";
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
    <div className={cn(theme.gateCard, branding && "shadow-[0_30px_80px_rgba(0,0,0,0.45)] max-sm:p-5 [@media(max-height:700px)]:p-5")}>
      <p className={theme.gateEyebrow} style={branding ? { color: branding.accentColor } : undefined}>
        {t("gate.eyebrow")}
      </p>
      <h1 className={theme.gateTitle}>{companyName}</h1>
      <p className={cn(theme.gateDescription, branding && "max-sm:mt-1 max-sm:text-xs max-sm:leading-5")}>
        {t("gate.description")}
      </p>

      <form onSubmit={submit} className={cn("mt-6 space-y-4", branding && "max-sm:mt-4 max-sm:space-y-3 [@media(max-height:700px)]:mt-4 [@media(max-height:700px)]:space-y-3")}>
        <Input
          inputMode="numeric"
          aria-label={t("gate.passwordPlaceholder")}
          placeholder={t("gate.passwordPlaceholder")}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className={theme.formField}
        />
        <Button
          type="submit"
          className={cn("w-full", theme.gateButton, branding && "border-0 text-white hover:brightness-110")}
          // Markalı kapıda buton tema rengi yerine markanın vurgu rengini alır
          style={branding ? { backgroundColor: branding.accentColor } : undefined}
          disabled={pending}
        >
          {pending ? t("gate.verifying") : t("gate.submit")}
        </Button>
        {error ? <p className={`text-sm ${theme.gateError}`}>{error}</p> : null}
      </form>
      {ads ? (
        // Markalı kapıda çok kısa telefon ekranlarında (iPhone SE) reklam kutusu
        // tek ekrana sığmayı bozuyor; yalnız o durumda gizlenir.
        <div className={cn(branding && "max-sm:[@media(max-height:700px)]:hidden")}>
          <StorefrontAdInline ads={ads} subdomain={subdomain} placement="password_gate" />
        </div>
      ) : null}
    </div>
  );

  if (!branding) {
    return (
      <div className="container-shell flex flex-1 items-center justify-center py-6 sm:py-8">
        {card}
      </div>
    );
  }

  // Markalı kapı: tam ekran koyu ürün sahnesi, solda marka metni, sağda kart.
  const copy = getGateBrandingCopy(branding, locale);

  return (
    <div className="relative isolate flex flex-1 flex-col overflow-hidden bg-[#0a0a0a] text-white">
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

      {/* Tek ekran: mobilde tek sütun, masaüstünde metin + kart yan yana;
          kısa ekranlarda (max-height) boşluklar ve ikincil metinler daralır. */}
      <div className="container-shell flex flex-1 flex-col justify-center py-4 sm:py-8">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,400px)] lg:items-center lg:gap-12">
          <div className="pr-24 lg:pr-0">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={branding.logoMark} alt="" className="h-7 w-auto sm:h-9" />
              <span className="text-base font-bold tracking-[0.18em] sm:text-xl">{branding.wordmark}</span>
            </div>
            <p
              className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] sm:mt-6 sm:text-xs"
              style={{ color: branding.accentColor }}
            >
              {copy.eyebrow}
            </p>
            <h2 className="mt-1.5 text-3xl font-bold leading-[1.05] tracking-tight max-sm:[@media(max-height:760px)]:text-2xl sm:text-4xl lg:text-5xl">
              {copy.headline}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70 max-sm:[@media(max-height:720px)]:hidden sm:text-base sm:leading-7 [@media(max-height:620px)]:hidden">
              {copy.tagline}
            </p>
            <ul className="mt-4 hidden flex-wrap gap-2 sm:mt-6 lg:flex [@media(max-height:700px)]:lg:hidden">
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
              <p className="mt-4 hidden text-sm text-white/50 lg:block">{copy.helpLine}</p>
            ) : null}
          </div>

          <div>
            {card}
            <ul className="mt-4 flex flex-wrap gap-1.5 lg:hidden [@media(max-height:900px)]:hidden">
              {copy.chips.map((chip) => (
                <li
                  key={chip}
                  className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium tracking-wide text-white/80"
                >
                  {chip}
                </li>
              ))}
            </ul>
            {copy.helpLine ? (
              <p className="mt-3 text-xs text-white/50 max-sm:[@media(max-height:800px)]:hidden lg:hidden">{copy.helpLine}</p>
            ) : null}
          </div>
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
  appearance,
}: {
  subdomain: string;
  companyName: string;
  themeKey?: StorefrontThemeKey | string;
  isThemeToggleVisible?: boolean;
  ads?: StorefrontAdsConfig | null;
  branding?: GateBranding | null;
  /** Marka renkleri: kapı kendi tema sağlayıcısını kurduğu için dışarıdaki
   *  StorefrontPageShell'in renkleri buraya ulaşmıyordu ("Mağaza'ya Gir"
   *  hep tema renginde kalıyordu; düzeltme 25 Eyl 2026). Markalı kapıda
   *  (gate-branding) branding.accentColor yine önceliklidir. */
  appearance?: StorefrontAppearanceSettings | null;
}) {
  return (
    <StorefrontThemeProvider
      themeKey={appearance?.theme_key ?? themeKey}
      brandPrimaryColor={appearance?.brand_primary_color}
      brandAccentColor={appearance?.brand_accent_color}
      brandPalette={appearance?.brand_palette}
      productImageBackground={appearance?.product_image_background}
    >
      <div data-storefront className="relative flex flex-1 flex-col">
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-6 sm:top-6">
          <StorefrontLanguageSwitcher />
          {isThemeToggleVisible ? <StorefrontThemeToggle /> : null}
        </div>
        <PasswordGateForm subdomain={subdomain} companyName={companyName} ads={ads} branding={branding} />
      </div>
    </StorefrontThemeProvider>
  );
}
