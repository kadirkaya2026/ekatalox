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

  return useMemo(() => {
    const baseTheme = getStorefrontTheme(themeKey, colorScheme);
    const withBrandColors = applyBrandColorOverrides(baseTheme, brandColors);
    return applyProductImageBackgroundOverride(withBrandColors, productImageBackground);
  }, [
    themeKey,
    colorScheme,
    brandColors.brand_primary_color,
    brandColors.brand_accent_color,
    productImageBackground,
  ]);
}
