"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutGrid, Store } from "lucide-react";
import type { CategoryNode } from "@/lib/categories/tree";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { cn } from "@/lib/utils";
import { StorefrontImage } from "@/components/storefront/storefront-image";

// Masaüstü kategori seçici — arama kutusunun solunda (Amazon tarzı; 26 Eyl
// 2026, tüm tenantlar). Üst bardaki kategori satırının yerini aldı: sabit
// üst bar tek satır kalır. Açılır panelde her ana kategori görseliyle
// (categoryImages, bkz. storefront-client) ve ilk birkaç alt kategorisiyle.

const MAX_CHILDREN = 4;

export function StorefrontHeaderCategoryPicker({
  topCategories,
  selectedCategoryId,
  selectedTopCategoryId,
  categoryImages,
  onCategoryChange,
}: {
  topCategories: CategoryNode[];
  selectedCategoryId: string;
  selectedTopCategoryId: string;
  categoryImages: Record<string, string | null>;
  onCategoryChange: (categoryId: string) => void;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isAll = selectedCategoryId === "all";
  const selectedTop = topCategories.find((category) => category.id === selectedTopCategoryId);
  const label = isAll || !selectedTop ? t("header.allCategories") : selectedTop.name;

  const choose = (categoryId: string) => {
    onCategoryChange(categoryId);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative hidden shrink-0 self-stretch md:flex">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "flex max-w-[14rem] items-center gap-1.5 rounded-l-full border-r pl-4 pr-3 text-[13px] font-semibold transition",
          theme.isDark
            ? "border-neutral-600 text-neutral-100 hover:bg-white/5"
            : "border-slate-200 text-slate-800 hover:bg-slate-50",
        )}
      >
        <LayoutGrid className="size-4 shrink-0 opacity-70" />
        <span className="truncate">{label}</span>
        <ChevronDown className={cn("size-4 shrink-0 opacity-70 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-50 pt-2">
          <div
            className={cn(
              theme.categoryDropdown,
              "max-h-[min(70vh,640px)] w-[min(880px,calc(100vw-3rem))] overflow-y-auto p-3",
            )}
          >
            <button
              type="button"
              onClick={() => choose("all")}
              className={cn(theme.categorySidebarItem(isAll), "mb-2 gap-2")}
            >
              <LayoutGrid className="size-4" />
              {t("header.allProducts")}
            </button>
            <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-3">
              {topCategories.map((category) => {
                const image = categoryImages[category.id] ?? null;
                const isActive = !isAll && selectedTopCategoryId === category.id;
                return (
                  <div
                    key={category.id}
                    className={cn(theme.categorySidebarItem(isActive), "items-center gap-3 p-2")}
                  >
                    <button
                      type="button"
                      onClick={() => choose(category.id)}
                      className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-black/5"
                      aria-label={category.name}
                    >
                      {image ? (
                        <StorefrontImage src={image} alt="" className="object-contain p-1" sizes="64px" />
                      ) : (
                        <Store className="absolute inset-0 m-auto size-6 text-slate-400" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => choose(category.id)}
                        className="block w-full truncate text-left text-[13px] font-bold leading-5 hover:underline"
                      >
                        {category.name}
                      </button>
                      {category.children.length ? (
                        <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                          {category.children.slice(0, MAX_CHILDREN).map((child) => (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => choose(child.id)}
                              className={cn(
                                "max-w-full truncate text-[11px] leading-4 hover:underline",
                                selectedCategoryId === child.id ? "font-bold" : "font-medium opacity-70",
                              )}
                            >
                              {child.name}
                            </button>
                          ))}
                          {category.children.length > MAX_CHILDREN ? (
                            <button
                              type="button"
                              onClick={() => choose(category.id)}
                              className="text-[11px] font-semibold leading-4 opacity-70 hover:underline"
                            >
                              +{category.children.length - MAX_CHILDREN}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
