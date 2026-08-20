"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, Check, ChevronDown, ListFilter } from "lucide-react";
import type { ProductStockFilter } from "@/lib/products/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CategoryNode } from "@/lib/categories/tree";
import { cn } from "@/lib/utils";

const STOCK_FILTER_OPTIONS: { value: ProductStockFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "in_stock", label: "Stokta var" },
  { value: "out_of_stock", label: "Stok kapalı" },
];

export function ProductsToolbar({
  searchTerm,
  onSearchChange,
  flatCategories,
  selectedCategoryIds,
  onToggleCategory,
  onClearCategories,
  stockFilter,
  onStockFilterChange,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  flatCategories: CategoryNode[];
  selectedCategoryIds: string[];
  onToggleCategory: (categoryId: string) => void;
  onClearCategories: () => void;
  stockFilter: ProductStockFilter;
  onStockFilterChange: (value: ProductStockFilter) => void;
}) {
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const categoryFilterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!categoryFilterRef.current?.contains(event.target as Node)) {
        setCategoryFilterOpen(false);
      }
    }

    if (!categoryFilterOpen) {
      return;
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [categoryFilterOpen]);

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Mevcut ürünler</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Masaüstünde tablo, mobilde kart düzeni ile hızlı yönetim.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl lg:justify-end">
          <div className="w-full lg:max-w-md">
            <Input
              placeholder="Ürün adı veya model no ara"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-auto" ref={categoryFilterRef}>
            <Button
              variant="secondary"
              className="h-11 w-full justify-between gap-2 px-4 text-sm sm:h-10 sm:w-auto"
              onClick={() => setCategoryFilterOpen((current) => !current)}
            >
              <span className="inline-flex items-center gap-2">
                <ListFilter className="size-4" />
                {selectedCategoryIds.length
                  ? `Kategori (${selectedCategoryIds.length})`
                  : "Kategori filtrele"}
              </span>
              <ChevronDown
                className={cn("size-4 transition-transform", categoryFilterOpen && "rotate-180")}
              />
            </Button>

            {categoryFilterOpen ? (
              <div className="absolute right-0 top-full z-20 mt-2 w-full min-w-[18rem] rounded-xl border border-border bg-card p-3 shadow-lg sm:w-80">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Kategorilere göre filtrele
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      İşaretli kategorilerdeki ürünler listelenir.
                    </p>
                  </div>
                  {selectedCategoryIds.length ? (
                    <button
                      type="button"
                      onClick={onClearCategories}
                      className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
                    >
                      Temizle
                    </button>
                  ) : null}
                </div>

                {flatCategories.length ? (
                  <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
                    {flatCategories.map((category) => {
                      const checked = selectedCategoryIds.includes(category.id);

                      return (
                        <label
                          key={category.id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-muted/60"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggleCategory(category.id)}
                            className="size-4 rounded border-slate-300 text-emerald-600"
                          />
                          <span
                            className="min-w-0 text-sm text-muted-foreground"
                            style={{ paddingLeft: `${category.depth * 12}px` }}
                          >
                            {category.name}
                          </span>
                          {checked ? <Check className="ml-auto size-4 text-emerald-600" /> : null}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Henüz kategori bulunmuyor.</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Satış durumu filtresi: is_in_stock=false ürünler vitrinde sipariş
          edilemiyor, tenant admin bunları tek tıkla ayıklayıp toplu
          "Stok Aç" uygulayabilsin diye. */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Satış durumu</span>
        <div
          role="group"
          aria-label="Satış durumuna göre filtrele"
          className="inline-flex rounded-lg border border-border bg-muted/60 p-1"
        >
          {STOCK_FILTER_OPTIONS.map((option) => {
            const active = stockFilter === option.value;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => onStockFilterChange(option.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-semibold transition",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {stockFilter !== "all" ? (
          <span className="text-xs text-muted-foreground">
            {stockFilter === "in_stock"
              ? "Sadece satışa açık ürünler listeleniyor."
              : "Sadece satışa kapalı ürünler listeleniyor."}
          </span>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl border border-border bg-muted/60 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-card p-2 text-muted-foreground shadow-sm">
            <ArrowUpDown className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Katalog Sıralaması</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ürünleri sürükleyip bırakın, yukarı/aşağı butonlarıyla veya sıra numarasını
              yazarak sıralayın. Bu genel sıralama anasayfa ve kategori listelerindeki
              varsayılan ürün dizilimini belirler. Anasayfada öne çıkan özel bölümler
              oluşturmak isterseniz «Öne Çıkan Bölümler» sayfasını kullanın.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
