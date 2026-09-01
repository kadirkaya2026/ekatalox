import type { CSSProperties } from "react";
import type { StorefrontTheme } from "@/lib/storefront/themes";
import { cn } from "@/lib/utils";

export interface BrandColorSettings {
  brand_primary_color: string | null;
  brand_accent_color: string | null;
}

function normalizeHex(color: string): string {
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed.match(/^#(.)(.)(.)$/) ?? [];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

function getReadableForeground(hex: string): string {
  const normalized = normalizeHex(hex).replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#0f172a" : "#ffffff";
}

export function hasBrandColors(settings: BrandColorSettings): boolean {
  return Boolean(settings.brand_primary_color || settings.brand_accent_color);
}

export function buildBrandCssVariables(
  settings: BrandColorSettings,
): CSSProperties | undefined {
  const primary = settings.brand_primary_color
    ? normalizeHex(settings.brand_primary_color)
    : settings.brand_accent_color
      ? normalizeHex(settings.brand_accent_color)
      : null;
  const accent = settings.brand_accent_color
    ? normalizeHex(settings.brand_accent_color)
    : primary;

  if (!primary) {
    return undefined;
  }

  return {
    "--brand-primary": primary,
    "--brand-accent": accent ?? primary,
    "--brand-primary-foreground": getReadableForeground(primary),
    "--brand-accent-foreground": getReadableForeground(accent ?? primary),
    "--brand-primary-soft": `color-mix(in srgb, ${primary} 14%, transparent)`,
    "--brand-primary-soft-text": primary,
    "--brand-primary-border": `color-mix(in srgb, ${primary} 35%, transparent)`,
    "--brand-accent-soft": `color-mix(in srgb, ${accent ?? primary} 16%, transparent)`,
    "--brand-accent-soft-text": accent ?? primary,
  } as CSSProperties;
}

const brandPrimaryBg = "bg-[var(--brand-primary)]";
const brandPrimaryText = "text-[var(--brand-primary)]";
const brandPrimaryFg = "text-[var(--brand-primary-foreground)]";
const brandSoftBg = "bg-[var(--brand-primary-soft)]";
const brandSoftText = "text-[var(--brand-primary-soft-text)]";
const brandSoftBorder = "border-[var(--brand-primary-border)]";
const brandAccentSoftBg = "bg-[var(--brand-accent-soft)]";
const brandAccentSoftText = "text-[var(--brand-accent-soft-text)]";

export function applyBrandColorOverrides(
  theme: StorefrontTheme,
  settings: BrandColorSettings,
): StorefrontTheme {
  if (!hasBrandColors(settings)) {
    return theme;
  }

  return {
    ...theme,
    cartBadge: cn(brandPrimaryBg, brandPrimaryFg),
    variantBadge: cn(brandAccentSoftBg, brandAccentSoftText),
    addedVariantBadge: cn(brandAccentSoftBg, brandAccentSoftText),
    primaryButton: cn(
      brandPrimaryBg,
      brandPrimaryFg,
      "hover:opacity-90 active:opacity-95",
    ),
    stickyCartButton: cn(
      brandPrimaryBg,
      brandPrimaryFg,
      "hover:opacity-90 active:opacity-95",
    ),
    floatingCartAddButton: cn(
      theme.floatingCartAddButton,
      brandPrimaryBg,
      brandPrimaryFg,
      "border-transparent hover:opacity-90 active:opacity-95",
    ),
    quantityStepper: cn(
      theme.quantityStepper,
      "border-slate-200 bg-white shadow-sm dark:border-0 dark:bg-neutral-800",
    ),
    // Sepetteki ürünün görsel çerçevesi + butonuyla AYNI renkte olsun
    // (kullanıcı isteği, 1 Eyl 2026): marka rengi ayarlıysa çerçeve de
    // --brand-primary'den beslenir; tema accent'i devre dışı kalır.
    productImageInCartBorder: "border-[var(--brand-primary)]",
    productPrice: cn("min-w-0 font-extrabold tracking-tight", brandPrimaryText),
    gateEyebrow: cn("text-xs font-bold uppercase tracking-[0.24em]", brandPrimaryText),
    indicatorActive: cn("bg-[var(--brand-primary)]"),
    categoryNavChip: (active) =>
      cn(
        theme.categoryNavChip(active),
        active ? cn(brandSoftBg, brandSoftText, brandSoftBorder, "border") : undefined,
      ),
    categoryNavMobile: (active) =>
      cn(
        theme.categoryNavMobile(active),
        active ? cn("border-[var(--brand-primary)]", brandPrimaryText) : undefined,
      ),
    categorySubChip: (active) =>
      cn(
        theme.categorySubChip(active),
        active ? cn(brandSoftBg, brandSoftText, brandSoftBorder, "border") : undefined,
      ),
    categoryChip: (active) =>
      cn(
        theme.categoryChip(active),
        active ? cn(brandSoftBg, brandSoftText, brandSoftBorder, "border") : undefined,
      ),
    categorySidebarItem: (active) =>
      cn(
        theme.categorySidebarItem(active),
        active ? cn(brandSoftBg, brandSoftText) : undefined,
      ),
    categorySidebarChildItem: (active) =>
      cn(
        theme.categorySidebarChildItem(active),
        active ? brandPrimaryText : undefined,
      ),
    modalTabChip: (active) =>
      cn(
        theme.modalTabChip(active),
        active ? cn(brandSoftBg, brandSoftText) : undefined,
      ),
    cartPaymentCashActive: cn(
      brandSoftBg,
      brandSoftText,
      brandSoftBorder,
      "border",
    ),
  };
}
