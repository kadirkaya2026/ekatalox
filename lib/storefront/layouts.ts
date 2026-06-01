import type { StorefrontLayoutKey } from "@/lib/types";

export type StorefrontProductView = "grid-card" | "list-row";

export interface StorefrontLayout {
  key: StorefrontLayoutKey;
  productView: StorefrontProductView;
  productGridClass: string;
  sectionProductGridClass: string;
  listContainerClass: string;
}

export const storefrontLayouts: Record<StorefrontLayoutKey, StorefrontLayout> = {
  "classic-grid": {
    key: "classic-grid",
    productView: "grid-card",
    productGridClass: "grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5",
    sectionProductGridClass: "grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5",
    listContainerClass: "",
  },
  "catalog-dense": {
    key: "catalog-dense",
    productView: "grid-card",
    productGridClass:
      "grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 lg:grid-cols-5 xl:grid-cols-6",
    sectionProductGridClass:
      "grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 lg:grid-cols-5 xl:grid-cols-6",
    listContainerClass: "",
  },
  "catalog-list": {
    key: "catalog-list",
    productView: "list-row",
    productGridClass: "flex flex-col gap-2 sm:gap-2.5",
    sectionProductGridClass: "flex flex-col gap-2 sm:gap-2.5",
    listContainerClass: "flex flex-col gap-2 sm:gap-2.5",
  },
};

export function resolveStorefrontLayoutKey(key: string): StorefrontLayoutKey {
  if (key in storefrontLayouts) {
    return key as StorefrontLayoutKey;
  }

  return "classic-grid";
}

export function getStorefrontLayout(key: string): StorefrontLayout {
  return storefrontLayouts[resolveStorefrontLayoutKey(key)];
}
