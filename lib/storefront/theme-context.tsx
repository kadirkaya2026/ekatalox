"use client";

import { electronicsCommerceTheme } from "@/components/storefront/sector-design/commerce-theme";
import type { DesignId } from "@/lib/storefront/sector-design/config";
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
import type { BrandPalette } from "@/lib/storefront/brand-palette";
import { useResolvedStorefrontTheme } from "@/lib/storefront/use-resolved-storefront-theme";

const StorefrontThemeContext = createContext<StorefrontTheme>(
  getStorefrontTheme("minimal"),
);

export type { StorefrontAppearanceSettings } from "@/lib/storefront/appearance";
export { getAppearanceFromSettings } from "@/lib/storefront/appearance";

export function StorefrontThemeProvider({
  themeKey,
  commerceDesign,
  brandPrimaryColor,
  brandAccentColor,
  brandPalette,
  productImageBackground,
  children,
}: {
  themeKey: StorefrontThemeKey | string;
  commerceDesign?: DesignId;
  brandPrimaryColor?: string | null;
  brandAccentColor?: string | null;
  /** Buton / bölüm bazlı renkler (tenant_storefront_settings.brand_palette). */
  brandPalette?: BrandPalette | null;
  productImageBackground?: ProductImageBackgroundKey | null;
  children: React.ReactNode;
}) {
  const theme = useResolvedStorefrontTheme(
    themeKey,
    {
      brand_primary_color: brandPrimaryColor ?? null,
      brand_accent_color: brandAccentColor ?? null,
      brand_palette: brandPalette ?? null,
    },
    productImageBackground,
  );

  return (
    <StorefrontThemeContext.Provider value={electronicsCommerceTheme(theme, commerceDesign)}>
      {children}
    </StorefrontThemeContext.Provider>
  );
}

export function useStorefrontTheme(): StorefrontTheme {
  return useContext(StorefrontThemeContext);
}

