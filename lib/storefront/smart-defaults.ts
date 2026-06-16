import type {
  StorefrontFontKey,
  StorefrontLayoutKey,
  StorefrontThemeKey,
} from "@/lib/types";

const THEME_ROTATION: StorefrontThemeKey[] = [
  "minimal",
  "pro-blue",
  "neutral",
  "industrial",
  "premium",
  "catalog-first",
];

const LAYOUT_ROTATION: StorefrontLayoutKey[] = [
  "classic-grid",
  "catalog-dense",
  "catalog-list",
  "sidebar-pro",
];

const FONT_ROTATION: StorefrontFontKey[] = [
  "inter",
  "dm-sans",
  "plus-jakarta",
  "source-sans",
  "playfair",
];

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export interface SmartDefaultAppearance {
  theme_key: StorefrontThemeKey;
  layout_key: StorefrontLayoutKey;
  font_key: StorefrontFontKey;
}

export function getSmartDefaultAppearance(seed: string): SmartDefaultAppearance {
  const hash = hashString(seed.toLowerCase().trim());
  return {
    theme_key: THEME_ROTATION[hash % THEME_ROTATION.length],
    layout_key: LAYOUT_ROTATION[(hash >> 3) % LAYOUT_ROTATION.length],
    font_key: FONT_ROTATION[(hash >> 6) % FONT_ROTATION.length],
  };
}
