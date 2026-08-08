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
import { StorefrontThemeReset } from "@/components/storefront/storefront-theme-reset";

function StorefrontPageShellInner({
  className,
  fontClassName,
  style,
  isThemeToggleVisible,
  children,
}: {
  className?: string;
  fontClassName: string;
  style?: CSSProperties;
  isThemeToggleVisible: boolean;
  children: React.ReactNode;
}) {
  const theme = useStorefrontTheme();

  return (
    <div
      data-storefront
      data-branded={style ? "true" : undefined}
      style={style}
      className={cn("flex min-h-screen flex-col", theme.page, fontClassName, className)}
    >
      <StorefrontThemeReset isToggleVisible={isThemeToggleVisible} />
      {children}
      <StorefrontPoweredByBar />
    </div>
  );
}

export function StorefrontPageShell({
  storefrontSettings,
  themeKey,
  subdomain,
  className,
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
    <StorefrontLocaleProvider subdomain={subdomain} initialLocale={storefrontSettings?.default_locale}>
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
        >
          {children}
        </StorefrontPageShellInner>
      </StorefrontThemeProvider>
    </StorefrontLocaleProvider>
  );
}
