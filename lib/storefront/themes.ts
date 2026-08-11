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
  categoryNavGap: string;
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
  showProductModelNo: boolean;
  productThumbText: string;
  productThumbMeta: string;
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
  productThumbSurface: string;
  activeTileBg: string;
  activeTileText: string;
  border: string;
  text: string;
  textMuted: string;
  footerShell: string;
  footerHeading: string;
  footerText: string;
  footerLink: string;
  quantityStepper: string;
  quantityStepperButton: string;
  quantityInput: string;
  panelSurface: string;
  emptyImage: string;
  prose: string;
  proseHeading: string;
  proseBlockquote: string;
  proseTableHead: string;
  proseTableCell: string;
  proseHeadingBlock: string;
  proseBlockquoteBlock: string;
  proseTableHeadBlock: string;
  proseTableCellBlock: string;
  elevation1: string;
  elevation2: string;
  surfaceRing: string;
  pageGradient: string;
  campaignBarQualified: string;
  campaignBarPending: string;
  campaignIconQualified: string;
  campaignIconPending: string;
  campaignLabelQualified: string;
  campaignLabelPending: string;
  campaignNoteQualified: string;
  campaignNotePending: string;
  indicatorActive: string;
  indicatorInactive: string;
  cartSummaryMuted: string;
  textTertiary: string;
  formField: string;
  bannerOverlay: string;
  sectionDivider: string;
  cartPaymentCashActive: string;
  cartPaymentCardActive: string;
  cartPaymentInactive: string;
  cartInstallmentActive: string;
  modalHandle: string;
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
  chipActiveBgDark: string;
  chipActiveTextDark: string;
  pageGradientDark: string;
  campaignBarQualifiedDark: string;
  campaignBarPendingDark: string;
  campaignIconQualifiedDark: string;
  campaignIconPendingDark: string;
  campaignLabelQualifiedDark: string;
  campaignLabelPendingDark: string;
  campaignBarQualifiedLight: string;
  campaignBarPendingLight: string;
  campaignIconQualifiedLight: string;
  campaignIconPendingLight: string;
  campaignLabelQualifiedLight: string;
  campaignLabelPendingLight: string;
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

export type StorefrontColorScheme = "light" | "dark";

function resolveAccent(
  accent: ThemeAccent,
  colorScheme: StorefrontColorScheme,
  themeKey: StorefrontThemeKey,
): ThemeAccent {
  const darkSoftByTheme: Record<
    StorefrontThemeKey,
    Pick<
      ThemeAccent,
      | "soft"
      | "softText"
      | "titleHover"
      | "price"
      | "priceOriginal"
      | "chipActiveBgDark"
      | "chipActiveTextDark"
      | "pageGradientDark"
      | "campaignBarQualifiedDark"
      | "campaignBarPendingDark"
      | "campaignIconQualifiedDark"
      | "campaignIconPendingDark"
      | "campaignLabelQualifiedDark"
      | "campaignLabelPendingDark"
    >
  > = {
    minimal: {
      soft: "bg-emerald-950/50",
      softText: "text-emerald-300",
      titleHover: "group-hover:text-emerald-300",
      price: "text-emerald-300",
      priceOriginal: "text-neutral-300",
      chipActiveBgDark: "bg-emerald-900/70",
      chipActiveTextDark: "text-white",
      pageGradientDark:
        "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.08),transparent)]",
      campaignBarQualifiedDark:
        "border-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_42%),linear-gradient(135deg,rgba(6,24,20,0.96)_0%,rgba(10,10,10,0.98)_50%,rgba(6,30,24,0.96)_100%)]",
      campaignBarPendingDark:
        "border-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.1),transparent_42%),linear-gradient(135deg,rgba(30,20,10,0.96)_0%,rgba(10,10,10,0.98)_48%,rgba(15,25,35,0.96)_100%)]",
      campaignIconQualifiedDark: "bg-emerald-950/60 text-emerald-300",
      campaignIconPendingDark: "bg-amber-950/50 text-amber-300",
      campaignLabelQualifiedDark: "text-emerald-400",
      campaignLabelPendingDark: "text-amber-400",
    },
    "pro-blue": {
      soft: "bg-blue-950/50",
      softText: "text-blue-300",
      titleHover: "group-hover:text-blue-300",
      price: "text-blue-300",
      priceOriginal: "text-neutral-300",
      chipActiveBgDark: "bg-blue-900/70",
      chipActiveTextDark: "text-white",
      pageGradientDark:
        "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.08),transparent)]",
      campaignBarQualifiedDark:
        "border-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_42%),linear-gradient(135deg,rgba(10,20,40,0.96)_0%,rgba(10,10,10,0.98)_50%,rgba(10,25,45,0.96)_100%)]",
      campaignBarPendingDark:
        "border-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.1),transparent_42%),linear-gradient(135deg,rgba(30,20,10,0.96)_0%,rgba(10,10,10,0.98)_48%,rgba(15,25,35,0.96)_100%)]",
      campaignIconQualifiedDark: "bg-blue-950/60 text-blue-300",
      campaignIconPendingDark: "bg-amber-950/50 text-amber-300",
      campaignLabelQualifiedDark: "text-blue-400",
      campaignLabelPendingDark: "text-amber-400",
    },
    neutral: {
      soft: "bg-neutral-800",
      softText: "text-neutral-300",
      titleHover: "group-hover:text-neutral-200",
      price: "text-neutral-100",
      priceOriginal: "text-neutral-300",
      chipActiveBgDark: "bg-neutral-500",
      chipActiveTextDark: "text-neutral-50",
      pageGradientDark:
        "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(64,64,64,0.15),transparent)]",
      campaignBarQualifiedDark:
        "border-0 bg-[linear-gradient(135deg,rgba(38,38,38,0.98)_0%,rgba(10,10,10,0.98)_50%,rgba(30,30,30,0.98)_100%)]",
      campaignBarPendingDark:
        "border-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.1),transparent_42%),linear-gradient(135deg,rgba(30,20,10,0.96)_0%,rgba(10,10,10,0.98)_48%,rgba(15,25,35,0.96)_100%)]",
      campaignIconQualifiedDark: "bg-neutral-700 text-neutral-200",
      campaignIconPendingDark: "bg-amber-950/50 text-amber-300",
      campaignLabelQualifiedDark: "text-neutral-300",
      campaignLabelPendingDark: "text-amber-400",
    },
    industrial: {
      soft: "bg-zinc-800",
      softText: "text-zinc-300",
      titleHover: "group-hover:text-zinc-200",
      price: "text-zinc-300",
      priceOriginal: "text-neutral-300",
      chipActiveBgDark: "bg-zinc-700",
      chipActiveTextDark: "text-white",
      pageGradientDark:
        "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(82,82,91,0.18),transparent)]",
      campaignBarQualifiedDark:
        "border-0 bg-[linear-gradient(135deg,rgba(39,39,42,0.98)_0%,rgba(10,10,10,0.98)_50%,rgba(24,24,27,0.98)_100%)]",
      campaignBarPendingDark:
        "border-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.1),transparent_42%),linear-gradient(135deg,rgba(30,20,10,0.96)_0%,rgba(10,10,10,0.98)_48%,rgba(15,25,35,0.96)_100%)]",
      campaignIconQualifiedDark: "bg-zinc-700 text-zinc-200",
      campaignIconPendingDark: "bg-amber-950/50 text-amber-300",
      campaignLabelQualifiedDark: "text-zinc-300",
      campaignLabelPendingDark: "text-amber-400",
    },
    premium: {
      soft: "bg-stone-800",
      softText: "text-stone-300",
      titleHover: "group-hover:text-stone-200",
      price: "text-stone-300",
      priceOriginal: "text-neutral-300",
      chipActiveBgDark: "bg-stone-700",
      chipActiveTextDark: "text-white",
      pageGradientDark:
        "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,113,108,0.15),transparent)]",
      campaignBarQualifiedDark:
        "border-0 bg-[linear-gradient(135deg,rgba(41,37,36,0.98)_0%,rgba(10,10,10,0.98)_50%,rgba(28,25,23,0.98)_100%)]",
      campaignBarPendingDark:
        "border-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.1),transparent_42%),linear-gradient(135deg,rgba(30,20,10,0.96)_0%,rgba(10,10,10,0.98)_48%,rgba(15,25,35,0.96)_100%)]",
      campaignIconQualifiedDark: "bg-stone-700 text-stone-200",
      campaignIconPendingDark: "bg-amber-950/50 text-amber-300",
      campaignLabelQualifiedDark: "text-stone-300",
      campaignLabelPendingDark: "text-amber-400",
    },
    "catalog-first": {
      soft: "bg-slate-800",
      softText: "text-slate-300",
      titleHover: "group-hover:text-slate-200",
      price: "text-slate-300",
      priceOriginal: "text-neutral-300",
      chipActiveBgDark: "bg-slate-700",
      chipActiveTextDark: "text-white",
      pageGradientDark:
        "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(51,65,85,0.12),transparent)]",
      campaignBarQualifiedDark:
        "border-0 bg-[linear-gradient(135deg,rgba(30,41,59,0.98)_0%,rgba(10,10,10,0.98)_50%,rgba(15,23,42,0.98)_100%)]",
      campaignBarPendingDark:
        "border-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.1),transparent_42%),linear-gradient(135deg,rgba(30,20,10,0.96)_0%,rgba(10,10,10,0.98)_48%,rgba(15,25,35,0.96)_100%)]",
      campaignIconQualifiedDark: "bg-slate-700 text-slate-200",
      campaignIconPendingDark: "bg-amber-950/50 text-amber-300",
      campaignLabelQualifiedDark: "text-slate-300",
      campaignLabelPendingDark: "text-amber-400",
    },
    market: {
      soft: "bg-orange-950/50",
      softText: "text-orange-300",
      titleHover: "group-hover:text-orange-300",
      price: "text-orange-300",
      priceOriginal: "text-neutral-300",
      chipActiveBgDark: "bg-orange-900/70",
      chipActiveTextDark: "text-white",
      pageGradientDark:
        "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(249,115,22,0.1),transparent)]",
      campaignBarQualifiedDark:
        "border-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.16),transparent_42%),linear-gradient(135deg,rgba(35,18,6,0.96)_0%,rgba(10,10,10,0.98)_50%,rgba(30,15,5,0.96)_100%)]",
      campaignBarPendingDark:
        "border-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.1),transparent_42%),linear-gradient(135deg,rgba(30,20,10,0.96)_0%,rgba(10,10,10,0.98)_48%,rgba(15,25,35,0.96)_100%)]",
      campaignIconQualifiedDark: "bg-orange-950/60 text-orange-300",
      campaignIconPendingDark: "bg-amber-950/50 text-amber-300",
      campaignLabelQualifiedDark: "text-orange-400",
      campaignLabelPendingDark: "text-amber-400",
    },
    "vitrin-pro": {
      soft: "bg-teal-950/50",
      softText: "text-teal-300",
      titleHover: "group-hover:text-teal-300",
      price: "text-teal-300",
      priceOriginal: "text-neutral-300",
      chipActiveBgDark: "bg-teal-900/70",
      chipActiveTextDark: "text-white",
      pageGradientDark:
        "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(13,148,136,0.1),transparent)]",
      campaignBarQualifiedDark:
        "border-0 bg-[radial-gradient(circle_at_top_right,rgba(13,148,136,0.16),transparent_42%),linear-gradient(135deg,rgba(6,25,24,0.96)_0%,rgba(10,10,10,0.98)_50%,rgba(6,28,26,0.96)_100%)]",
      campaignBarPendingDark:
        "border-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.1),transparent_42%),linear-gradient(135deg,rgba(30,20,10,0.96)_0%,rgba(10,10,10,0.98)_48%,rgba(15,25,35,0.96)_100%)]",
      campaignIconQualifiedDark: "bg-teal-950/60 text-teal-300",
      campaignIconPendingDark: "bg-amber-950/50 text-amber-300",
      campaignLabelQualifiedDark: "text-teal-400",
      campaignLabelPendingDark: "text-amber-400",
    },
    noir: {
      soft: "bg-amber-950/50",
      softText: "text-amber-300",
      titleHover: "group-hover:text-amber-300",
      price: "text-amber-300",
      priceOriginal: "text-neutral-300",
      chipActiveBgDark: "bg-amber-600",
      chipActiveTextDark: "text-white",
      pageGradientDark:
        "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(217,168,103,0.1),transparent)]",
      campaignBarQualifiedDark:
        "border-0 bg-[radial-gradient(circle_at_top_right,rgba(217,168,103,0.16),transparent_42%),linear-gradient(135deg,rgba(30,22,10,0.96)_0%,rgba(10,10,10,0.98)_50%,rgba(28,20,8,0.96)_100%)]",
      campaignBarPendingDark:
        "border-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.1),transparent_42%),linear-gradient(135deg,rgba(30,20,10,0.96)_0%,rgba(10,10,10,0.98)_48%,rgba(15,25,35,0.96)_100%)]",
      campaignIconQualifiedDark: "bg-amber-950/60 text-amber-300",
      campaignIconPendingDark: "bg-amber-950/50 text-amber-300",
      campaignLabelQualifiedDark: "text-amber-400",
      campaignLabelPendingDark: "text-amber-400",
    },
  };

  if (colorScheme === "light") {
    return accent;
  }

  return { ...accent, ...darkSoftByTheme[themeKey] };
}

function buildTheme(
  neutrals: ThemeNeutrals,
  accent: ThemeAccent,
  colorScheme: StorefrontColorScheme = "light",
): StorefrontTheme {
  const isDark = colorScheme === "dark";
  const iconButtonInteractive = isDark
    ? "text-neutral-200 hover:bg-neutral-600"
    : "text-slate-700 hover:border-slate-300 hover:bg-slate-50";
  const dropdownItem = isDark
    ? "w-full rounded-xl px-4 py-2.5 text-left text-sm text-neutral-200 transition hover:bg-neutral-700"
    : "w-full rounded-xl px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50";
  const sidebarItemInactive = isDark
    ? "text-neutral-300 hover:bg-neutral-700"
    : "text-slate-700 hover:bg-slate-50";
  const sidebarChildInactive = isDark
    ? "text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100"
    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";
  const chipInactiveText = isDark ? "text-neutral-300" : "text-slate-700";
  const chipInactiveHover = isDark ? "hover:bg-neutral-700" : "hover:bg-slate-50";
  const modalInactiveText = isDark ? "text-neutral-300" : "text-slate-600";
  const stepperButton = isDark
    ? "text-neutral-200 transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:hover:bg-transparent"
    : "text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:hover:bg-transparent";
  const cartDrawerClose = isDark
    ? "flex size-10 items-center justify-center rounded-full border-0 bg-neutral-600 text-neutral-300 transition hover:bg-neutral-500"
    : "flex size-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100";
  const modalClose = isDark
    ? "rounded-full p-2 text-neutral-300 transition hover:bg-neutral-700 hover:text-neutral-100"
    : "rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900";
  const drawerHandle = isDark ? "h-1.5 w-14 rounded-full bg-neutral-600" : "h-1.5 w-14 rounded-full bg-slate-200";
  const productCardHover = isDark ? "hover:brightness-105" : "hover:border-slate-300";
  const stockBadgeOut = isDark
    ? "inline-flex items-center rounded-full border-0 bg-rose-950/60 px-3 py-1 text-[11px] font-semibold text-rose-300 shadow-sm"
    : "inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 shadow-sm";
  const variantBadge = isDark
    ? "bg-blue-950/70 px-2 py-1 text-[10px] text-blue-300"
    : "bg-blue-50 px-2 py-1 text-[10px] text-blue-700";

  const elevation1 = isDark
    ? "shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
    : "shadow-[0_12px_32px_rgba(15,23,42,0.06)]";
  const elevation1Hover = isDark
    ? "hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
    : "hover:shadow-[0_20px_48px_rgba(15,23,42,0.12)]";
  const elevation2 = isDark
    ? "shadow-[0_-16px_64px_rgba(0,0,0,0.55)]"
    : "shadow-[0_-24px_80px_rgba(15,23,42,0.22)]";
  const surfaceRing = "";
  const pageGradient = isDark ? accent.pageGradientDark : "";
  const chipActiveBg = isDark ? accent.chipActiveBgDark : neutrals.chipActiveBg;
  const chipActiveText = isDark ? accent.chipActiveTextDark : neutrals.chipActiveText;
  const campaignBarQualified = isDark
    ? accent.campaignBarQualifiedDark
    : accent.campaignBarQualifiedLight;
  const campaignBarPending = isDark
    ? accent.campaignBarPendingDark
    : accent.campaignBarPendingLight;
  const campaignIconQualified = isDark
    ? accent.campaignIconQualifiedDark
    : accent.campaignIconQualifiedLight;
  const campaignIconPending = isDark
    ? accent.campaignIconPendingDark
    : accent.campaignIconPendingLight;
  const campaignLabelQualified = isDark
    ? accent.campaignLabelQualifiedDark
    : accent.campaignLabelQualifiedLight;
  const campaignLabelPending = isDark
    ? accent.campaignLabelPendingDark
    : accent.campaignLabelPendingLight;
  const campaignNoteQualified = isDark
    ? "border-0 bg-emerald-950/40 text-emerald-300"
    : "border-emerald-200 bg-emerald-50 text-emerald-800";
  const campaignNotePending = isDark
    ? "border-0 bg-amber-950/40 text-amber-300"
    : "border-amber-200 bg-amber-50 text-amber-800";
  const indicatorActive = isDark ? "bg-white" : "bg-slate-900";
  const indicatorInactive = isDark
    ? "bg-neutral-500 hover:bg-neutral-400"
    : "bg-slate-300 hover:bg-slate-400";
  const cartSummaryMuted = isDark ? "text-neutral-300" : neutrals.textMuted;
  const textTertiary = isDark ? "text-neutral-300" : "text-slate-500";
  const proseBlockquote = isDark
    ? "border-0 text-neutral-300"
    : "border-slate-200 text-slate-500";
  const proseTableHead = isDark
    ? "border-0 bg-neutral-600"
    : "border-slate-200 bg-slate-100";
  const proseTableCell = isDark ? "border-0" : "border-slate-200";
  const proseHeadingBlock = isDark
    ? "[&_h2]:text-neutral-50 [&_h3]:text-neutral-50"
    : "[&_h2]:text-slate-900 [&_h3]:text-slate-900";
  const proseBlockquoteBlock = isDark
    ? "[&_blockquote]:border-0 [&_blockquote]:border-l-0 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-300"
    : "[&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:text-slate-500";
  const proseTableHeadBlock = isDark
    ? "[&_th]:border-0 [&_th]:bg-neutral-600"
    : "[&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-100";
  const proseTableCellBlock = isDark
    ? "[&_td]:border-0"
    : "[&_td]:border [&_td]:border-slate-200";

  const structuralBorder = isDark ? "border-0" : neutrals.border;
  const stickyBarBorder = isDark ? "border-0" : accent.stickyBarBorder;
  const formField = isDark
    ? "border-0 bg-neutral-600 text-neutral-50 placeholder:text-neutral-300 focus-visible:ring-1 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-0 dark:border-0"
    : "";
  const bannerOverlay = isDark ? "hidden" : "absolute inset-0 hidden md:block";
  const sectionDivider = isDark ? "" : cn("border-t", neutrals.headerRailBorder);
  const cartPaymentCashActive = isDark
    ? "border-0 bg-emerald-900/70 text-emerald-300"
    : "border-emerald-500 bg-emerald-50 text-emerald-700";
  const cartPaymentCardActive = isDark
    ? "border-0 bg-blue-900/70 text-blue-300"
    : "border-blue-500 bg-blue-50 text-blue-700";
  const cartPaymentInactive = isDark
    ? cn("border-0", neutrals.surfaceMuted, neutrals.textMuted, "hover:opacity-90")
    : cn(structuralBorder, neutrals.surface, neutrals.textMuted, "hover:opacity-90");
  const cartInstallmentActive = isDark
    ? "border-0 bg-blue-900/70 text-blue-300"
    : "border-blue-500 bg-blue-50 text-blue-700";
  const modalHandle = drawerHandle;

  return {
    page: cn(
      "min-h-screen w-full max-w-full overflow-x-hidden pb-28 xl:pb-6",
      neutrals.page,
      neutrals.pageText,
      pageGradient,
    ),
    header: cn(
      "sticky top-0 z-40 backdrop-blur-xl",
      neutrals.header,
    ),
    headerBorder: neutrals.headerBorder,
    headerTitle: cn("truncate font-semibold tracking-tight", neutrals.text),
    headerMuted: neutrals.textMuted,
    headerIconButton: cn(
      "flex items-center justify-center rounded-2xl shadow-sm transition-colors duration-300",
      isDark ? "border-0 bg-neutral-700" : cn("border", neutrals.border, neutrals.surface),
      iconButtonInteractive,
      "lg:size-12",
    ),
    logoWrap: cn(
      "relative flex shrink-0 items-center justify-center overflow-hidden rounded-[1.4rem] shadow-sm lg:rounded-[1.75rem]",
      isDark ? "border-0 bg-neutral-700" : cn("border", neutrals.border, neutrals.surface),
    ),
    logoPlaceholder: neutrals.textMuted,
    cartBadge: cn(
      "absolute -right-2 -top-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
      accent.primary,
      accent.primaryForeground,
    ),
    cartButton: cn(
      "relative flex size-11 items-center justify-center rounded-2xl shadow-sm transition lg:size-12",
      isDark ? "border-0 bg-neutral-700" : cn("border", neutrals.border, neutrals.surface),
      iconButtonInteractive,
    ),
    cartTotalLabel: neutrals.textMuted,
    cartTotalValue: cn("text-sm font-bold", neutrals.text),
    cartTotalEmpty: cn("text-sm font-bold", neutrals.textMuted),
    categoryRailBorder: neutrals.headerRailBorder,
    categoryNavGap: "md:gap-2",
    categoryNavChip: (active) =>
      cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition duration-200",
        active
          ? cn("scale-[1.03] font-bold shadow-sm", chipActiveBg, chipActiveText)
          : neutrals.chipInactive,
      ),
    categoryNavMobile: (active) =>
      cn(
        "shrink-0 px-1 pb-3 text-sm font-semibold transition duration-200",
        isDark
          ? active
            ? cn("rounded-lg px-3 py-1.5 font-bold", chipActiveBg, chipActiveText)
            : neutrals.textMuted
          : active
            ? cn("border-b-2 font-bold", accent.navMobileActive, neutrals.text)
            : cn("border-b-2 border-transparent", neutrals.textMuted),
      ),
    categorySubChip: (active) =>
      cn(
        "shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200",
        isDark
          ? active
            ? cn("shadow-sm", chipActiveBg, chipActiveText)
            : cn(neutrals.surfaceMuted, chipInactiveText)
          : active
            ? cn("border shadow-sm", accent.subChipActive)
            : cn("border", neutrals.chipInactiveBorder, neutrals.surface, chipInactiveText),
      ),
    categoryDropdown: cn(
      "min-w-[220px] rounded-2xl p-2 shadow-xl",
      isDark ? cn("border-0", neutrals.surface) : cn("border", neutrals.border, neutrals.surface),
    ),
    categoryDropdownItem: dropdownItem,
    categoryRail:
      "flex max-w-full gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none whitespace-nowrap lg:flex-wrap lg:overflow-visible lg:whitespace-normal",
    categoryChip: (active) =>
      cn(
        "rounded-full px-5 py-2.5 text-sm font-semibold transition shadow-sm",
        active
          ? cn(chipActiveBg, chipActiveText)
          : isDark
            ? cn(neutrals.surfaceMuted, chipInactiveText, chipInactiveHover)
            : cn(neutrals.surface, neutrals.chipInactiveBorder, chipInactiveText, chipInactiveHover),
      ),
    categorySidebar: cn(
      "sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-2xl p-3 shadow-sm",
      isDark ? cn("border-0", neutrals.surface) : cn("border", neutrals.border, neutrals.surface),
    ),
    categorySidebarTitle: cn(
      "px-3 pb-2 text-xs font-bold uppercase tracking-[0.18em]",
      neutrals.textMuted,
    ),
    categorySidebarItem: (active) =>
      cn(
        "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
        active
          ? cn(chipActiveBg, chipActiveText)
          : sidebarItemInactive,
      ),
    categorySidebarChildItem: (active) =>
      cn(
        "flex w-full items-center rounded-lg py-2 pl-6 pr-3 text-left text-[13px] font-medium transition",
        active
          ? cn("font-semibold", accent.softText, accent.soft)
          : sidebarChildInactive,
      ),
    searchWrap: cn(
      "relative rounded-2xl shadow-sm",
      isDark ? "border-0 bg-neutral-700" : cn("border", neutrals.border, neutrals.surface),
    ),
    searchInput: isDark
      ? "rounded-2xl focus-visible:ring-0"
      : cn("rounded-2xl", accent.ring, accent.borderFocus),
    searchIcon: cn("absolute left-4 top-1/2 -translate-y-1/2 size-5", neutrals.textMuted),
    productCard: cn(
      "group min-w-0 flex h-full flex-col overflow-hidden rounded-[1.75rem] transition duration-300 hover:-translate-y-1",
      isDark ? "border-0" : "border",
      elevation1,
      elevation1Hover,
      surfaceRing,
      structuralBorder,
      neutrals.surface,
      productCardHover,
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
    productThumbText: neutrals.text,
    productThumbMeta: neutrals.textMuted,
    showProductModelNo: true,
    productOutOverlay: "absolute inset-x-0 bottom-0 z-10 bg-slate-950/72 px-2 py-1.5 text-center backdrop-blur-sm",
    stockBadgeIn: cn(
      "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold",
      accent.soft,
      accent.softText,
    ),
    stockBadgeOut,
    variantBadge,
    addedVariantBadge: cn("px-2 py-1 text-[10px]", accent.soft, accent.softText),
    primaryButton: cn(
      "rounded-xl shadow-sm transition font-bold",
      accent.primary,
      accent.primaryHover,
      accent.primaryActive,
      accent.primaryForeground,
    ),
    stickyCart: cn(
      "fixed bottom-4 inset-x-4 z-40 rounded-2xl p-4 shadow-[0_16px_40px_rgba(15,23,42,0.16)] md:bottom-6 max-w-lg mx-auto",
      isDark ? "border-0" : "border",
      accent.stickyBar,
      stickyBarBorder,
    ),
    stickyCartText: "text-white font-bold",
    stickyCartButton: cn(
      "rounded-xl transition px-5 py-3 font-bold",
      accent.stickyButton,
      accent.stickyButtonHover,
    ),
    cartDrawerOverlay: "fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md",
    cartDrawerPanel: cn(
      "absolute inset-x-0 bottom-0 z-10 max-h-[94dvh] rounded-t-[2rem] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:max-h-none lg:w-[460px] lg:rounded-l-[2rem] lg:rounded-tr-none",
      elevation2,
      surfaceRing,
      neutrals.surface,
    ),
    cartDrawerHandle: drawerHandle,
    cartDrawerHeaderBorder: isDark ? "border-0" : cn("border-b", neutrals.headerRailBorder),
    cartDrawerTitle: cn("truncate text-xl font-bold tracking-tight sm:text-2xl", neutrals.text),
    cartDrawerMuted: neutrals.textMuted,
    cartDrawerCloseButton: cartDrawerClose,
    cartDrawerItem: cn(
      "min-w-0 rounded-[1.55rem] p-3.5",
      isDark ? "border-0" : "border",
      elevation1,
      surfaceRing,
      structuralBorder,
      neutrals.surfaceMuted,
    ),
    cartDrawerSummary: cn("rounded-xl p-3", neutrals.cartSummary, neutrals.cartSummaryText),
    modalOverlay: "fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center",
    modalPanel: cn(
      "relative z-10 mx-auto flex w-full min-w-0 max-w-2xl flex-col overflow-hidden",
      elevation2,
      surfaceRing,
      neutrals.surface,
    ),
    modalHeaderBorder: isDark ? "border-0" : cn("border-b", neutrals.headerRailBorder),
    modalTitle: cn("text-lg font-semibold", neutrals.text),
    modalCloseButton: modalClose,
    modalFooterBorder: isDark ? "border-0" : cn("border-t", neutrals.headerRailBorder),
    modalSurface: cn(
      "rounded-[1.35rem] p-4",
      isDark ? "border-0" : "border",
      surfaceRing,
      structuralBorder,
      neutrals.modalSurface,
    ),
    modalTabChip: (active) =>
      cn(
        "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
        isDark
          ? active
            ? cn(chipActiveBg, chipActiveText)
            : cn(neutrals.surfaceMuted, modalInactiveText)
          : active
            ? cn("border", chipActiveBg, chipActiveText)
            : cn("border", neutrals.chipInactiveBorder, neutrals.surface, modalInactiveText),
      ),
    floatingCartStepper: accent.stepper,
    floatingCartAddButton: cn(
      "flex items-center justify-center rounded-xl text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition-all duration-200",
      isDark
        ? cn("border-0", accent.floatingAddBg, "hover:brightness-110")
        : cn("border", accent.floatingAddBorder, accent.floatingAddBg, accent.floatingAddHover),
    ),
    gateEyebrow: cn("text-xs font-semibold uppercase tracking-[0.24em]", accent.softText),
    gateCard: cn(
      "w-full max-w-md rounded-2xl p-6 shadow-sm",
      isDark ? cn("border-0", neutrals.surface) : cn("border", neutrals.border, neutrals.surface),
    ),
    gateTitle: cn("mt-3 text-2xl font-semibold", neutrals.text),
    gateDescription: cn("mt-2 text-sm leading-6", neutrals.textMuted),
    gateError: neutrals.textMuted,
    surface: neutrals.surface,
    surfaceMuted: neutrals.surfaceMuted,
    productThumbSurface: neutrals.surface,
    activeTileBg: chipActiveBg,
    activeTileText: chipActiveText,
    border: structuralBorder,
    text: neutrals.text,
    textMuted: neutrals.textMuted,
    footerShell: isDark
      ? cn("relative z-0", neutrals.surfaceMuted)
      : cn("relative z-0 border-t", neutrals.headerRailBorder, neutrals.surfaceMuted),
    footerHeading: cn(
      "mb-2 text-[11px] font-semibold uppercase tracking-[0.1em]",
      neutrals.text,
    ),
    footerText: cn("text-[15px] leading-[1.7] break-words", neutrals.textMuted),
    footerLink: cn(
      "font-medium transition hover:underline",
      neutrals.text,
      isDark ? "hover:text-white" : "hover:text-slate-900",
    ),
    quantityStepper: cn(
      "flex h-9 items-stretch overflow-hidden rounded-lg",
      isDark ? cn("border-0", neutrals.surfaceMuted) : cn("border", neutrals.border, neutrals.surface),
    ),
    quantityStepperButton: stepperButton,
    quantityInput: cn(
      "min-w-0 flex-1 bg-transparent px-2.5 py-0 text-center text-[16px] leading-9 outline-none disabled:cursor-not-allowed",
      neutrals.text,
    ),
    panelSurface: cn(
      "rounded-[1.5rem] p-3 sm:p-4",
      isDark ? "border-0" : "border",
      elevation1,
      surfaceRing,
      structuralBorder,
      neutrals.surface,
    ),
    emptyImage: cn(
      "flex h-full w-full items-center justify-center rounded-[1rem]",
      isDark ? cn("border-0", neutrals.surfaceMuted) : cn("border border-dashed", neutrals.border, neutrals.surfaceMuted),
    ),
    prose: cn("text-sm leading-6", neutrals.textMuted),
    proseHeading: neutrals.text,
    proseBlockquote,
    proseTableHead,
    proseTableCell,
    proseHeadingBlock,
    proseBlockquoteBlock,
    proseTableHeadBlock,
    proseTableCellBlock,
    elevation1,
    elevation2,
    surfaceRing,
    pageGradient,
    campaignBarQualified,
    campaignBarPending,
    campaignIconQualified,
    campaignIconPending,
    campaignLabelQualified,
    campaignLabelPending,
    campaignNoteQualified,
    campaignNotePending,
    indicatorActive,
    indicatorInactive,
    cartSummaryMuted,
    textTertiary,
    formField,
    bannerOverlay,
    sectionDivider,
    cartPaymentCashActive,
    cartPaymentCardActive,
    cartPaymentInactive,
    cartInstallmentActive,
    modalHandle,
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
  primary: "bg-emerald-700",
  primaryHover: "hover:bg-emerald-800",
  primaryActive: "active:bg-emerald-900",
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
  stickyButton: "bg-emerald-700 hover:bg-emerald-800 text-white",
  stickyButtonHover: "hover:bg-emerald-800",
  navMobileActive: "border-emerald-600",
  subChipActive: "border-emerald-700 bg-emerald-700 text-white",
  floatingAddBorder: "border-emerald-700",
  floatingAddBg: "bg-emerald-700",
  floatingAddHover: "hover:border-emerald-800 hover:bg-emerald-800",
  chipActiveBgDark: "",
  chipActiveTextDark: "",
  pageGradientDark: "",
  campaignBarQualifiedDark: "",
  campaignBarPendingDark: "",
  campaignIconQualifiedDark: "",
  campaignIconPendingDark: "",
  campaignLabelQualifiedDark: "",
  campaignLabelPendingDark: "",
  campaignBarQualifiedLight:
    "border-emerald-200 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.2),transparent_42%),linear-gradient(135deg,#ecfdf5_0%,#ffffff_50%,#f0fdf4_100%)]",
  campaignBarPendingLight:
    "border-amber-200 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_42%),linear-gradient(135deg,#fff7ed_0%,#ffffff_48%,#eff6ff_100%)]",
  campaignIconQualifiedLight: "bg-emerald-100 text-emerald-700",
  campaignIconPendingLight: "bg-amber-100 text-amber-700",
  campaignLabelQualifiedLight: "text-emerald-700",
  campaignLabelPendingLight: "text-amber-700",
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
  chipActiveBgDark: "",
  chipActiveTextDark: "",
  pageGradientDark: "",
  campaignBarQualifiedDark: "",
  campaignBarPendingDark: "",
  campaignIconQualifiedDark: "",
  campaignIconPendingDark: "",
  campaignLabelQualifiedDark: "",
  campaignLabelPendingDark: "",
  campaignBarQualifiedLight:
    "border-blue-200 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_42%),linear-gradient(135deg,#eff6ff_0%,#ffffff_50%,#f0f9ff_100%)]",
  campaignBarPendingLight:
    "border-amber-200 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_42%),linear-gradient(135deg,#fff7ed_0%,#ffffff_48%,#eff6ff_100%)]",
  campaignIconQualifiedLight: "bg-blue-100 text-blue-700",
  campaignIconPendingLight: "bg-amber-100 text-amber-700",
  campaignLabelQualifiedLight: "text-blue-700",
  campaignLabelPendingLight: "text-amber-700",
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
  chipActiveBgDark: "",
  chipActiveTextDark: "",
  pageGradientDark: "",
  campaignBarQualifiedDark: "",
  campaignBarPendingDark: "",
  campaignIconQualifiedDark: "",
  campaignIconPendingDark: "",
  campaignLabelQualifiedDark: "",
  campaignLabelPendingDark: "",
  campaignBarQualifiedLight:
    "border-slate-300 bg-[radial-gradient(circle_at_top_right,rgba(100,116,139,0.12),transparent_42%),linear-gradient(135deg,#f8fafc_0%,#ffffff_50%,#f1f5f9_100%)]",
  campaignBarPendingLight:
    "border-amber-200 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_42%),linear-gradient(135deg,#fff7ed_0%,#ffffff_48%,#eff6ff_100%)]",
  campaignIconQualifiedLight: "bg-slate-200 text-slate-700",
  campaignIconPendingLight: "bg-amber-100 text-amber-700",
  campaignLabelQualifiedLight: "text-slate-700",
  campaignLabelPendingLight: "text-amber-700",
};

const darkNeutrals: ThemeNeutrals = {
  page: "bg-black",
  pageText: "text-neutral-50",
  header: "bg-neutral-800",
  headerBorder: "border-0",
  headerRailBorder: "border-0",
  surface: "bg-neutral-700",
  surfaceMuted: "bg-neutral-600",
  border: "border-0",
  text: "text-neutral-50",
  textMuted: "text-neutral-300",
  chipActiveBg: "bg-neutral-500",
  chipActiveText: "text-neutral-50",
  chipInactive: "text-neutral-300 hover:bg-neutral-600",
  chipInactiveBorder: "border-0",
  imageGradient: "bg-[linear-gradient(180deg,#525252_0%,#404040_100%)]",
  cartSummary: "bg-neutral-600",
  cartSummaryText: "text-neutral-50",
  modalSurface: "bg-neutral-600",
  gatePage: "bg-black text-neutral-50",
};

const industrialNeutrals: ThemeNeutrals = {
  ...minimalNeutrals,
  page: "bg-zinc-100",
  header: "border-b border-zinc-800 bg-zinc-900 text-white",
  headerBorder: "border-zinc-800",
  headerRailBorder: "border-zinc-800",
  surface: "bg-white",
  text: "text-zinc-950",
  textMuted: "text-zinc-500",
  chipActiveBg: "bg-zinc-800 text-white",
  chipActiveText: "text-white",
  gatePage: "bg-zinc-100 text-zinc-950",
};

const industrialAccent: ThemeAccent = {
  ...neutralAccent,
  primary: "bg-zinc-700",
  primaryHover: "hover:bg-zinc-800",
  primaryActive: "active:bg-zinc-900",
  soft: "bg-zinc-100",
  softText: "text-zinc-800",
  softBorder: "border-zinc-400/40",
  price: "text-zinc-800",
  stickyButton: "bg-zinc-700 hover:bg-zinc-800 text-white",
  navMobileActive: "border-zinc-700",
  subChipActive: "border-zinc-700 bg-zinc-700 text-white",
  floatingAddBorder: "border-zinc-700",
  floatingAddBg: "bg-zinc-700",
  floatingAddHover: "hover:border-zinc-600 hover:bg-zinc-600",
  campaignBarQualifiedLight:
    "border-zinc-300 bg-[radial-gradient(circle_at_top_right,rgba(63,63,70,0.12),transparent_42%),linear-gradient(135deg,#f4f4f5_0%,#ffffff_50%,#fafafa_100%)]",
  campaignIconQualifiedLight: "bg-zinc-200 text-zinc-800",
  campaignLabelQualifiedLight: "text-zinc-800",
};

const premiumNeutrals: ThemeNeutrals = {
  ...minimalNeutrals,
  page: "bg-[linear-gradient(180deg,#fafaf9_0%,#ffffff_100%)]",
  header: "border-b border-stone-200/80 bg-white/98",
  surfaceMuted: "bg-[linear-gradient(180deg,#ffffff_0%,#fafaf9_100%)]",
  text: "text-stone-950",
  textMuted: "text-stone-500",
  chipActiveBg: "bg-stone-900 text-white",
  imageGradient: "bg-[linear-gradient(180deg,#fafaf9_0%,#f5f5f4_100%)]",
  gatePage: "bg-stone-50 text-stone-950",
};

const premiumAccent: ThemeAccent = {
  ...neutralAccent,
  primary: "bg-stone-900",
  soft: "bg-stone-100",
  softText: "text-stone-800",
  price: "text-stone-900",
  stickyButton: "bg-stone-900 hover:bg-stone-800 text-white",
  navMobileActive: "border-stone-900",
  subChipActive: "border-stone-900 bg-stone-900 text-white",
  campaignBarQualifiedLight:
    "border-stone-300 bg-[radial-gradient(circle_at_top_right,rgba(120,113,108,0.12),transparent_42%),linear-gradient(135deg,#fafaf9_0%,#ffffff_50%,#f5f5f4_100%)]",
  campaignIconQualifiedLight: "bg-stone-200 text-stone-800",
  campaignLabelQualifiedLight: "text-stone-800",
};

const catalogFirstNeutrals: ThemeNeutrals = {
  ...minimalNeutrals,
  page: "bg-white",
  header: "border-b border-slate-100 bg-white",
  surfaceMuted: "bg-slate-50",
  chipActiveBg: "bg-slate-800 text-white",
  gatePage: "bg-white text-slate-900",
};

const catalogFirstAccent: ThemeAccent = {
  ...proBlueAccent,
  primary: "bg-slate-800",
  primaryHover: "hover:bg-slate-900",
  soft: "bg-slate-100",
  softText: "text-slate-800",
  price: "text-slate-900",
  stickyButton: "bg-slate-800 hover:bg-slate-900 text-white",
  navMobileActive: "border-slate-800",
  subChipActive: "border-slate-800 bg-slate-800 text-white",
  campaignBarQualifiedLight:
    "border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(15,23,42,0.08),transparent_42%),linear-gradient(135deg,#f8fafc_0%,#ffffff_50%,#f1f5f9_100%)]",
  campaignIconQualifiedLight: "bg-slate-200 text-slate-800",
  campaignLabelQualifiedLight: "text-slate-800",
};

// "market" ve "vitrin-pro" — sırasıyla market/hızlı teslimat uygulamaları
// (ör. Getir) ve kurumsal e-ticaret vitrinleri (ör. Ticimax) esintili, sade
// ve kalabalıksız iki yeni hazır tema. Mevcut temalara (minimal, pro-blue vb.)
// dokunulmadı — bu iki tema tamamen ek seçenek.
const marketNeutrals: ThemeNeutrals = {
  ...minimalNeutrals,
  chipActiveBg: "bg-orange-700 text-white",
  imageGradient: "bg-[linear-gradient(180deg,#fff7ed_0%,#fef2e8_100%)]",
};

const marketAccent: ThemeAccent = {
  primary: "bg-orange-700",
  primaryHover: "hover:bg-orange-800",
  primaryActive: "active:bg-orange-900",
  primaryForeground: "text-white",
  soft: "bg-orange-50",
  softText: "text-orange-700",
  softBorder: "border-orange-400/30",
  ring: "focus:ring-2 focus:ring-orange-500/20",
  borderFocus: "focus:border-orange-500",
  titleHover: "group-hover:text-orange-700",
  price: "text-orange-600",
  priceOriginal: "text-slate-400",
  stepper:
    "border border-orange-400/30 bg-[linear-gradient(180deg,rgba(249,115,22,0.98)_0%,rgba(234,88,12,0.96)_100%)] text-white shadow-[0_18px_40px_rgba(234,88,12,0.3)] backdrop-blur",
  stickyBar: "bg-slate-900 text-white",
  stickyBarBorder: "border-white/10",
  stickyButton: "bg-orange-700 hover:bg-orange-800 text-white",
  stickyButtonHover: "hover:bg-orange-800",
  navMobileActive: "border-orange-500",
  subChipActive: "border-orange-700 bg-orange-700 text-white",
  floatingAddBorder: "border-orange-700",
  floatingAddBg: "bg-orange-700",
  floatingAddHover: "hover:border-orange-800 hover:bg-orange-800",
  chipActiveBgDark: "",
  chipActiveTextDark: "",
  pageGradientDark: "",
  campaignBarQualifiedDark: "",
  campaignBarPendingDark: "",
  campaignIconQualifiedDark: "",
  campaignIconPendingDark: "",
  campaignLabelQualifiedDark: "",
  campaignLabelPendingDark: "",
  campaignBarQualifiedLight:
    "border-orange-200 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.2),transparent_42%),linear-gradient(135deg,#fff7ed_0%,#ffffff_50%,#fffbeb_100%)]",
  campaignBarPendingLight:
    "border-amber-200 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_42%),linear-gradient(135deg,#fff7ed_0%,#ffffff_48%,#eff6ff_100%)]",
  campaignIconQualifiedLight: "bg-orange-100 text-orange-700",
  campaignIconPendingLight: "bg-amber-100 text-amber-700",
  campaignLabelQualifiedLight: "text-orange-700",
  campaignLabelPendingLight: "text-amber-700",
};

const vitrinProNeutrals: ThemeNeutrals = {
  ...minimalNeutrals,
  chipActiveBg: "bg-teal-700 text-white",
  imageGradient: "bg-[linear-gradient(180deg,#f0fdfa_0%,#ecfeff_100%)]",
};

const vitrinProAccent: ThemeAccent = {
  primary: "bg-teal-700",
  primaryHover: "hover:bg-teal-800",
  primaryActive: "active:bg-teal-900",
  primaryForeground: "text-white",
  soft: "bg-teal-50",
  softText: "text-teal-700",
  softBorder: "border-teal-400/30",
  ring: "focus:ring-2 focus:ring-teal-500/20",
  borderFocus: "focus:border-teal-500",
  titleHover: "group-hover:text-teal-700",
  price: "text-teal-700",
  priceOriginal: "text-slate-400",
  stepper:
    "border border-teal-400/30 bg-[linear-gradient(180deg,rgba(13,148,136,0.98)_0%,rgba(15,118,110,0.96)_100%)] text-white shadow-[0_18px_40px_rgba(15,118,110,0.3)] backdrop-blur",
  stickyBar: "bg-slate-900 text-white",
  stickyBarBorder: "border-white/10",
  stickyButton: "bg-teal-700 hover:bg-teal-800 text-white",
  stickyButtonHover: "hover:bg-teal-800",
  navMobileActive: "border-teal-600",
  subChipActive: "border-teal-700 bg-teal-700 text-white",
  floatingAddBorder: "border-teal-700",
  floatingAddBg: "bg-teal-700",
  floatingAddHover: "hover:border-teal-800 hover:bg-teal-800",
  chipActiveBgDark: "",
  chipActiveTextDark: "",
  pageGradientDark: "",
  campaignBarQualifiedDark: "",
  campaignBarPendingDark: "",
  campaignIconQualifiedDark: "",
  campaignIconPendingDark: "",
  campaignLabelQualifiedDark: "",
  campaignLabelPendingDark: "",
  campaignBarQualifiedLight:
    "border-teal-200 bg-[radial-gradient(circle_at_top_right,rgba(13,148,136,0.18),transparent_42%),linear-gradient(135deg,#f0fdfa_0%,#ffffff_50%,#ecfeff_100%)]",
  campaignBarPendingLight:
    "border-amber-200 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_42%),linear-gradient(135deg,#fff7ed_0%,#ffffff_48%,#eff6ff_100%)]",
  campaignIconQualifiedLight: "bg-teal-100 text-teal-700",
  campaignIconPendingLight: "bg-amber-100 text-amber-700",
  campaignLabelQualifiedLight: "text-teal-700",
  campaignLabelPendingLight: "text-amber-700",
};

// "noir" — koyu, minimal bir tema. Diğer temaların
// aksine "light" (varsayılan) görünümü de zaten koyu/siyah — ürün fotoğrafı
// kartın üstünde arka plansız (imageGradient boş) "yüzsün" diye tasarlandı.
const noirNeutrals: ThemeNeutrals = {
  page: "bg-neutral-950",
  pageText: "text-neutral-50",
  header: "bg-neutral-950",
  headerBorder: "border-neutral-800",
  headerRailBorder: "border-neutral-800",
  surface: "bg-neutral-900",
  surfaceMuted: "bg-neutral-800",
  border: "border-neutral-800",
  text: "text-neutral-50",
  textMuted: "text-neutral-300",
  chipActiveBg: "bg-amber-600 text-white",
  chipActiveText: "text-white",
  chipInactive: "text-neutral-300 hover:bg-neutral-800",
  chipInactiveBorder: "border-neutral-800",
  imageGradient: "",
  cartSummary: "bg-neutral-900",
  cartSummaryText: "text-neutral-50",
  modalSurface: "bg-neutral-900",
  gatePage: "bg-neutral-950 text-neutral-50",
};

const noirAccent: ThemeAccent = {
  primary: "bg-amber-600",
  primaryHover: "hover:bg-amber-500",
  primaryActive: "active:bg-amber-700",
  primaryForeground: "text-white",
  soft: "bg-amber-950/40",
  softText: "text-amber-300",
  softBorder: "border-amber-700/30",
  ring: "focus:ring-2 focus:ring-amber-500/30",
  borderFocus: "focus:border-amber-500",
  titleHover: "group-hover:text-amber-400",
  price: "text-amber-400",
  priceOriginal: "text-neutral-500",
  stepper:
    "border-0 bg-amber-600 text-white shadow-[0_18px_40px_rgba(217,168,103,0.25)]",
  stickyBar: "bg-neutral-900 text-white",
  stickyBarBorder: "border-neutral-800",
  stickyButton: "bg-amber-600 hover:bg-amber-500 text-white",
  stickyButtonHover: "hover:bg-amber-500",
  navMobileActive: "border-amber-500",
  subChipActive: "border-amber-600 bg-amber-600 text-white",
  floatingAddBorder: "border-amber-600",
  floatingAddBg: "bg-amber-600",
  floatingAddHover: "hover:border-amber-500 hover:bg-amber-500",
  chipActiveBgDark: "bg-amber-600",
  chipActiveTextDark: "text-white",
  pageGradientDark:
    "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(217,168,103,0.08),transparent)]",
  campaignBarQualifiedDark:
    "border-0 bg-[radial-gradient(circle_at_top_right,rgba(217,168,103,0.14),transparent_42%),linear-gradient(135deg,rgba(30,22,10,0.96)_0%,rgba(10,10,10,0.98)_50%,rgba(28,20,8,0.96)_100%)]",
  campaignBarPendingDark:
    "border-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.1),transparent_42%),linear-gradient(135deg,rgba(30,20,10,0.96)_0%,rgba(10,10,10,0.98)_48%,rgba(15,25,35,0.96)_100%)]",
  campaignIconQualifiedDark: "bg-amber-950/60 text-amber-300",
  campaignIconPendingDark: "bg-amber-950/50 text-amber-300",
  campaignLabelQualifiedDark: "text-amber-400",
  campaignLabelPendingDark: "text-amber-400",
  campaignBarQualifiedLight:
    "border-amber-800/40 bg-[radial-gradient(circle_at_top_right,rgba(217,168,103,0.16),transparent_42%),linear-gradient(135deg,rgba(23,23,23,0.98)_0%,rgba(10,10,10,0.99)_50%,rgba(20,17,10,0.98)_100%)]",
  campaignBarPendingLight:
    "border-amber-800/30 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_42%),linear-gradient(135deg,rgba(23,23,23,0.98)_0%,rgba(10,10,10,0.99)_48%,rgba(20,20,25,0.98)_100%)]",
  campaignIconQualifiedLight: "bg-amber-950/50 text-amber-300",
  campaignIconPendingLight: "bg-amber-950/40 text-amber-300",
  campaignLabelQualifiedLight: "text-amber-400",
  campaignLabelPendingLight: "text-amber-400",
};

function buildStorefrontThemes(
  colorScheme: StorefrontColorScheme,
): Record<StorefrontThemeKey, StorefrontTheme> {
  const neutralsFor = (lightNeutrals: ThemeNeutrals) =>
    colorScheme === "dark" ? darkNeutrals : lightNeutrals;

  return {
    minimal: buildTheme(
      neutralsFor(minimalNeutrals),
      resolveAccent(minimalAccent, colorScheme, "minimal"),
      colorScheme,
    ),
    "pro-blue": buildTheme(
      neutralsFor(minimalNeutrals),
      resolveAccent(proBlueAccent, colorScheme, "pro-blue"),
      colorScheme,
    ),
    neutral: buildTheme(
      neutralsFor(neutralNeutrals),
      resolveAccent(neutralAccent, colorScheme, "neutral"),
      colorScheme,
    ),
    industrial: buildTheme(
      neutralsFor(industrialNeutrals),
      resolveAccent(industrialAccent, colorScheme, "industrial"),
      colorScheme,
    ),
    premium: buildTheme(
      neutralsFor(premiumNeutrals),
      resolveAccent(premiumAccent, colorScheme, "premium"),
      colorScheme,
    ),
    "catalog-first": buildTheme(
      neutralsFor(catalogFirstNeutrals),
      resolveAccent(catalogFirstAccent, colorScheme, "catalog-first"),
      colorScheme,
    ),
    market: buildTheme(
      neutralsFor(marketNeutrals),
      resolveAccent(marketAccent, colorScheme, "market"),
      colorScheme,
    ),
    "vitrin-pro": buildTheme(
      neutralsFor(vitrinProNeutrals),
      resolveAccent(vitrinProAccent, colorScheme, "vitrin-pro"),
      colorScheme,
    ),
    noir: buildNoirTheme(),
  };
}

// Noir her zaman koyu görünmeli — ziyaretçinin site-geneli açık/koyu mod
// anahtarından bağımsız olarak. buildTheme() içindeki ~30 "isDark ? X : Y"
// dalı, colorScheme parametresine göre seçiliyor; colorScheme="light"
// verilseydi (Noir'in "doğal" hali teknik olarak "light" çağrısıydı) bu
// dallar AÇIK tema metinlerini (ör. text-slate-700) seçiyordu — bunlar
// Noir'in siyah/koyu yüzeylerinde neredeyse görünmez kalıyordu (dropdown'lar,
// header ikonları, sekmeler, arama kutusu vb.). Çözüm: colorScheme'i her
// zaman "dark" olarak sabitle — bu dallar zaten diğer temaların paylaşılan
// gece modu için koyu-arka-plana-uygun kontrastlı gri tonlarıyla
// tasarlanmıştı, Noir'e de doğrudan uyuyor.
function buildNoirTheme(): StorefrontTheme {
  const theme = buildTheme(noirNeutrals, resolveAccent(noirAccent, "dark", "noir"), "dark");

  return {
    ...theme,
    // Ürün kartının kendisinde görünür bir arka plan/gölge yok (sayfayla
    // tamamen kaynaşır, "genel çerçeve" hissi vermesin) — sadece ürün
    // görselinin durduğu kutu beyaz ve dört köşesi yuvarlak (Getir tarzı:
    // fotoğraf bağımsız beyaz bir kare içinde, ürün adı/fiyatı kutunun
    // DIŞINDA, koyu arka plan üzerinde).
    productCard: cn(theme.productCard, "bg-transparent"),
    productImageWrap: cn(theme.productImageWrap, "bg-white"),
    // Model numarası bu temada gösterilmiyor; ürün adı bir tık küçültülerek
    // uzun isimlerin satır kesilmeden daha fazlasının görünmesi sağlanıyor.
    productTitle: cn(theme.productTitle, "sm:text-[13px] text-[12px]"),
    showProductModelNo: false,
    emptyImage: cn(theme.emptyImage, "bg-white"),
    // Sepet çekmecesindeki "Bunları da Beğenebilirsiniz" kartları ayrı bir
    // düzen — o kartların TAMAMI beyaz olduğu için metinleri koyu tutulur.
    productThumbSurface: "bg-white",
    productThumbText: "text-slate-900",
    productThumbMeta: "text-slate-500",
    cartPaymentCashActive: "border-0 bg-amber-600 text-white",
    cartPaymentCardActive: "border-0 bg-amber-600 text-white",
    cartInstallmentActive: "border-0 bg-amber-600 text-white",
    // 20+ kategori tek üst menüde sığması için varsayılandan daha sıkı
    // boşluk/dolgu — 3 satır yerine 2 satıra sığsın.
    categoryNavGap: "md:gap-1",
    categoryNavChip: (active) =>
      cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-semibold transition duration-200",
        active
          ? cn("scale-[1.02] font-bold shadow-sm", theme.activeTileBg, theme.activeTileText)
          : noirNeutrals.chipInactive,
      ),
  };
}

export const storefrontThemes: Record<StorefrontThemeKey, StorefrontTheme> =
  buildStorefrontThemes("light");

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

export function getStorefrontTheme(
  key: string,
  colorScheme: StorefrontColorScheme = "light",
): StorefrontTheme {
  return buildStorefrontThemes(colorScheme)[resolveStorefrontThemeKey(key)];
}

/** @deprecated Use StorefrontTheme */
export type StorefrontThemeClasses = StorefrontTheme;
