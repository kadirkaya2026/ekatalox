import type {
  StorefrontFontKey,
  StorefrontFooterStyleKey,
  StorefrontHeaderStyleKey,
  StorefrontHeroStyleKey,
  StorefrontLayoutKey,
  StorefrontProductCardStyle,
  StorefrontThemeKey,
} from "@/lib/types";

export interface StorefrontThemePreset {
  key: string;
  title: string;
  sector: string;
  sectorCode: string;
  description: string;
  demoSubdomain: string;
  thumbnailDesktop: string;
  thumbnailMobile: string;
  settings: {
    theme_key: StorefrontThemeKey;
    layout_key: StorefrontLayoutKey;
    header_style_key: StorefrontHeaderStyleKey;
    footer_style_key: StorefrontFooterStyleKey;
    product_card_style: StorefrontProductCardStyle;
    font_key: StorefrontFontKey;
    hero_style_key: StorefrontHeroStyleKey;
  };
}

export const STOREFRONT_THEME_PRESETS: StorefrontThemePreset[] = [
  {
    key: "elektronik",
    sectorCode: "telefon-aksesuar",
    title: "Elektronik & Aksesuar",
    sector: "Elektronik & Aksesuar",
    description:
      "Telefon, aksesuar ve teknoloji toptancıları için kurumsal mavi tema, geniş banner ve görsel odaklı ürün kartları.",
    demoSubdomain: "demo-elektronik",
    thumbnailDesktop: "/temalar/elektronik-desktop.jpg",
    thumbnailMobile: "/temalar/elektronik-mobile.jpg",
    settings: {
      theme_key: "pro-blue",
      layout_key: "classic-grid",
      header_style_key: "standard",
      footer_style_key: "columns",
      product_card_style: "image-forward",
      font_key: "inter",
      hero_style_key: "full-bleed",
    },
  },
  {
    key: "yapimarket",
    sectorCode: "hirdavat",
    title: "Yapı Market & Hırdavat",
    sector: "Yapı Market & Hırdavat",
    description:
      "Nalbur, hırdavat ve yapı market toptancıları için sade, yoğun grid ve minimal başlık düzeni.",
    demoSubdomain: "demo-yapimarket",
    thumbnailDesktop: "/temalar/yapimarket-desktop.jpg",
    thumbnailMobile: "/temalar/yapimarket-mobile.jpg",
    settings: {
      theme_key: "industrial",
      layout_key: "catalog-dense",
      header_style_key: "minimal",
      footer_style_key: "columns",
      product_card_style: "standard",
      font_key: "source-sans",
      hero_style_key: "text",
    },
  },
  {
    key: "gida",
    sectorCode: "gida",
    title: "Gıda & Market Toptan",
    sector: "Gıda & Market Toptan",
    description:
      "Market ve gıda toptancıları için canlı turuncu tema, kategori kenar çubuğu ve tek satır yoğun başlık.",
    demoSubdomain: "demo-gida",
    thumbnailDesktop: "/temalar/gida-desktop.jpg",
    thumbnailMobile: "/temalar/gida-mobile.jpg",
    settings: {
      theme_key: "market",
      layout_key: "sidebar-pro",
      header_style_key: "split",
      footer_style_key: "columns",
      product_card_style: "compact",
      font_key: "dm-sans",
      hero_style_key: "image-split",
    },
  },
  {
    key: "giyim",
    sectorCode: "tekstil",
    title: "Giyim & Tekstil",
    sector: "Giyim & Tekstil",
    description:
      "Tekstil ve konfeksiyon toptancıları için zarif premium tema, tam boy moda ürün kartları ve büyük vitrin görseli.",
    demoSubdomain: "demo-giyim",
    thumbnailDesktop: "/temalar/giyim-desktop.jpg",
    thumbnailMobile: "/temalar/giyim-mobile.jpg",
    // 28 Eyl 2026 (qoop/kayasoft): logo solda (standart başlık) ve moda kartı —
    // ortalı başlık müşteriye "logo kaymış" gibi görünüyordu.
    settings: {
      theme_key: "premium",
      layout_key: "classic-grid",
      header_style_key: "standard",
      footer_style_key: "columns",
      product_card_style: "fashion",
      font_key: "playfair",
      hero_style_key: "full-bleed",
    },
  },
  {
    key: "kozmetik",
    sectorCode: "kozmetik",
    title: "Kozmetik & Kişisel Bakım",
    sector: "Kozmetik & Kişisel Bakım",
    description:
      "Kozmetik ve kişisel bakım toptancıları için nötr, temiz tema ve görsel eşlikli tanıtım alanı.",
    demoSubdomain: "demo-kozmetik",
    thumbnailDesktop: "/temalar/kozmetik-desktop.jpg",
    thumbnailMobile: "/temalar/kozmetik-mobile.jpg",
    settings: {
      theme_key: "neutral",
      layout_key: "classic-grid",
      header_style_key: "centered",
      footer_style_key: "columns",
      product_card_style: "standard",
      font_key: "plus-jakarta",
      hero_style_key: "image-split",
    },
  },
  {
    key: "evyasam",
    sectorCode: "ev-mutfak",
    title: "Ev & Yaşam & Mobilya",
    sector: "Ev & Yaşam & Mobilya",
    description:
      "Ev tekstili, mobilya ve dekorasyon toptancıları için turkuaz Vitrin Pro teması ve kenar çubuklu kategori gezinme.",
    demoSubdomain: "demo-evyasam",
    thumbnailDesktop: "/temalar/evyasam-desktop.jpg",
    thumbnailMobile: "/temalar/evyasam-mobile.jpg",
    settings: {
      theme_key: "vitrin-pro",
      layout_key: "sidebar-pro",
      header_style_key: "standard",
      footer_style_key: "columns",
      product_card_style: "standard",
      font_key: "inter",
      hero_style_key: "full-bleed",
    },
  },
];

export function getStorefrontThemePreset(key: string): StorefrontThemePreset | undefined {
  return STOREFRONT_THEME_PRESETS.find((preset) => preset.key === key);
}

export const STOREFRONT_THEME_PRESET_SECTORS = STOREFRONT_THEME_PRESETS.map(
  (preset) => preset.sector,
);

/** Sektörler kullanıcı onayıyla sırayla üç temaya geçirilir. */
export function hasSectorThemeCollection(_sector: string | null | undefined) {
  void _sector;
  return false; // Özgün tasarımlar ayrı sektör editöründen yönetilir.
}

export function getSectorThemePresets(sector: string | null | undefined) {
  return STOREFRONT_THEME_PRESETS.filter((preset) => preset.sectorCode === sector);
}

export const PRESET_SETTING_KEYS = ["theme_key", "layout_key", "header_style_key", "footer_style_key", "product_card_style", "font_key", "hero_style_key"] as const;

export function matchesThemePreset(settings: object, preset: StorefrontThemePreset) {
  const values = settings as Record<string, unknown>;
  return PRESET_SETTING_KEYS.every((key) => values[key] === preset.settings[key]);
}
