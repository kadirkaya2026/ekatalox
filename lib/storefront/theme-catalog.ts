import type { StorefrontThemeKey } from "@/lib/types";

export interface StorefrontThemeOption {
  key: StorefrontThemeKey;
  title: string;
  description: string;
}

export const THEME_OPTIONS: StorefrontThemeOption[] = [
  {
    key: "minimal",
    title: "Minimal",
    description: "Temiz, ferah ve sade e-ticaret vitrin dili.",
  },
  {
    key: "pro-blue",
    title: "Pro Blue",
    description: "Kurumsal mavi vurgularla profesyonel B2B vitrin.",
  },
  {
    key: "neutral",
    title: "Neutral",
    description: "Nötr tonlar, sade tipografi ve minimal vurgu.",
  },
  {
    key: "industrial",
    title: "Endüstriyel",
    description: "Koyu header ve güçlü B2B katalog hissi.",
  },
  {
    key: "premium",
    title: "Premium",
    description: "Geniş boşluklar ve sofistike tipografi.",
  },
  {
    key: "catalog-first",
    title: "Katalog Odaklı",
    description: "Banner yerine doğrudan ürün grid’i vurgusu.",
  },
  {
    key: "market",
    title: "Market Vitrini",
    description: "Market/hızlı teslimat uygulamaları gibi sade, canlı ve net.",
  },
  {
    key: "vitrin-pro",
    title: "Vitrin Pro",
    description: "Kurumsal e-ticaret sitesi hissi veren temiz, düzenli vitrin.",
  },
];
