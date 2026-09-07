// Esnaf (market tipi) mağazalar için ÜÇ net tema ve sektör → tema eşlemesi.
// Kayıtta otomatik uygulanır (app/api/signup), tenant panelindeki tema
// sayfası market tipi mağazalarda yalnız bu üçünü gösterir. Toptancı
// (business_type = general) mağazalar eski tema sistemini kullanmaya devam eder.
import type { TenantStorefrontSettings } from "@/lib/types";

export type EsnafThemeKey = "vitrin" | "taze" | "dukkan";

export type EsnafThemeSettings = Pick<
  TenantStorefrontSettings,
  | "theme_key"
  | "layout_key"
  | "header_style_key"
  | "footer_style_key"
  | "product_card_style"
  | "font_key"
  | "hero_style_key"
  | "product_image_background"
>;

export interface EsnafThemePreset {
  key: EsnafThemeKey;
  title: string;
  description: string;
  /** Hangi sektörlere önerildiği (etiket) */
  recommendedFor: string;
  /**
   * null = tekelsiparis tasarım şablonundan klonlanır (lib/storefront/market-template.ts).
   * Dolu = bu ayarlar doğrudan yazılır.
   */
  settings: EsnafThemeSettings | null;
}

export const ESNAF_THEME_PRESETS: EsnafThemePreset[] = [
  {
    key: "vitrin",
    title: "Vitrin",
    description: "Koyu zemin, büyük ürün kartları, kampanya şeridi. Çok ürünlü raf düzeni.",
    recommendedFor: "Market, bakkal, tekel",
    settings: null,
  },
  {
    key: "taze",
    title: "Taze",
    description: "Açık zemin, fotoğraf öne çıkar, kilo ve adet birimli ürünler için ferah kartlar.",
    recommendedFor: "Manav, kasap, çiçekçi",
    settings: {
      theme_key: "market",
      layout_key: "classic-grid",
      header_style_key: "standard",
      footer_style_key: "columns",
      product_card_style: "image-forward",
      font_key: "dm-sans",
      hero_style_key: "image-split",
      product_image_background: "white",
    },
  },
  {
    key: "dukkan",
    title: "Dükkân",
    description: "Sade ve açık; marka ve kategori odaklı, stok durumu görünür.",
    recommendedFor: "Petshop, kırtasiye, diğer",
    settings: {
      theme_key: "neutral",
      layout_key: "classic-grid",
      header_style_key: "standard",
      footer_style_key: "standard",
      product_card_style: "standard",
      font_key: "plus-jakarta",
      hero_style_key: "text",
      product_image_background: "white",
    },
  },
];

/** Kayıt formundaki sektör değeri → tema ve marka rengi. */
export const SECTOR_THEME_MAP: Record<string, { theme: EsnafThemeKey; brandPrimaryColor: string; label: string }> = {
  market: { theme: "vitrin", brandPrimaryColor: "#157A5B", label: "Market / Bakkal" },
  tekel: { theme: "vitrin", brandPrimaryColor: "#12284A", label: "Tekel Bayii" },
  manav: { theme: "taze", brandPrimaryColor: "#2E7D32", label: "Manav" },
  kasap: { theme: "taze", brandPrimaryColor: "#8B1E2D", label: "Kasap / Şarküteri" },
  cicekci: { theme: "taze", brandPrimaryColor: "#B03A6B", label: "Çiçekçi" },
  petshop: { theme: "dukkan", brandPrimaryColor: "#C7791B", label: "Petshop" },
  kirtasiye: { theme: "dukkan", brandPrimaryColor: "#2F5BB7", label: "Kırtasiye" },
  diger: { theme: "dukkan", brandPrimaryColor: "#4B5563", label: "Diğer" },
};

export const ESNAF_SECTOR_VALUES = Object.keys(SECTOR_THEME_MAP);

export function getEsnafThemePreset(key: string): EsnafThemePreset | null {
  return ESNAF_THEME_PRESETS.find((p) => p.key === key) ?? null;
}

export function getThemeForSector(sector: string): EsnafThemePreset {
  const mapped = SECTOR_THEME_MAP[sector] ?? SECTOR_THEME_MAP.diger;
  return getEsnafThemePreset(mapped.theme) ?? ESNAF_THEME_PRESETS[0];
}

/**
 * Yer tutucu logo: sektör renginde yuvarlak zemin üstünde işletme adının
 * baş harfleri. Kayıtta SVG olarak storage'a yüklenir; esnaf kendi logosunu
 * yükleyene kadar mağaza boş görünmez. Favicon için de aynı SVG kullanılır.
 */
export function buildPlaceholderLogoSvg(businessName: string, sector: string) {
  const color = (SECTOR_THEME_MAP[sector] ?? SECTOR_THEME_MAP.diger).brandPrimaryColor;
  const initials = businessName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR"))
    .join("") || "E";
  const fontSize = initials.length > 1 ? 88 : 104;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" rx="56" fill="${color}"/><text x="128" y="128" dy=".36em" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${fontSize}" fill="#FFFFFF">${initials}</text></svg>`;
}
