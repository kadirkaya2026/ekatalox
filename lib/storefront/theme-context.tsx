"use client";

import { createContext, useContext } from "react";
import type { StorefrontThemeKey } from "@/lib/types";
import {
  getStorefrontTheme,
  type StorefrontTheme,
} from "@/lib/storefront/themes";

const StorefrontThemeContext = createContext<StorefrontTheme>(
  getStorefrontTheme("minimal"),
);

export function StorefrontThemeProvider({
  themeKey,
  children,
}: {
  themeKey: StorefrontThemeKey | string;
  children: React.ReactNode;
}) {
  const theme = getStorefrontTheme(themeKey);

  return (
    <StorefrontThemeContext.Provider value={theme}>
      {children}
    </StorefrontThemeContext.Provider>
  );
}

export function useStorefrontTheme(): StorefrontTheme {
  return useContext(StorefrontThemeContext);
}
