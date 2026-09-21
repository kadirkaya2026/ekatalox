import type { StorefrontLocale } from "@/lib/storefront/i18n/dictionary";

// Şifre kapısı için tenant'a özel marka arka planı. Ayar paneline taşınana
// kadar kod içinde tutulur; subdomain eşleşmezse kapı sade görünümde kalır.
export type GateBrandingCopy = {
  eyebrow: string;
  headline: string;
  tagline: string;
  chips: string[];
  helpLine?: string;
};

export type GateBranding = {
  // public/ altındaki yatay arka plan görseli (koyu, sağ tarafta ürün)
  backgroundImage: string;
  // public/ altındaki logo işareti (beyaz, şeffaf zemin)
  logoMark: string;
  wordmark: string;
  accentColor: string;
  copy: Partial<Record<StorefrontLocale, GateBrandingCopy>> & { tr: GateBrandingCopy };
};

const GATE_BRANDING: Record<string, GateBranding> = {
  lucatech: {
    backgroundImage: "/gate/lucatech/bg.jpg",
    logoMark: "/gate/lucatech/logo-mark.png",
    wordmark: "LUCATECH",
    accentColor: "#F58220",
    copy: {
      tr: {
        eyebrow: "Bayi Portalı",
        headline: "Kaliteyi Keşfet.",
        tagline:
          "Kulaklıktan powerbank'e, şarj aletinden hoparlöre; Lucatech ürünlerinin güncel toptan fiyat listesi bayilerimize özel.",
        chips: ["Kulaklık", "Hoparlör", "Powerbank", "Şarj Aleti", "Kablo", "2 Yıl Garanti"],
        helpLine: "Şifreniz yok mu? info@lucatech.com.tr",
      },
      en: {
        eyebrow: "Dealer Portal",
        headline: "Discover Quality.",
        tagline:
          "From headphones to power banks, chargers to speakers; the current wholesale price list of Lucatech products, exclusively for our dealers.",
        chips: ["Headphones", "Speakers", "Power Banks", "Chargers", "Cables", "2-Year Warranty"],
        helpLine: "No password? info@lucatech.com.tr",
      },
      de: {
        eyebrow: "Händlerportal",
        headline: "Qualität entdecken.",
        tagline:
          "Von Kopfhörern bis Powerbanks, von Ladegeräten bis Lautsprechern; die aktuelle Großhandelspreisliste von Lucatech, exklusiv für unsere Händler.",
        chips: ["Kopfhörer", "Lautsprecher", "Powerbanks", "Ladegeräte", "Kabel", "2 Jahre Garantie"],
        helpLine: "Kein Passwort? info@lucatech.com.tr",
      },
      ru: {
        eyebrow: "Портал дилера",
        headline: "Откройте качество.",
        tagline:
          "От наушников до пауэрбанков, от зарядных устройств до колонок; актуальный оптовый прайс-лист Lucatech только для наших дилеров.",
        chips: ["Наушники", "Колонки", "Пауэрбанки", "Зарядные устройства", "Кабели", "Гарантия 2 года"],
        helpLine: "Нет пароля? info@lucatech.com.tr",
      },
    },
  },
};

export function getGateBranding(subdomain: string): GateBranding | null {
  return GATE_BRANDING[subdomain.toLowerCase()] ?? null;
}

export function getGateBrandingCopy(branding: GateBranding, locale: StorefrontLocale): GateBrandingCopy {
  return branding.copy[locale] ?? branding.copy.tr;
}
