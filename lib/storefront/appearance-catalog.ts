import type {
  StorefrontFooterStyleKey,
  StorefrontHeaderStyleKey,
  StorefrontProductCardStyle,
} from "@/lib/types";

export interface AppearanceOption<T extends string> {
  key: T;
  title: string;
  description: string;
}

export const PRODUCT_CARD_STYLE_OPTIONS: AppearanceOption<StorefrontProductCardStyle>[] = [
  {
    key: "standard",
    title: "Standart",
    description: "Dengeli görsel, başlık ve fiyat alanı.",
  },
  {
    key: "compact",
    title: "Kompakt",
    description: "Daha sık grid; küçük görsel ve kısa kartlar.",
  },
  {
    key: "image-forward",
    title: "Görsel Odaklı",
    description: "Büyük ürün görseli, minimal metin.",
  },
];

export const HEADER_STYLE_OPTIONS: AppearanceOption<StorefrontHeaderStyleKey>[] = [
  {
    key: "standard",
    title: "Standart",
    description: "Logo solda, arama ortada, sepet sağda.",
  },
  {
    key: "centered",
    title: "Ortalanmış",
    description: "Logo ve başlık ortada, arama alt satırda.",
  },
  {
    key: "minimal",
    title: "Minimal",
    description: "Kompakt üst bar; arama ve kategori alt satırda.",
  },
];

export const FOOTER_STYLE_OPTIONS: AppearanceOption<StorefrontFooterStyleKey>[] = [
  {
    key: "standard",
    title: "Standart",
    description: "Logo, iletişim ve sosyal alanlar tek akışta.",
  },
  {
    key: "minimal",
    title: "Minimal",
    description: "Sadece telif ve temel iletişim bilgisi.",
  },
  {
    key: "columns",
    title: "Sütunlu",
    description: "Üç sütunlu iletişim ve sosyal düzen.",
  },
];

export const BRAND_COLOR_PRESETS = [
  { label: "Zümrüt", primary: "#059669", accent: "#10b981" },
  { label: "Kurumsal Mavi", primary: "#2563eb", accent: "#3b82f6" },
  { label: "Endüstriyel", primary: "#475569", accent: "#64748b" },
  { label: "Bordo", primary: "#9f1239", accent: "#be123c" },
  { label: "Turuncu", primary: "#ea580c", accent: "#f97316" },
  { label: "Mor", primary: "#7c3aed", accent: "#8b5cf6" },
] as const;
