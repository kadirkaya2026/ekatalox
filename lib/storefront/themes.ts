import type { StorefrontThemeKey } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface StorefrontThemeClasses {
  page: string;
  hero: string;
  heroPanel: string;
  heroTitle: string;
  heroDescription: string;
  heroHeading: string;
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
    page: "bg-slate-50 min-h-screen text-slate-900 pb-28 xl:pb-6",
    hero: "bg-white border-b border-slate-100 py-12 md:py-16",
    heroPanel: "rounded-3xl bg-slate-50 border border-slate-100 px-6 py-8 sm:px-8",
    heroTitle: "text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl",
    heroDescription: "mt-3 text-base text-slate-600 max-w-2xl leading-relaxed",
    heroHeading: "text-lg font-semibold text-emerald-800",
    categoryRail: "flex gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none whitespace-nowrap",
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
    productCard: "group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition duration-200",
    productImageWrap: "relative aspect-square w-full overflow-hidden bg-slate-50",
    productTitle: "font-semibold text-slate-900 group-hover:text-emerald-700 transition duration-150 line-clamp-2",
    productMeta: "text-xs text-slate-500",
    productPrice: "text-lg font-bold text-slate-950",
    stockBadgeIn: "bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 text-xs rounded-full",
    stockBadgeOut: "bg-slate-100 text-slate-500 font-semibold px-2.5 py-1 text-xs rounded-full",
    primaryButton: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl shadow-sm transition",
    stickyCart: "fixed bottom-4 inset-x-4 z-40 rounded-2xl bg-slate-900 text-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.16)] md:bottom-6 max-w-lg mx-auto border border-white/10",
    stickyCartText: "text-white font-bold",
    stickyCartButton: "bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition px-5 py-3",
    desktopCartPanel: "sticky top-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm",
  },
  "premium-dark": {
    page: "bg-slate-950 min-h-screen text-slate-100 pb-28 xl:pb-6",
    hero: "bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 py-12 md:py-16",
    heroPanel: "rounded-3xl bg-slate-900/60 border border-slate-800/80 px-6 py-8 sm:px-8",
    heroTitle: "text-3xl font-extrabold tracking-tight text-white md:text-4xl",
    heroDescription: "mt-3 text-base text-slate-400 max-w-2xl leading-relaxed",
    heroHeading: "text-lg font-semibold text-emerald-400",
    categoryRail: "flex gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none whitespace-nowrap",
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
    productCard: "group flex flex-col overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/60 hover:border-slate-800/80 hover:bg-slate-900 transition duration-200",
    productImageWrap: "relative aspect-square w-full overflow-hidden bg-slate-950/80",
    productTitle: "font-semibold text-slate-100 group-hover:text-emerald-400 transition duration-150 line-clamp-2",
    productMeta: "text-xs text-slate-500",
    productPrice: "text-lg font-bold text-emerald-400",
    stockBadgeIn: "bg-emerald-500/10 text-emerald-400 font-semibold px-2.5 py-1 text-xs rounded-full",
    stockBadgeOut: "bg-slate-800 text-slate-500 font-semibold px-2.5 py-1 text-xs rounded-full",
    primaryButton: "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 rounded-xl shadow-sm transition font-bold",
    stickyCart: "fixed bottom-4 inset-x-4 z-40 rounded-2xl bg-slate-900 text-white p-4 shadow-[0_16px_40px_rgba(0,0,0,0.4)] md:bottom-6 max-w-lg mx-auto border border-emerald-500/20",
    stickyCartText: "text-emerald-400 font-bold",
    stickyCartButton: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition px-5 py-3 font-bold",
    desktopCartPanel: "sticky top-6 rounded-2xl border border-slate-900 bg-slate-900/60 p-5 shadow-sm",
  },
  "soft-commerce": {
    page: "bg-rose-50/20 min-h-screen text-slate-800 pb-28 xl:pb-6",
    hero: "bg-gradient-to-b from-rose-50/40 to-transparent py-12 md:py-16",
    heroPanel: "rounded-3xl bg-white border border-rose-100/60 px-6 py-8 sm:px-8 shadow-sm",
    heroTitle: "text-3xl font-bold tracking-tight text-rose-950 md:text-4xl",
    heroDescription: "mt-3 text-base text-slate-600 max-w-2xl leading-relaxed",
    heroHeading: "text-lg font-semibold text-rose-700",
    categoryRail: "flex gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none whitespace-nowrap",
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
    productCard: "group flex flex-col overflow-hidden rounded-2xl border border-rose-100/40 bg-white hover:border-rose-200/60 shadow-sm hover:shadow-md transition duration-200",
    productImageWrap: "relative aspect-square w-full overflow-hidden bg-rose-50/10",
    productTitle: "font-semibold text-slate-800 group-hover:text-rose-700 transition duration-150 line-clamp-2",
    productMeta: "text-xs text-rose-400",
    productPrice: "text-lg font-bold text-rose-800",
    stockBadgeIn: "bg-rose-50 text-rose-700 font-semibold px-2.5 py-1 text-xs rounded-full",
    stockBadgeOut: "bg-slate-100 text-slate-500 font-semibold px-2.5 py-1 text-xs rounded-full",
    primaryButton: "bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white rounded-xl shadow-sm transition",
    stickyCart: "fixed bottom-4 inset-x-4 z-40 rounded-2xl bg-rose-950 text-white p-4 shadow-[0_16px_40px_rgba(76,5,25,0.16)] md:bottom-6 max-w-lg mx-auto border border-rose-800/10",
    stickyCartText: "text-rose-100 font-bold",
    stickyCartButton: "bg-rose-700 hover:bg-rose-600 text-white rounded-xl transition px-5 py-3",
    desktopCartPanel: "sticky top-6 rounded-2xl border border-rose-100/60 bg-white p-5 shadow-sm",
  },
};
