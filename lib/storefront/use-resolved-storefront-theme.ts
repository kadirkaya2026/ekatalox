"use client";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import {
  getStorefrontTheme,
  type StorefrontColorScheme,
  type StorefrontTheme,
} from "@/lib/storefront/themes";

export function useResolvedStorefrontTheme(themeKey: string): StorefrontTheme {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const colorScheme: StorefrontColorScheme =
    mounted && resolvedTheme === "dark" ? "dark" : "light";

  return useMemo(
    () => getStorefrontTheme(themeKey, colorScheme),
    [themeKey, colorScheme],
  );
}
