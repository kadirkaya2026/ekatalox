import type { StorefrontThemeKey } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface StorefrontTheme {
  page: string;
  header: string;
  headerBorder: string;
  headerTitle: string;
  headerMuted: string;
  headerIconButton: string;
  logoWrap: string;
  logoPlaceholder: string;
  cartBadge: string;
  cartButton: string;
  cartTotalLabel: string;
  cartTotalValue: string;
  cartTotalEmpty: string;
  categoryRailBorder: string;
  categoryNavChip: (active: boolean) => string;
  categoryNavMobile: (active: boolean) => string;
  categorySubChip: (active: boolean) => string;
  categoryDropdown: string;
  categoryDropdownItem: string;
  categoryRail: string;
  categoryChip: (active: boolean) => string;
  categorySidebar: string;
  categorySidebarTitle: string;
  categorySidebarItem: (active: boolean) => string;
  categorySidebarChildItem: (active: boolean) => string;
  searchWrap: string;
  searchInput: string;
  searchIcon: string;
  productCard: string;
  productImageWrap: string;
  productTitle: string;
  productMeta: string;
  productPrice: string;
  productPriceOriginal: string;
  productOutOverlay: string;
  stockBadgeIn: string;
  stockBadgeOut: string;
  variantBadge: string;
  addedVariantBadge: string;
  primaryButton: string;
  stickyCart: string;
  stickyCartText: string;
  stickyCartButton: string;
  cartDrawerOverlay: string;
  cartDrawerPanel: string;
  cartDrawerHandle: string;
  cartDrawerHeaderBorder: string;
  cartDrawerTitle: string;
  cartDrawerMuted: string;
  cartDrawerCloseButton: string;
  cartDrawerItem: string;
  cartDrawerSummary: string;
  modalOverlay: string;
  modalPanel: string;
  modalHeaderBorder: string;
  modalTitle: string;
  modalCloseButton: string;
  modalFooterBorder: string;
  modalSurface: string;
  modalTabChip: (active: boolean) => string;
  floatingCartStepper: string;
  floatingCartAddButton: string;
  gateEyebrow: string;
  gateCard: string;
  gateTitle: string;
  gateDescription: string;
  gateError: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
}

interface ThemeAccent {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryForeground: string;
  soft: string;
  softText: string;
  softBorder: string;
  ring: string;
  borderFocus: string;
  titleHover: string;
  price: string;
  priceOriginal: string;
  stepper: string;
  stickyBar: string;
  stickyBarBorder: string;
  stickyButton: string;
  stickyButtonHover: string;
  navMobileActive: string;
  subChipActive: string;
  floatingAddBorder: string;
  floatingAddBg: string;
  floatingAddHover: string;
}

interface ThemeNeutrals {
  page: string;
  pageText: string;
  header: string;
  headerBorder: string;
  headerRailBorder: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  chipActiveBg: string;
  chipActiveText: string;
  chipInactive: string;
  chipInactiveBorder: string;
  imageGradient: string;
  cartSummary: string;
  cartSummaryText: string;
  modalSurface: string;
  gatePage: string;
}

function buildTheme(neutrals: ThemeNeutrals, accent: ThemeAccent): StorefrontTheme {
  return {
    page: cn(
      "min-h-screen w-full max-w-full overflow-x-hidden pb-28 xl:pb-6",
      neutrals.page,
      neutrals.pageText,
    ),
    header: cn("sticky top-0 z-40 backdrop-blur", neutrals.header),
    headerBorder: neutrals.headerBorder,
    headerTitle: cn("truncate font-semibold tracking-tight", neutrals.text),
    headerMuted: neutrals.textMuted,
    headerIconButton: cn(
      "flex items-center justify-center rounded-2xl border shadow-sm transition",
      neutrals.border,
      neutrals.surface,
      "text-slate-700 hover:border-slate-300 hover:bg-slate-50 lg:size-12",
    ),
    logoWrap: cn(
      "relative flex shrink-0 items-center justify-center overflow-hidden rounded-[1.4rem] border shadow-sm lg:rounded-[1.75rem]",
      neutrals.border,
      neutrals.surface,
    ),
    logoPlaceholder: "text-slate-400",
    cartBadge: cn(
      "absolute -right-2 -top-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
      accent.primary,
      accent.primaryForeground,
    ),
    cartButton: cn(
      "relative flex size-11 items-center justify-center rounded-2xl border shadow-sm transition lg:size-12",
      neutrals.border,
      neutrals.surface,
      "text-slate-700 hover:border-slate-300 hover:bg-slate-50",
    ),
    cartTotalLabel: neutrals.textMuted,
    cartTotalValue: cn("text-sm font-bold", neutrals.text),
    cartTotalEmpty: "text-sm font-bold text-slate-400",
    categoryRailBorder: neutrals.headerRailBorder,
    categoryNavChip: (active) =>
      cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition duration-200",
        active
          ? cn("scale-[1.03] font-bold shadow-sm", neutrals.chipActiveBg, neutrals.chipActiveText)
          : neutrals.chipInactive,
      ),
    categoryNavMobile: (active) =>
      cn(
        "shrink-0 border-b-2 px-1 pb-3 text-sm font-semibold transition duration-200",
        active
          ? cn("font-bold", accent.navMobileActive, neutrals.text)
          : cn("border-transparent", neutrals.textMuted),
      ),
    categorySubChip: (active) =>
      cn(
        "shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition duration-200",
        active
          ? cn("shadow-sm", accent.subChipActive)
          : cn(neutrals.chipInactiveBorder, neutrals.surface, "text-slate-700"),
      ),
    categoryDropdown: cn(
      "min-w-[220px] rounded-2xl border p-2 shadow-xl",
      neutrals.border,
      neutrals.surface,
    ),
    categoryDropdownItem:
      "w-full rounded-xl px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50",
    categoryRail:
      "flex max-w-full gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none whitespace-nowrap lg:flex-wrap lg:overflow-visible lg:whitespace-normal",
    categoryChip: (active) =>
      cn(
        "rounded-full px-5 py-2.5 text-sm font-semibold transition shadow-sm",
        active
          ? cn(neutrals.chipActiveBg, neutrals.chipActiveText)
          : cn(neutrals.surface, neutrals.chipInactiveBorder, "text-slate-700 hover:bg-slate-50"),
      ),
    categorySidebar: cn(
      "sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-2xl border p-3 shadow-sm",
      neutrals.border,
      neutrals.surface,
    ),
    categorySidebarTitle: cn(
      "px-3 pb-2 text-xs font-bold uppercase tracking-[0.18em]",
      neutrals.textMuted,
    ),
    categorySidebarItem: (active) =>
      cn(
        "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
        active
          ? cn(neutrals.chipActiveBg, neutrals.chipActiveText)
          : "text-slate-700 hover:bg-slate-50",
      ),
    categorySidebarChildItem: (active) =>
      cn(
        "flex w-full items-center rounded-lg py-2 pl-6 pr-3 text-left text-[13px] font-medium transition",
        active
          ? cn("font-semibold", accent.softText, accent.soft)
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      ),
    searchWrap: cn("relative rounded-2xl shadow-sm border", neutrals.border, neutrals.surface),
    searchInput: cn("rounded-2xl", accent.ring, accent.borderFocus),
    searchIcon: cn("absolute left-4 top-1/2 -translate-y-1/2 size-5", neutrals.textMuted),
    productCard: cn(
      "group min-w-0 flex h-full flex-col overflow-hidden rounded-[1.75rem] border shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(15,23,42,0.12)]",
      neutrals.border,
      neutrals.surface,
      "hover:border-slate-300",
    ),
    productImageWrap: cn(
      "relative aspect-square w-full overflow-hidden",
      neutrals.imageGradient,
    ),
    productTitle: cn(
      "min-w-0 break-words font-semibold leading-5 transition duration-150 line-clamp-2 sm:text-[14px] text-[13px]",
      neutrals.text,
      accent.titleHover,
    ),
    productMeta: cn("min-w-0 text-xs line-clamp-2", neutrals.textMuted),
    productPrice: cn("min-w-0 font-extrabold tracking-tight", accent.price),
    productPriceOriginal: cn("font-medium line-through", accent.priceOriginal),
    productOutOverlay: "absolute inset-x-0 bottom-0 z-10 bg-slate-950/72 px-2 py-1.5 text-center backdrop-blur-sm",
    stockBadgeIn: cn(
      "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold",
      accent.soft,
      accent.softText,
    ),
    stockBadgeOut:
      "inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 shadow-sm",
    variantBadge: "bg-blue-50 px-2 py-1 text-[10px] text-blue-700",
    addedVariantBadge: cn("px-2 py-1 text-[10px]", accent.soft, accent.softText),
    primaryButton: cn(
      "rounded-xl shadow-sm transition font-bold",
      accent.primary,
      accent.primaryHover,
      accent.primaryActive,
      accent.primaryForeground,
    ),
    stickyCart: cn(
      "fixed bottom-4 inset-x-4 z-40 rounded-2xl p-4 shadow-[0_16px_40px_rgba(15,23,42,0.16)] md:bottom-6 max-w-lg mx-auto border",
      accent.stickyBar,
      accent.stickyBarBorder,
    ),
    stickyCartText: "text-white font-bold",
    stickyCartButton: cn(
      "rounded-xl transition px-5 py-3 font-bold",
      accent.stickyButton,
      accent.stickyButtonHover,
    ),
    cartDrawerOverlay: "fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md",
    cartDrawerPanel: cn(
      "absolute inset-x-0 bottom-0 z-10 max-h-[94dvh] rounded-t-[2rem] shadow-[0_-24px_80px_rgba(15,23,42,0.22)] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:max-h-none lg:w-[460px] lg:rounded-l-[2rem] lg:rounded-tr-none",
      neutrals.surface,
    ),
    cartDrawerHandle: "h-1.5 w-14 rounded-full bg-slate-200",
    cartDrawerHeaderBorder: cn("border-b", neutrals.headerRailBorder),
    cartDrawerTitle: cn("truncate text-xl font-bold tracking-tight sm:text-2xl", neutrals.text),
    cartDrawerMuted: neutrals.textMuted,
    cartDrawerCloseButton:
      "flex size-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100",
    cartDrawerItem: cn(
      "min-w-0 rounded-[1.55rem] border p-3.5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]",
      neutrals.border,
      neutrals.surfaceMuted,
    ),
    cartDrawerSummary: cn("rounded-xl p-3", neutrals.cartSummary, neutrals.cartSummaryText),
    modalOverlay: "fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center",
    modalPanel: cn(
      "relative z-10 mx-auto flex w-full min-w-0 max-w-2xl flex-col overflow-hidden",
      neutrals.surface,
    ),
    modalHeaderBorder: cn("border-b", neutrals.headerRailBorder),
    modalTitle: cn("text-lg font-semibold", neutrals.text),
    modalCloseButton:
      "rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900",
    modalFooterBorder: cn("border-t", neutrals.headerRailBorder),
    modalSurface: cn("rounded-[1.35rem] border p-4", neutrals.border, neutrals.modalSurface),
    modalTabChip: (active) =>
      cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
        active
          ? cn(neutrals.chipActiveBg, neutrals.chipActiveText)
          : cn(neutrals.chipInactiveBorder, neutrals.surface, "text-slate-600"),
      ),
    floatingCartStepper: accent.stepper,
    floatingCartAddButton: cn(
      "flex items-center justify-center rounded-xl border text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition-all duration-200",
      accent.floatingAddBorder,
      accent.floatingAddBg,
      accent.floatingAddHover,
    ),
    gateEyebrow: cn("text-xs font-semibold uppercase tracking-[0.24em]", accent.softText),
    gateCard: cn("w-full max-w-md rounded-2xl border p-6 shadow-sm", neutrals.border, neutrals.surface),
    gateTitle: cn("mt-3 text-2xl font-semibold", neutrals.text),
    gateDescription: cn("mt-2 text-sm leading-6", neutrals.textMuted),
    gateError: neutrals.textMuted,
    surface: neutrals.surface,
    surfaceMuted: neutrals.surfaceMuted,
    border: neutrals.border,
    text: neutrals.text,
    textMuted: neutrals.textMuted,
  };
}

const minimalNeutrals: ThemeNeutrals = {
  page: "bg-slate-50",
  pageText: "text-slate-900",
  header: "border-b border-slate-200/80 bg-white/95",
  headerBorder: "border-slate-200/80",
  headerRailBorder: "border-slate-100",
  surface: "bg-white",
  surfaceMuted: "bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]",
  border: "border-slate-200/80",
  text: "text-slate-950",
  textMuted: "text-slate-400",
  chipActiveBg: "bg-slate-900 text-white",
  chipActiveText: "text-white",
  chipInactive: "text-slate-700 hover:bg-slate-100",
  chipInactiveBorder: "border-slate-200",
  imageGradient: "bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]",
  cartSummary: "bg-slate-900",
  cartSummaryText: "text-white",
  modalSurface: "bg-slate-50/80",
  gatePage: "bg-slate-50 text-slate-900",
};

const minimalAccent: ThemeAccent = {
  primary: "bg-emerald-600",
  primaryHover: "hover:bg-emerald-700",
  primaryActive: "active:bg-emerald-800",
  primaryForeground: "text-white",
  soft: "bg-emerald-50",
  softText: "text-emerald-700",
  softBorder: "border-emerald-400/30",
  ring: "focus:ring-2 focus:ring-emerald-500/20",
  borderFocus: "focus:border-emerald-500",
  titleHover: "group-hover:text-emerald-700",
  price: "text-emerald-600",
  priceOriginal: "text-slate-400",
  stepper:
    "border border-emerald-400/30 bg-[linear-gradient(180deg,rgba(16,185,129,0.98)_0%,rgba(5,150,105,0.96)_100%)] text-white shadow-[0_18px_40px_rgba(5,150,105,0.34)] backdrop-blur",
  stickyBar: "bg-slate-900 text-white",
  stickyBarBorder: "border-white/10",
  stickyButton: "bg-emerald-600 hover:bg-emerald-700 text-white",
  stickyButtonHover: "hover:bg-emerald-700",
  navMobileActive: "border-emerald-600",
  subChipActive: "border-emerald-600 bg-emerald-600 text-white",
  floatingAddBorder: "border-emerald-600",
  floatingAddBg: "bg-emerald-500",
  floatingAddHover: "hover:border-emerald-500 hover:bg-emerald-400",
};

const proBlueAccent: ThemeAccent = {
  primary: "bg-blue-600",
  primaryHover: "hover:bg-blue-700",
  primaryActive: "active:bg-blue-800",
  primaryForeground: "text-white",
  soft: "bg-blue-50",
  softText: "text-blue-700",
  softBorder: "border-blue-400/30",
  ring: "focus:ring-2 focus:ring-blue-500/20",
  borderFocus: "focus:border-blue-500",
  titleHover: "group-hover:text-blue-700",
  price: "text-blue-600",
  priceOriginal: "text-slate-400",
  stepper:
    "border border-blue-400/30 bg-[linear-gradient(180deg,rgba(37,99,235,0.98)_0%,rgba(29,78,216,0.96)_100%)] text-white shadow-[0_18px_40px_rgba(29,78,216,0.34)] backdrop-blur",
  stickyBar: "bg-slate-900 text-white",
  stickyBarBorder: "border-blue-500/20",
  stickyButton: "bg-blue-600 hover:bg-blue-700 text-white",
  stickyButtonHover: "hover:bg-blue-700",
  navMobileActive: "border-blue-600",
  subChipActive: "border-blue-600 bg-blue-600 text-white",
  floatingAddBorder: "border-blue-600",
  floatingAddBg: "bg-blue-500",
  floatingAddHover: "hover:border-blue-500 hover:bg-blue-400",
};

const neutralNeutrals: ThemeNeutrals = {
  ...minimalNeutrals,
  page: "bg-zinc-50",
  chipActiveBg: "bg-slate-900 text-white",
  imageGradient: "bg-[linear-gradient(180deg,#fafafa_0%,#f4f4f5_100%)]",
};

const neutralAccent: ThemeAccent = {
  primary: "bg-slate-900",
  primaryHover: "hover:bg-slate-800",
  primaryActive: "active:bg-slate-950",
  primaryForeground: "text-white",
  soft: "bg-slate-100",
  softText: "text-slate-700",
  softBorder: "border-slate-400/30",
  ring: "focus:ring-2 focus:ring-slate-500/20",
  borderFocus: "focus:border-slate-900",
  titleHover: "group-hover:text-slate-700",
  price: "text-slate-950",
  priceOriginal: "text-slate-400",
  stepper:
    "border border-slate-400/30 bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(30,41,59,0.96)_100%)] text-white shadow-[0_18px_40px_rgba(15,23,42,0.34)] backdrop-blur",
  stickyBar: "bg-slate-900 text-white",
  stickyBarBorder: "border-white/10",
  stickyButton: "bg-slate-900 hover:bg-slate-800 text-white",
  stickyButtonHover: "hover:bg-slate-800",
  navMobileActive: "border-slate-900",
  subChipActive: "border-slate-900 bg-slate-900 text-white",
  floatingAddBorder: "border-slate-900",
  floatingAddBg: "bg-slate-800",
  floatingAddHover: "hover:border-slate-700 hover:bg-slate-700",
};

export const storefrontThemes: Record<StorefrontThemeKey, StorefrontTheme> = {
  minimal: buildTheme(minimalNeutrals, minimalAccent),
  "pro-blue": buildTheme(minimalNeutrals, proBlueAccent),
  neutral: buildTheme(neutralNeutrals, neutralAccent),
};

const legacyThemeKeys = new Set(["premium-dark", "soft-commerce"]);

export function resolveStorefrontThemeKey(key: string): StorefrontThemeKey {
  if (key in storefrontThemes) {
    return key as StorefrontThemeKey;
  }

  if (legacyThemeKeys.has(key)) {
    return "minimal";
  }

  return "minimal";
}

export function getStorefrontTheme(key: string): StorefrontTheme {
  return storefrontThemes[resolveStorefrontThemeKey(key)];
}

/** @deprecated Use StorefrontTheme */
export type StorefrontThemeClasses = StorefrontTheme;
