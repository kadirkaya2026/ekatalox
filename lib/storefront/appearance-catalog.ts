import { DEFAULT_HOMEPAGE_BLOCKS } from "@/lib/storefront/homepage-blocks";
import type {
  ProductImageBackgroundKey,
  StorefrontFooterStyleKey,
  StorefrontHeaderStyleKey,
  StorefrontLayoutKey,
  StorefrontProductCardStyle,
  StorefrontThemeKey,
  TenantStorefrontSettings,
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

export const PRODUCT_IMAGE_BACKGROUND_OPTIONS: AppearanceOption<ProductImageBackgroundKey>[] = [
  {
    key: "theme",
    title: "Tema varsayılanı",
    description: "Seçili temanın kendi hafif gradyan arka planı.",
  },
  {
    key: "white",
    title: "Beyaz",
    description: "Tüm ürün görsellerinin arkası düz beyaz olur.",
  },
  {
    key: "transparent",
    title: "Şeffaf",
    description: "Arka plan yok; görselin kendi (varsa şeffaf) alanı görünür.",
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
  {
    key: "split",
    title: "Bölünmüş",
    description: "Logo ve kategoriler solda, arama ve sepet sağda tek sırada.",
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

export const DEFAULT_STOREFRONT_APPEARANCE = {
  theme_key: "minimal",
  layout_key: "classic-grid",
  brand_primary_color: null,
  brand_accent_color: null,
  font_key: "inter",
  product_card_style: "standard",
  product_image_background: "theme",
  header_style_key: "standard",
  footer_style_key: "standard",
  homepage_blocks: DEFAULT_HOMEPAGE_BLOCKS,
} as const satisfies Pick<
  TenantStorefrontSettings,
  | "theme_key"
  | "layout_key"
  | "brand_primary_color"
  | "brand_accent_color"
  | "font_key"
  | "product_card_style"
  | "product_image_background"
  | "header_style_key"
  | "footer_style_key"
  | "homepage_blocks"
> & {
  theme_key: StorefrontThemeKey;
  layout_key: StorefrontLayoutKey;
};

export const BRAND_COLOR_PRESETS = [
  { label: "Zümrüt", primary: "#059669", accent: "#10b981" },
  { label: "Kurumsal Mavi", primary: "#2563eb", accent: "#3b82f6" },
  { label: "Endüstriyel", primary: "#475569", accent: "#64748b" },
  { label: "Bordo", primary: "#9f1239", accent: "#be123c" },
  { label: "Turuncu", primary: "#ea580c", accent: "#f97316" },
  { label: "Mor", primary: "#7c3aed", accent: "#8b5cf6" },
] as const;
