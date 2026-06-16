"use client";

import type { CSSProperties } from "react";
import {
  buildBrandCssVariables,
  hasBrandColors,
} from "@/lib/storefront/brand-colors";
import { getStorefrontFontOption } from "@/lib/storefront/font-catalog";
import { StorefrontThemeProvider, useStorefrontTheme } from "@/lib/storefront/theme-context";
import type { TenantStorefrontSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

function StorefrontPageShellInner({
  className,
  fontClassName,
  style,
  children,
}: {
  className?: string;
  fontClassName: string;
  style?: CSSProperties;
  children: React.ReactNode;
}) {
  const theme = useStorefrontTheme();

  return (
    <div
      data-storefront
      data-branded={style ? "true" : undefined}
      style={style}
      className={cn(theme.page, fontClassName, className)}
    >
      {children}
    </div>
  );
}

export function StorefrontPageShell({
  storefrontSettings,
  themeKey,
  className,
  children,
}: {
  storefrontSettings?: Pick<
    TenantStorefrontSettings,
    "theme_key" | "brand_primary_color" | "brand_accent_color" | "font_key"
  >;
  themeKey?: string;
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
    <StorefrontThemeProvider
      themeKey={resolvedThemeKey}
      brandPrimaryColor={brandPrimaryColor}
      brandAccentColor={brandAccentColor}
    >
      <StorefrontPageShellInner
        className={className}
        fontClassName={fontOption.className}
        style={brandStyle}
      >
        {children}
      </StorefrontPageShellInner>
    </StorefrontThemeProvider>
  );
}
