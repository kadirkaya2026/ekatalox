"use client";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import {
  applyBrandColorOverrides,
  type BrandColorSettings,
} from "@/lib/storefront/brand-colors";
import { applyProductImageBackgroundOverride } from "@/lib/storefront/product-image-background";
import {
  getStorefrontTheme,
  type StorefrontColorScheme,
  type StorefrontTheme,
} from "@/lib/storefront/themes";
import type { ProductImageBackgroundKey } from "@/lib/types";

export function useResolvedStorefrontTheme(
  themeKey: string,
  brandColors: BrandColorSettings = {
    brand_primary_color: null,
    brand_accent_color: null,
  },
  productImageBackground?: ProductImageBackgroundKey | null,
): StorefrontTheme {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const colorScheme: StorefrontColorScheme =
    mounted && resolvedTheme === "dark" ? "dark" : "light";

  // Palet nesnesi her render'da yeni referans olabilir; memo anahtarı
  // olarak içeriğinin JSON'u kullanılır (25 Eyl 2026).
  const paletteKey = JSON.stringify(brandColors.brand_palette ?? {});

  return useMemo(() => {
    const baseTheme = getStorefrontTheme(themeKey, colorScheme);
    const withBrandColors = applyBrandColorOverrides(
      baseTheme,
      {
        brand_primary_color: brandColors.brand_primary_color,
        brand_accent_color: brandColors.brand_accent_color,
        brand_palette: JSON.parse(paletteKey) as BrandColorSettings["brand_palette"],
      },
      colorScheme,
    );
    return applyProductImageBackgroundOverride(withBrandColors, productImageBackground);
  }, [
    themeKey,
    colorScheme,
    brandColors.brand_primary_color,
    brandColors.brand_accent_color,
    paletteKey,
    productImageBackground,
  ]);
}
