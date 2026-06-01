import type { StorefrontLayoutKey } from "@/lib/types";

export interface StorefrontLayoutOption {
  key: StorefrontLayoutKey;
  title: string;
  description: string;
}

export const LAYOUT_OPTIONS: StorefrontLayoutOption[] = [
  {
    key: "classic-grid",
    title: "Klasik Grid",
    description: "Mevcut vitrin düzeni; dengeli kart grid’i.",
  },
  {
    key: "catalog-dense",
    title: "Yoğun Grid",
    description: "Daha sık sütunlar; çok ürünlü kataloglar için.",
  },
  {
    key: "catalog-list",
    title: "Liste Görünümü",
    description: "Satır satır SKU, fiyat ve stok; B2B tarama için ideal.",
  },
];
