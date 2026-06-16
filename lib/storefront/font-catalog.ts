import type { StorefrontFontKey } from "@/lib/types";

export interface StorefrontFontOption {
  key: StorefrontFontKey;
  title: string;
  description: string;
  className: string;
  cssVariable: string;
}

export const FONT_OPTIONS: StorefrontFontOption[] = [
  {
    key: "inter",
    title: "Inter",
    description: "Modern ve okunaklı varsayılan font.",
    className: "font-sans",
    cssVariable: "var(--font-inter)",
  },
  {
    key: "dm-sans",
    title: "DM Sans",
    description: "Yumuşak geometrik B2B vitrin fontu.",
    className: "font-dm-sans",
    cssVariable: "var(--font-dm-sans)",
  },
  {
    key: "plus-jakarta",
    title: "Plus Jakarta Sans",
    description: "Dinamik ve çağdaş kurumsal görünüm.",
    className: "font-plus-jakarta",
    cssVariable: "var(--font-plus-jakarta)",
  },
  {
    key: "source-sans",
    title: "Source Sans 3",
    description: "Klasik ve güvenilir katalog tipografisi.",
    className: "font-source-sans",
    cssVariable: "var(--font-source-sans)",
  },
  {
    key: "playfair",
    title: "Playfair Display",
    description: "Premium ve vitrin odaklı serif başlıklar.",
    className: "font-playfair",
    cssVariable: "var(--font-playfair)",
  },
];

const fontByKey = new Map(FONT_OPTIONS.map((option) => [option.key, option]));

export function resolveStorefrontFontKey(key: string | null | undefined): StorefrontFontKey {
  if (key && fontByKey.has(key as StorefrontFontKey)) {
    return key as StorefrontFontKey;
  }
  return "inter";
}

export function getStorefrontFontOption(key: string | null | undefined): StorefrontFontOption {
  return fontByKey.get(resolveStorefrontFontKey(key)) ?? FONT_OPTIONS[0];
}
