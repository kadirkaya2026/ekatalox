import type { StorefrontLayoutKey } from "@/lib/types";

export type StorefrontProductView = "grid-card" | "list-row";
export type StorefrontCategoryNavStyle = "top-chips" | "sidebar";

export interface StorefrontLayout {
  key: StorefrontLayoutKey;
  productView: StorefrontProductView;
  categoryNav: StorefrontCategoryNavStyle;
  productGridClass: string;
  sectionProductGridClass: string;
  listContainerClass: string;
  catalogShellClass: string;
}

export const storefrontLayouts: Record<StorefrontLayoutKey, StorefrontLayout> = {
  "classic-grid": {
    key: "classic-grid",
    productView: "grid-card",
    categoryNav: "top-chips",
    // Mobilde 2 sütun: 3'lüde görsel küçük, ürün adı okunmuyordu
    // (kullanıcı isteği, 1 Eyl 2026). sm ve üzeri eski düzeninde.
    productGridClass: "grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5",
    sectionProductGridClass: "grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5",
    listContainerClass: "",
    catalogShellClass: "min-w-0",
  },
  "catalog-dense": {
    key: "catalog-dense",
    productView: "grid-card",
    categoryNav: "top-chips",
    productGridClass:
      "grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2 lg:grid-cols-5 xl:grid-cols-6",
    sectionProductGridClass:
      "grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2 lg:grid-cols-5 xl:grid-cols-6",
    listContainerClass: "",
    catalogShellClass: "min-w-0",
  },
  "catalog-list": {
    key: "catalog-list",
    productView: "list-row",
    categoryNav: "top-chips",
    productGridClass: "flex flex-col gap-2 sm:gap-2.5",
    sectionProductGridClass: "flex flex-col gap-2 sm:gap-2.5",
    listContainerClass: "flex flex-col gap-2 sm:gap-2.5",
    catalogShellClass: "min-w-0",
  },
  "sidebar-pro": {
    key: "sidebar-pro",
    productView: "grid-card",
    categoryNav: "sidebar",
    productGridClass: "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4",
    sectionProductGridClass: "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4",
    listContainerClass: "",
    catalogShellClass:
      "min-w-0 lg:grid lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)] lg:items-start lg:gap-8",
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

export function usesStorefrontSidebarNav(key: string): boolean {
  return getStorefrontLayout(key).categoryNav === "sidebar";
}
