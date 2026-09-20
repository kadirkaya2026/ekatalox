"use client";

import type { CSSProperties } from "react";
import {
  buildBrandCssVariables,
  hasBrandColors,
} from "@/lib/storefront/brand-colors";
import { getStorefrontFontOption } from "@/lib/storefront/font-catalog";
import { StorefrontThemeProvider, useStorefrontTheme } from "@/lib/storefront/theme-context";
import { StorefrontLocaleProvider } from "@/lib/storefront/locale-context";
import type { TenantStorefrontSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StorefrontPoweredByBar } from "@/components/storefront/storefront-powered-by-bar";
import { StorefrontAdBottomBar } from "@/components/storefront/storefront-ads";
import type { StorefrontAdsConfig } from "@/lib/ads/config";
import { StorefrontThemeReset } from "@/components/storefront/storefront-theme-reset";

function StorefrontPageShellInner({
  className,
  fontClassName,
  style,
  isThemeToggleVisible,
  hidePoweredBy,
  ads,
  subdomain,
  children,
}: {
  className?: string;
  fontClassName: string;
  style?: CSSProperties;
  isThemeToggleVisible: boolean;
  hidePoweredBy?: boolean;
  ads?: StorefrontAdsConfig | null;
  subdomain: string;
  children: React.ReactNode;
}) {
  const theme = useStorefrontTheme();

  return (
    <div
      data-storefront
      data-branded={style ? "true" : undefined}
      style={style}
      className={cn("flex min-h-svh flex-col", theme.page, fontClassName, className)}
    >
      <StorefrontThemeReset isToggleVisible={isThemeToggleVisible} />
      {children}
      {ads ? (
        <StorefrontAdBottomBar ads={ads} subdomain={subdomain} />
      ) : hidePoweredBy ? null : (
        <StorefrontPoweredByBar />
      )}
    </div>
  );
}

export function StorefrontPageShell({
  storefrontSettings,
  themeKey,
  subdomain,
  className,
  hidePoweredBy,
  pickupWording,
  ads,
  children,
}: {
  storefrontSettings?: Pick<
    TenantStorefrontSettings,
    | "theme_key"
    | "brand_primary_color"
    | "brand_accent_color"
    | "font_key"
    | "default_locale"
    | "is_theme_toggle_visible"
    | "product_image_background"
  >;
  themeKey?: string;
  subdomain: string;
  className?: string;
  // Market/tekel vitrinlerinde eKatalox rozeti gösterilmez
  // (bkz. lib/storefront/white-label.ts).
  hidePoweredBy?: boolean;
  // Tekel vitrini: "sepet" yerine "sipariş listesi" dili (tenants.is_tekel).
  pickupWording?: boolean;
  // Ücretsiz plan: eKatalox reklam bandı (rozetin yerine geçer, white-label'ı
  // ezer). null/undefined = reklam yok. Bkz. lib/ads/server.ts.
  ads?: StorefrontAdsConfig | null;
  children: React.ReactNode;
}) {
  const resolvedThemeKey = storefrontSettings?.theme_key ?? themeKey ?? "minimal";
  const brandPrimaryColor = storefrontSettings?.brand_primary_color ?? null;
  const brandAccentColor = storefrontSettings?.brand_accent_color ?? null;
  const fontOption = getStorefrontFontOption(storefrontSettings?.font_key);
  const brandStyle = hasBrandColors({
    brand_primary_color: brandPrimaryColor,
    brand_accent_color: brandAccentColor,
  })
    ? buildBrandCssVariables({
        brand_primary_color: brandPrimaryColor,
        brand_accent_color: brandAccentColor,
      })
    : undefined;

  return (
    <StorefrontLocaleProvider
      subdomain={subdomain}
      initialLocale={storefrontSettings?.default_locale}
      pickupWording={pickupWording}
    >
      <StorefrontThemeProvider
        themeKey={resolvedThemeKey}
        brandPrimaryColor={brandPrimaryColor}
        brandAccentColor={brandAccentColor}
        productImageBackground={storefrontSettings?.product_image_background}
      >
        <StorefrontPageShellInner
          className={className}
          fontClassName={fontOption.className}
          style={brandStyle}
          isThemeToggleVisible={storefrontSettings?.is_theme_toggle_visible !== false}
          hidePoweredBy={hidePoweredBy}
          ads={ads}
          subdomain={subdomain}
        >
          {children}
        </StorefrontPageShellInner>
      </StorefrontThemeProvider>
    </StorefrontLocaleProvider>
  );
}
