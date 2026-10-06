"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, LayoutGrid, Store } from "lucide-react";
import type { CategoryNode } from "@/lib/categories/tree";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { cn } from "@/lib/utils";
import { StorefrontImage } from "@/components/storefront/storefront-image";

// Masaüstü kategori seçici — arama kutusunun solunda (26 Eyl 2026, tüm tenantlar).
// 6 Eki 2026: iki panelli mega menü. Solda ana kategoriler (üstüne gelince seçilir),
// sağda seçili kategorinin TÜM alt kategorileri görselli kutucuk olarak; alt
// kategorisi yoksa tek büyük "bu kategorideki ürünler" kutusu. Eski tek panelde
// alt kategoriler 4 tane soluk yazıyla sınırlıydı (Nailport geri bildirimi).

function CategoryThumb({ image, className, iconClassName }: { image: string | null; className: string; iconClassName: string }) {
  return (
    <span className={cn("relative shrink-0 overflow-hidden bg-white ring-1 ring-black/5", className)}>
      {image ? (
        <StorefrontImage src={image} alt="" className="object-contain p-1" sizes="96px" />
      ) : (
        <Store className={cn("absolute inset-0 m-auto text-slate-400", iconClassName)} />
      )}
    </span>
  );
}

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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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
  // Sağ panel: üstüne gelinen ana kategori; yoksa seçili olan; o da yoksa ilki.
  const focused =
    topCategories.find((category) => category.id === hoveredId) ?? selectedTop ?? topCategories[0] ?? null;

  const choose = (categoryId: string) => {
    onCategoryChange(categoryId);
    setOpen(false);
  };

  const muted = theme.isDark ? "text-neutral-400" : "text-slate-500";
  const tileClass = cn(
    "group flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition",
    theme.isDark
      ? "border-neutral-700 hover:border-neutral-500 hover:bg-white/5"
      : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
  );

  return (
    <div ref={rootRef} className="relative hidden shrink-0 self-stretch md:flex">
      <button
        type="button"
        onClick={() => {
          setHoveredId(null);
          setOpen((value) => !value);
        }}
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
              "flex max-h-[min(72vh,620px)] w-[min(900px,calc(100vw-3rem))] overflow-hidden p-0",
            )}
          >
            {/* Sol panel: ana kategoriler */}
            <div
              className={cn(
                "flex w-64 shrink-0 flex-col gap-1 overflow-y-auto border-r p-3",
                theme.isDark ? "border-neutral-700" : "border-slate-100",
              )}
            >
              <button
                type="button"
                onClick={() => choose("all")}
                className={cn(theme.categorySidebarItem(isAll), "gap-2")}
              >
                <LayoutGrid className="size-4" />
                {t("header.allProducts")}
              </button>
              {topCategories.map((category) => {
                const isActive = !isAll && selectedTopCategoryId === category.id;
                const isFocused = focused?.id === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onMouseEnter={() => setHoveredId(category.id)}
                    onFocus={() => setHoveredId(category.id)}
                    onClick={() => choose(category.id)}
                    className={cn(
                      theme.categorySidebarItem(isActive || isFocused),
                      "items-center gap-2.5 py-1.5 pl-1.5 text-left",
                    )}
                  >
                    <CategoryThumb
                      image={categoryImages[category.id] ?? null}
                      className="size-9 rounded-lg"
                      iconClassName="size-4"
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{category.name}</span>
                    {category.children.length ? <ChevronRight className="size-4 shrink-0 opacity-60" /> : null}
                  </button>
                );
              })}
            </div>

            {/* Sağ panel: seçili kategorinin alt kategorileri */}
            {focused ? (
              <div className="min-w-0 flex-1 overflow-y-auto p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="truncate text-lg font-bold">{focused.name}</p>
                  <button
                    type="button"
                    onClick={() => choose(focused.id)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                      theme.isDark ? "bg-white/10 hover:bg-white/15" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                    )}
                  >
                    {t("header.seeAll")}
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>

                {focused.children.length ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3">
                    {focused.children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => choose(child.id)}
                        className={cn(
                          tileClass,
                          selectedCategoryId === child.id && (theme.isDark ? "border-neutral-400" : "border-slate-400"),
                        )}
                      >
                        <CategoryThumb
                          image={categoryImages[child.id] ?? null}
                          className="aspect-square w-full rounded-xl"
                          iconClassName="size-7"
                        />
                        <span className="line-clamp-2 text-[13px] font-semibold leading-tight">{child.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => choose(focused.id)}
                    className={cn(tileClass, "w-full max-w-xs flex-row text-left")}
                  >
                    <CategoryThumb
                      image={categoryImages[focused.id] ?? null}
                      className="size-20 rounded-xl"
                      iconClassName="size-7"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{t("header.categoryAllProducts")}</span>
                      <span className={cn("mt-0.5 block text-xs", muted)}>{focused.name}</span>
                    </span>
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
