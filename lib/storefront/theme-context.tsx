"use client";

import { createContext, useContext } from "react";
import type {
  ProductImageBackgroundKey,
  StorefrontThemeKey,
  TenantStorefrontSettings,
} from "@/lib/types";
import {
  getStorefrontTheme,
  type StorefrontTheme,
} from "@/lib/storefront/themes";
import { useResolvedStorefrontTheme } from "@/lib/storefront/use-resolved-storefront-theme";

const StorefrontThemeContext = createContext<StorefrontTheme>(
  getStorefrontTheme("minimal"),
);

export type { StorefrontAppearanceSettings } from "@/lib/storefront/appearance";
export { getAppearanceFromSettings } from "@/lib/storefront/appearance";

export function StorefrontThemeProvider({
  themeKey,
  brandPrimaryColor,
  brandAccentColor,
  productImageBackground,
  children,
}: {
  themeKey: StorefrontThemeKey | string;
  brandPrimaryColor?: string | null;
  brandAccentColor?: string | null;
  productImageBackground?: ProductImageBackgroundKey | null;
  children: React.ReactNode;
}) {
  const theme = useResolvedStorefrontTheme(
    themeKey,
    {
      brand_primary_color: brandPrimaryColor ?? null,
      brand_accent_color: brandAccentColor ?? null,
    },
    productImageBackground,
  );

  return (
    <StorefrontThemeContext.Provider value={theme}>
      {children}
    </StorefrontThemeContext.Provider>
  );
}

export function useStorefrontTheme(): StorefrontTheme {
  return useContext(StorefrontThemeContext);
}

