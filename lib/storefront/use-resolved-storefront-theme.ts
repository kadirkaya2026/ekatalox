"use client";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import {
  applyBrandColorOverrides,
  type BrandColorSettings,
} from "@/lib/storefront/brand-colors";
import {
  getStorefrontTheme,
  type StorefrontColorScheme,
  type StorefrontTheme,
} from "@/lib/storefront/themes";

export function useResolvedStorefrontTheme(
  themeKey: string,
  brandColors: BrandColorSettings = {
    brand_primary_color: null,
    brand_accent_color: null,
  },
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
    return applyBrandColorOverrides(baseTheme, brandColors);
  }, [
    themeKey,
    colorScheme,
    brandColors.brand_primary_color,
    brandColors.brand_accent_color,
  ]);
}
