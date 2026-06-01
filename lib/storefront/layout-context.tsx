"use client";

import { createContext, useContext } from "react";
import type { StorefrontLayoutKey } from "@/lib/types";
import {
  getStorefrontLayout,
  type StorefrontLayout,
} from "@/lib/storefront/layouts";

const StorefrontLayoutContext = createContext<StorefrontLayout>(
  getStorefrontLayout("classic-grid"),
);

export function StorefrontLayoutProvider({
  layoutKey,
  children,
}: {
  layoutKey: StorefrontLayoutKey | string;
  children: React.ReactNode;
}) {
  const layout = getStorefrontLayout(layoutKey);

  return (
    <StorefrontLayoutContext.Provider value={layout}>
      {children}
    </StorefrontLayoutContext.Provider>
  );
}

export function useStorefrontLayout(): StorefrontLayout {
  return useContext(StorefrontLayoutContext);
}
