"use client";

import { createContext, useContext } from "react";
import type { StorefrontThemeKey, TenantStorefrontSettings } from "@/lib/types";
import {
  getStorefrontTheme,
  type StorefrontTheme,
} from "@/lib/storefront/themes";
import { useResolvedStorefrontTheme } from "@/lib/storefront/use-resolved-storefront-theme";

const StorefrontThemeContext = createContext<StorefrontTheme>(
  getStorefrontTheme("minimal"),
);

export interface StorefrontAppearanceSettings {
  theme_key: StorefrontThemeKey | string;
  brand_primary_color?: string | null;
  brand_accent_color?: string | null;
}

export function StorefrontThemeProvider({
  themeKey,
  brandPrimaryColor,
  brandAccentColor,
  children,
}: {
  themeKey: StorefrontThemeKey | string;
  brandPrimaryColor?: string | null;
  brandAccentColor?: string | null;
  children: React.ReactNode;
}) {
  const theme = useResolvedStorefrontTheme(themeKey, {
    brand_primary_color: brandPrimaryColor ?? null,
    brand_accent_color: brandAccentColor ?? null,
  });

  return (
    <StorefrontThemeContext.Provider value={theme}>
      {children}
    </StorefrontThemeContext.Provider>
  );
}

export function useStorefrontTheme(): StorefrontTheme {
  return useContext(StorefrontThemeContext);
}

export function getAppearanceFromSettings(
  settings: Pick<
    TenantStorefrontSettings,
    "theme_key" | "brand_primary_color" | "brand_accent_color"
  >,
): StorefrontAppearanceSettings {
  return {
    theme_key: settings.theme_key,
    brand_primary_color: settings.brand_primary_color,
    brand_accent_color: settings.brand_accent_color,
  };
}
