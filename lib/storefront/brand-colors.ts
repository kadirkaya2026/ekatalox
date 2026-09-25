import type { CSSProperties } from "react";
import type { StorefrontTheme } from "@/lib/storefront/themes";
import {
  BRAND_COLOR_ROLE_KEYS,
  brandRoleCssVar,
  hasBrandPaletteColors,
  normalizeHexColor,
  resolveBrandPalette,
  type BrandColorRoleKey,
  type BrandPalette,
} from "@/lib/storefront/brand-palette";
import { cn } from "@/lib/utils";

export interface BrandColorSettings {
  brand_primary_color: string | null;
  brand_accent_color: string | null;
  /** Buton / bölüm bazlı renkler (25 Eyl 2026). Boş/undefined = yalnız
   *  eski iki renk geçerli. */
  brand_palette?: BrandPalette | null;
}

function getReadableForeground(hex: string): string {
  const normalized = normalizeHexColor(hex).replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#0f172a" : "#ffffff";
}

export function hasBrandColors(settings: BrandColorSettings): boolean {
  return Boolean(
    settings.brand_primary_color ||
      settings.brand_accent_color ||
      hasBrandPaletteColors(settings.brand_palette),
  );
}

/** Üst bar / alt bilgi / sayfa zemini: yazılar için ek "muted" ve "line"
 *  değişkenleri de üretilir. */
const SECTION_ROLES = new Set<BrandColorRoleKey>(["headerBg", "footerBg", "pageBg"]);

/**
 * Vitrin kabına (StorefrontPageShell) ve panel önizlemelerine inline style
 * olarak basılan CSS değişkenleri. Eski --brand-* değişkenleri aynen
 * korunur; her çözümlenen rol için --ek-<rol> (+ -fg, -soft, -border)
 * eklenir (25 Eyl 2026). Rol ayarlı değilse değişkeni de yoktur; tema
 * sınıfı olduğu gibi kalır.
 */
export function buildBrandCssVariables(
  settings: BrandColorSettings,
): CSSProperties | undefined {
  const vars: Record<string, string> = {};

  const primary = settings.brand_primary_color
    ? normalizeHexColor(settings.brand_primary_color)
    : settings.brand_accent_color
      ? normalizeHexColor(settings.brand_accent_color)
      : null;
  const accent = settings.brand_accent_color
    ? normalizeHexColor(settings.brand_accent_color)
    : primary;

  if (primary) {
    Object.assign(vars, {
      "--brand-primary": primary,
      "--brand-accent": accent ?? primary,
      "--brand-primary-foreground": getReadableForeground(primary),
      "--brand-accent-foreground": getReadableForeground(accent ?? primary),
      "--brand-primary-soft": `color-mix(in srgb, ${primary} 14%, transparent)`,
      "--brand-primary-soft-text": primary,
      "--brand-primary-border": `color-mix(in srgb, ${primary} 35%, transparent)`,
      "--brand-accent-soft": `color-mix(in srgb, ${accent ?? primary} 16%, transparent)`,
      "--brand-accent-soft-text": accent ?? primary,
    });
  }

  const resolved = resolveBrandPalette(settings);
  for (const key of BRAND_COLOR_ROLE_KEYS) {
    const color = resolved[key];
    if (!color) continue;
    const fg = getReadableForeground(color);
    vars[brandRoleCssVar(key)] = color;
    vars[brandRoleCssVar(key, "fg")] = fg;
    // Yarı saydam zemin/çerçeve yalnız onu kullanan rollerde (inline style
    // şişmesin).
    if (key === "activeCategory" || key === "variantBadge") {
      vars[brandRoleCssVar(key, "soft")] = `color-mix(in srgb, ${color} ${key === "variantBadge" ? 16 : 14}%, transparent)`;
    }
    if (key === "activeCategory") {
      vars[brandRoleCssVar(key, "border")] = `color-mix(in srgb, ${color} 35%, transparent)`;
    }
    if (SECTION_ROLES.has(key)) {
      vars[brandRoleCssVar(key, "muted")] = `color-mix(in srgb, ${fg} 72%, transparent)`;
      vars[brandRoleCssVar(key, "line")] = `color-mix(in srgb, ${fg} 16%, transparent)`;
    }
  }

  return Object.keys(vars).length ? (vars as CSSProperties) : undefined;
}

// Tailwind'in sınıfları derlerken görmesi için sınıf adları TAM yazılmalı
// (dinamik birleştirme yok). twMerge, CSS değişkenli text-/bg- keyfi
// sınıflarını renk olarak tanıyıp temanın renk sınıfının yerine koyar.
const roleClasses = {
  addToCart: {
    bg: "bg-[var(--ek-add-to-cart)]",
    fg: "text-[var(--ek-add-to-cart-fg)]",
    text: "text-[var(--ek-add-to-cart)]",
    border: "border-[var(--ek-add-to-cart)]",
  },
  qtyStepper: {
    bg: "bg-[var(--ek-qty-stepper)]",
    fg: "text-[var(--ek-qty-stepper-fg)]",
  },
  stickyCart: {
    bg: "bg-[var(--ek-sticky-cart)]",
    fg: "text-[var(--ek-sticky-cart-fg)]",
  },
  whatsappCheckout: {
    bg: "bg-[var(--ek-whatsapp-checkout)]",
    hoverBg: "hover:bg-[var(--ek-whatsapp-checkout)] disabled:bg-[var(--ek-whatsapp-checkout)]",
    fg: "text-[var(--ek-whatsapp-checkout-fg)]",
  },
  gateSubmit: {
    bg: "bg-[var(--ek-gate-submit)]",
    hoverBg: "hover:bg-[var(--ek-gate-submit)] disabled:bg-[var(--ek-gate-submit)]",
    fg: "text-[var(--ek-gate-submit-fg)]",
    text: "text-[var(--ek-gate-submit)]",
  },
  headerCart: {
    bg: "bg-[var(--ek-header-cart)]",
    fg: "text-[var(--ek-header-cart-fg)]",
  },
  campaignButton: {
    bg: "bg-[var(--ek-campaign-button)]",
    hoverBg: "hover:bg-[var(--ek-campaign-button)] disabled:bg-[var(--ek-campaign-button)]",
    fg: "text-[var(--ek-campaign-button-fg)]",
  },
  price: {
    text: "text-[var(--ek-price)]",
  },
  activeCategory: {
    bg: "bg-[var(--ek-active-category)]",
    fg: "text-[var(--ek-active-category-fg)]",
    text: "text-[var(--ek-active-category)]",
    border: "border-[var(--ek-active-category)]",
    soft: "bg-[var(--ek-active-category-soft)]",
    softBorder: "border-[var(--ek-active-category-border)]",
  },
  variantBadge: {
    soft: "bg-[var(--ek-variant-badge-soft)]",
    text: "text-[var(--ek-variant-badge)]",
  },
  discountBadge: {
    bg: "bg-[var(--ek-discount-badge)]",
    fg: "text-[var(--ek-discount-badge-fg)]",
  },
  headerBg: {
    bg: "bg-[var(--ek-header-bg)]",
    fg: "text-[var(--ek-header-bg-fg)]",
    muted: "text-[var(--ek-header-bg-muted)]",
    line: "border-[var(--ek-header-bg-line)]",
    hoverFg: "hover:text-[var(--ek-header-bg-fg)]",
  },
  footerBg: {
    bg: "bg-[var(--ek-footer-bg)]",
    fg: "text-[var(--ek-footer-bg-fg)]",
    muted: "text-[var(--ek-footer-bg-muted)]",
    line: "border-[var(--ek-footer-bg-line)]",
    hoverFg: "hover:text-[var(--ek-footer-bg-fg)]",
  },
  pageBg: {
    bg: "bg-[var(--ek-page-bg)]",
    fg: "text-[var(--ek-page-bg-fg)]",
  },
} as const;

// hoverBg: <Button> bileşeninin varsayılan hover:bg-emerald-700 /
// disabled:bg-emerald-300 sınıfları marka renginin üstüne biniyordu; aynı
// renk hover/disabled için de verilir, twMerge eskisini atar.
const solidButtonHover = "hover:opacity-90 active:opacity-95";

export function applyBrandColorOverrides(
  theme: StorefrontTheme,
  settings: BrandColorSettings,
  colorScheme: "light" | "dark" = "light",
): StorefrontTheme {
  if (!hasBrandColors(settings)) {
    return theme;
  }

  const resolved = resolveBrandPalette(settings);
  const has = (key: BrandColorRoleKey) => Boolean(resolved[key]);
  const next: StorefrontTheme = { ...theme };
  const c = roleClasses;

  if (has("headerCart")) {
    next.cartBadge = c.headerCart.fg;
    next.cartButtonActive = cn("border-transparent px-3", c.headerCart.bg, c.headerCart.fg);
  }

  if (has("variantBadge")) {
    next.variantBadge = cn(c.variantBadge.soft, c.variantBadge.text);
    next.addedVariantBadge = cn(c.variantBadge.soft, c.variantBadge.text);
  }

  if (has("campaignButton")) {
    next.primaryButton = cn(c.campaignButton.bg, c.campaignButton.fg, c.campaignButton.hoverBg, solidButtonHover);
    next.indicatorActive = c.campaignButton.bg;
  }

  if (has("stickyCart")) {
    next.stickyCartButton = cn(c.stickyCart.bg, c.stickyCart.fg, solidButtonHover);
  }

  if (has("whatsappCheckout")) {
    next.checkoutButton = cn(c.whatsappCheckout.bg, c.whatsappCheckout.fg, c.whatsappCheckout.hoverBg, solidButtonHover);
    // Ödeme yöntemi butonları (kullanıcı isteği, 17 Eyl 2026): seçili olan
    // sipariş butonuyla aynı dolu renkte.
    next.cartPaymentCashActive = cn("border-transparent", c.whatsappCheckout.bg, c.whatsappCheckout.fg);
    next.cartPaymentCardActive = cn("border-transparent", c.whatsappCheckout.bg, c.whatsappCheckout.fg);
  }

  if (has("gateSubmit")) {
    next.gateButton = cn(c.gateSubmit.bg, c.gateSubmit.fg, c.gateSubmit.hoverBg, solidButtonHover);
    next.gateEyebrow = cn("text-xs font-bold uppercase tracking-[0.24em]", c.gateSubmit.text);
  }

  if (has("addToCart")) {
    next.floatingCartAddButton = cn(
      theme.floatingCartAddButton,
      c.addToCart.bg,
      c.addToCart.fg,
      "border-transparent hover:opacity-90 active:opacity-95",
    );
    // Sepetteki ürünün görsel çerçevesi + butonuyla AYNI renkte olsun
    // (kullanıcı isteği, 1 Eyl 2026); ekleme anındaki çevre çizgisi de.
    next.productImageInCartBorder = c.addToCart.border;
    next.productImageSparkle = c.addToCart.text;
  }

  if (has("qtyStepper")) {
    // Sepetteki ürünün kart üstündeki +/− adım kutusu (kullanıcı isteği,
    // 16 Eyl 2026: tema accent'inde kalınca iki farklı "sepet" rengi vardı).
    next.floatingCartStepper = cn(
      c.qtyStepper.bg,
      c.qtyStepper.fg,
      "border border-white/20 shadow-lg backdrop-blur",
    );
    next.quantityStepper = cn(
      theme.quantityStepper,
      "border-slate-200 bg-white shadow-sm dark:border-0 dark:bg-neutral-800",
    );
  }

  if (has("price")) {
    next.productPrice = cn("min-w-0 font-extrabold tracking-tight", c.price.text);
  }

  if (has("discountBadge")) {
    next.discountBadge = cn(c.discountBadge.bg, c.discountBadge.fg);
    next.discountBadgeStrong = cn(c.discountBadge.bg, c.discountBadge.fg);
  }

  // Koyu temada yarı saydam "soft" chip, temanın kendi koyu yeşil zemininin
  // üstüne biniyor ve mavi yazıyla okunmuyordu (kullanıcı isteği, 17 Eyl
  // 2026): koyu temada aktif kategori chip'i dolu marka rengi + ön renk.
  const categoryColored = has("activeCategory");
  const activeChip =
    colorScheme === "dark"
      ? cn(c.activeCategory.bg, c.activeCategory.fg, "border border-transparent")
      : cn(c.activeCategory.soft, c.activeCategory.text, c.activeCategory.softBorder, "border");

  // Bölüm zeminleri yalnız açık temada (gece modu / Noir'de temanın koyu
  // renkleri korunur). Üst bar zemini değişince içindeki yazılar da
  // okunur ön renge döner.
  const sectionsEnabled = colorScheme === "light" && !theme.isDark;
  const headerColored = sectionsEnabled && has("headerBg");
  const footerColored = sectionsEnabled && has("footerBg");
  const pageColored = sectionsEnabled && has("pageBg");

  if (categoryColored || headerColored) {
    next.categoryNavChip = (active) =>
      cn(
        theme.categoryNavChip(active),
        !active && headerColored ? cn(c.headerBg.muted, c.headerBg.hoverFg, "hover:bg-transparent") : undefined,
        active && categoryColored ? activeChip : undefined,
      );
    next.categoryNavMobile = (active) =>
      cn(
        theme.categoryNavMobile(active),
        headerColored ? (active ? c.headerBg.fg : c.headerBg.muted) : undefined,
        active && categoryColored
          ? colorScheme === "dark"
            ? cn(c.activeCategory.bg, c.activeCategory.fg)
            : cn(c.activeCategory.border, c.activeCategory.text)
          : undefined,
      );
  }

  if (categoryColored) {
    next.categorySubChip = (active) =>
      cn(theme.categorySubChip(active), active ? activeChip : undefined);
    next.categoryChip = (active) =>
      cn(theme.categoryChip(active), active ? activeChip : undefined);
    next.categorySidebarItem = (active) =>
      cn(
        theme.categorySidebarItem(active),
        active ? cn(c.activeCategory.soft, c.activeCategory.text) : undefined,
      );
    next.categorySidebarChildItem = (active) =>
      cn(theme.categorySidebarChildItem(active), active ? c.activeCategory.text : undefined);
    next.modalTabChip = (active) =>
      cn(
        theme.modalTabChip(active),
        active ? cn(c.activeCategory.soft, c.activeCategory.text) : undefined,
      );
  }

  if (headerColored) {
    // bg-none: bazı temalarda zemin gradyan (background-image) — rengi örtmesin.
    next.header = cn(theme.header, "bg-none", c.headerBg.bg, c.headerBg.fg);
    next.headerBorder = cn(theme.headerBorder, c.headerBg.line);
    next.headerTitle = cn(theme.headerTitle, c.headerBg.fg);
    next.headerMuted = c.headerBg.muted;
    next.cartTotalLabel = c.headerBg.muted;
    next.cartTotalValue = cn(theme.cartTotalValue, c.headerBg.fg);
    next.cartTotalEmpty = cn(theme.cartTotalEmpty, c.headerBg.muted);
    next.categoryRailBorder = cn(theme.categoryRailBorder, c.headerBg.line);
  }

  if (footerColored) {
    next.footerShell = cn(theme.footerShell, "bg-none", c.footerBg.bg, c.footerBg.fg, c.footerBg.line);
    next.footerHeading = cn(theme.footerHeading, c.footerBg.fg);
    next.footerText = cn(theme.footerText, c.footerBg.muted);
    next.footerLink = cn(theme.footerLink, c.footerBg.fg, c.footerBg.hoverFg);
  }

  if (pageColored) {
    // bg-none: premium temadaki gradyan zemin rengi örtmesin.
    next.page = cn(theme.page, "bg-none", c.pageBg.bg);
  }

  return next;
}
