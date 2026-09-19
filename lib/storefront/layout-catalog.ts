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
    description: "Ürünler orta boy kutular (kartlar) hâlinde yan yana dizilir; kategoriler üstte buton olarak durur. En tanıdık, herkese uygun görünüm.",
  },
  {
    key: "catalog-dense",
    title: "Yoğun Grid",
    description: "Aynı kart görünümü ama kutular daha küçük; bir satıra daha çok ürün sığar, müşteri daha az kaydırır. Ürün sayısı çok olanlar için.",
  },
  {
    key: "catalog-list",
    title: "Liste Görünümü",
    description: "Kutu yok: ürünler Excel gibi satır satır listelenir (ad, model kodu, fiyat, stok). Model koduna bakıp hızlı sipariş geçen toptan alıcılar için.",
  },
  {
    key: "sidebar-pro",
    title: "Sidebar Pro",
    description: "Kategoriler solda liste olarak sabit durur, ürünler sağda küçük kartlarla. Kategorisi çok olan mağazalarda müşteri kaybolmaz.",
  },
];
