import type { StorefrontThemeKey } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface StorefrontThemeClasses {
  page: string;
  hero: string;
  heroPanel: string;
  heroTitle: string;
  heroDescription: string;
  heroHeading: string;
  categorySidebar: string;
  categorySidebarTitle: string;
  categorySidebarItem: (active: boolean) => string;
  categorySidebarCount: (active: boolean) => string;
  categoryChip: (active: boolean) => string;
  categoryRail: string;
  searchWrap: string;
  searchInput: string;
  searchIcon: string;
  productCard: string;
  productImageWrap: string;
  productTitle: string;
  productMeta: string;
  productPrice: string;
  stockBadgeIn: string;
  stockBadgeOut: string;
  primaryButton: string;
  stickyCart: string;
  stickyCartText: string;
  stickyCartButton: string;
  desktopCartPanel: string;
}

export const storefrontThemes: Record<StorefrontThemeKey, StorefrontThemeClasses> = {
  minimal: {
    page: "min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-900 pb-28 xl:pb-6",
    hero: "bg-white border-b border-slate-100 py-12 md:py-16",
    heroPanel: "rounded-3xl bg-slate-50 border border-slate-100 px-6 py-8 sm:px-8",
    heroTitle: "text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl",
    heroDescription: "mt-3 text-base text-slate-600 max-w-2xl leading-relaxed",
    heroHeading: "text-lg font-semibold text-emerald-800",
    categorySidebar:
      "sticky top-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm",
    categorySidebarTitle:
      "px-3 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400",
    categorySidebarItem: (active) =>
      cn(
        "flex w-full items-center justify-between gap-3 rounded-r-xl border-l-4 px-4 py-3 text-left text-sm font-semibold transition",
        active
          ? "border-slate-900 bg-slate-900/5 text-slate-950"
          : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      ),
    categorySidebarCount: (active) =>
      cn(
        "inline-flex min-w-8 items-center justify-center rounded-full px-2 py-1 text-xs font-bold transition",
        active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500",
      ),
    categoryRail: "flex max-w-full gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none whitespace-nowrap lg:flex-wrap lg:overflow-visible lg:whitespace-normal",
    categoryChip: (active) =>
      cn(
        "rounded-full px-5 py-2.5 text-sm font-semibold transition shadow-sm",
        active
          ? "bg-slate-900 text-white"
          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
      ),
    searchWrap: "relative rounded-2xl shadow-sm border border-slate-100 bg-white",
    searchInput: "pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
    searchIcon: "absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400",
    productCard:
      "group min-w-0 flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_48px_rgba(15,23,42,0.12)]",
    productImageWrap:
      "relative aspect-square w-full overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]",
    productTitle:
      "min-w-0 break-words text-[13px] font-semibold leading-5 text-slate-900 transition duration-150 line-clamp-2 group-hover:text-emerald-700 sm:text-[14px]",
    productMeta: "min-w-0 text-xs text-slate-500 line-clamp-2",
    productPrice: "min-w-0 text-lg font-bold tracking-tight text-slate-950",
    stockBadgeIn:
      "inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700",
    stockBadgeOut:
      "inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 shadow-sm",
    primaryButton: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl shadow-sm transition",
    stickyCart: "fixed bottom-4 inset-x-4 z-30 rounded-2xl bg-slate-900 text-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.16)] md:bottom-6 max-w-lg mx-auto border border-white/10",
    stickyCartText: "text-white font-bold",
    stickyCartButton: "bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition px-5 py-3",
    desktopCartPanel: "sticky top-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm",
  },
  "premium-dark": {
    page: "min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 pb-28 xl:pb-6",
    hero: "bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 py-12 md:py-16",
    heroPanel: "rounded-3xl bg-slate-900/60 border border-slate-800/80 px-6 py-8 sm:px-8",
    heroTitle: "text-3xl font-extrabold tracking-tight text-white md:text-4xl",
    heroDescription: "mt-3 text-base text-slate-400 max-w-2xl leading-relaxed",
    heroHeading: "text-lg font-semibold text-emerald-400",
    categorySidebar:
      "sticky top-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-sm",
    categorySidebarTitle:
      "px-3 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500",
    categorySidebarItem: (active) =>
      cn(
        "flex w-full items-center justify-between gap-3 rounded-r-xl border-l-4 px-4 py-3 text-left text-sm font-semibold transition",
        active
          ? "border-emerald-400 bg-emerald-500/10 text-white"
          : "border-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white",
      ),
    categorySidebarCount: (active) =>
      cn(
        "inline-flex min-w-8 items-center justify-center rounded-full px-2 py-1 text-xs font-bold transition",
        active ? "bg-emerald-400 text-slate-950" : "bg-slate-800 text-slate-400",
      ),
    categoryRail: "flex max-w-full gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none whitespace-nowrap lg:flex-wrap lg:overflow-visible lg:whitespace-normal",
    categoryChip: (active) =>
      cn(
        "rounded-full px-5 py-2.5 text-sm font-semibold transition shadow-sm",
        active
          ? "bg-emerald-500 text-slate-950"
          : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800",
      ),
    searchWrap: "relative rounded-2xl shadow-sm border border-slate-800 bg-slate-900/80",
    searchInput: "pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 text-white placeholder:text-slate-500 bg-transparent",
    searchIcon: "absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-500",
    productCard:
      "group min-w-0 flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-900 bg-slate-900/70 shadow-[0_14px_36px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900 hover:shadow-[0_24px_56px_rgba(0,0,0,0.32)]",
    productImageWrap:
      "relative aspect-square w-full overflow-hidden bg-[linear-gradient(180deg,rgba(2,6,23,0.95)_0%,rgba(15,23,42,0.88)_100%)]",
    productTitle:
      "min-w-0 break-words text-[13px] font-semibold leading-5 text-slate-100 transition duration-150 line-clamp-2 group-hover:text-emerald-400 sm:text-[14px]",
    productMeta: "min-w-0 text-xs text-slate-500 line-clamp-2",
    productPrice: "min-w-0 text-lg font-bold tracking-tight text-emerald-400",
    stockBadgeIn:
      "inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400",
    stockBadgeOut:
      "inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-300 shadow-sm",
    primaryButton: "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 rounded-xl shadow-sm transition font-bold",
    stickyCart: "fixed bottom-4 inset-x-4 z-30 rounded-2xl bg-slate-900 text-white p-4 shadow-[0_16px_40px_rgba(0,0,0,0.4)] md:bottom-6 max-w-lg mx-auto border border-emerald-500/20",
    stickyCartText: "text-emerald-400 font-bold",
    stickyCartButton: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition px-5 py-3 font-bold",
    desktopCartPanel: "sticky top-6 rounded-2xl border border-slate-900 bg-slate-900/60 p-5 shadow-sm",
  },
  "soft-commerce": {
    page: "min-h-screen w-full max-w-full overflow-x-hidden bg-rose-50/20 text-slate-800 pb-28 xl:pb-6",
    hero: "bg-gradient-to-b from-rose-50/40 to-transparent py-12 md:py-16",
    heroPanel: "rounded-3xl bg-white border border-rose-100/60 px-6 py-8 sm:px-8 shadow-sm",
    heroTitle: "text-3xl font-bold tracking-tight text-rose-950 md:text-4xl",
    heroDescription: "mt-3 text-base text-slate-600 max-w-2xl leading-relaxed",
    heroHeading: "text-lg font-semibold text-rose-700",
    categorySidebar:
      "sticky top-6 rounded-2xl border border-rose-100/80 bg-white p-3 shadow-sm",
    categorySidebarTitle:
      "px-3 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-300",
    categorySidebarItem: (active) =>
      cn(
        "flex w-full items-center justify-between gap-3 rounded-r-xl border-l-4 px-4 py-3 text-left text-sm font-semibold transition",
        active
          ? "border-rose-700 bg-rose-50 text-rose-950"
          : "border-transparent text-slate-600 hover:bg-rose-50/70 hover:text-rose-800",
      ),
    categorySidebarCount: (active) =>
      cn(
        "inline-flex min-w-8 items-center justify-center rounded-full px-2 py-1 text-xs font-bold transition",
        active ? "bg-rose-700 text-white" : "bg-rose-50 text-rose-500",
      ),
    categoryRail: "flex max-w-full gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none whitespace-nowrap lg:flex-wrap lg:overflow-visible lg:whitespace-normal",
    categoryChip: (active) =>
      cn(
        "rounded-full px-5 py-2.5 text-sm font-semibold transition shadow-sm",
        active
          ? "bg-rose-700 text-white"
          : "bg-white border border-rose-100 text-slate-600 hover:bg-rose-50/40",
      ),
    searchWrap: "relative rounded-2xl shadow-sm border border-rose-100/80 bg-white",
    searchInput: "pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400",
    searchIcon: "absolute left-4 top-1/2 -translate-y-1/2 size-5 text-rose-300",
    productCard:
      "group min-w-0 flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-rose-100/50 bg-white shadow-[0_12px_32px_rgba(76,5,25,0.06)] transition duration-300 hover:-translate-y-1 hover:border-rose-200/80 hover:shadow-[0_20px_48px_rgba(76,5,25,0.12)]",
    productImageWrap:
      "relative aspect-square w-full overflow-hidden bg-[linear-gradient(180deg,rgba(255,241,242,0.72)_0%,rgba(255,255,255,1)_100%)]",
    productTitle:
      "min-w-0 break-words text-[13px] font-semibold leading-5 text-slate-800 transition duration-150 line-clamp-2 group-hover:text-rose-700 sm:text-[14px]",
    productMeta: "min-w-0 text-xs text-rose-400 line-clamp-2",
    productPrice: "min-w-0 text-lg font-bold tracking-tight text-rose-800",
    stockBadgeIn:
      "inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700",
    stockBadgeOut:
      "inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 shadow-sm",
    primaryButton: "bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white rounded-xl shadow-sm transition",
    stickyCart: "fixed bottom-4 inset-x-4 z-30 rounded-2xl bg-rose-950 text-white p-4 shadow-[0_16px_40px_rgba(76,5,25,0.16)] md:bottom-6 max-w-lg mx-auto border border-rose-800/10",
    stickyCartText: "text-rose-100 font-bold",
    stickyCartButton: "bg-rose-700 hover:bg-rose-600 text-white rounded-xl transition px-5 py-3",
    desktopCartPanel: "sticky top-6 rounded-2xl border border-rose-100/60 bg-white p-5 shadow-sm",
  },
};
