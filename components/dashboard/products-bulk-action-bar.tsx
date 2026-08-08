"use client";

import { Check, PackageCheck, PackageX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CategoryNode } from "@/lib/categories/tree";

export function ProductsBulkActionBar({
  selectedCount,
  flatCategories,
  bulkCategoryId,
  onBulkCategoryChange,
  onApplyBulkCategory,
  onBulkSetStock,
  onRequestBulkDelete,
  pending,
}: {
  selectedCount: number;
  flatCategories: CategoryNode[];
  bulkCategoryId: string;
  onBulkCategoryChange: (categoryId: string) => void;
  onApplyBulkCategory: () => void;
  onBulkSetStock: (is_in_stock: boolean) => void;
  onRequestBulkDelete: () => void;
  pending: boolean;
}) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold text-blue-800">
          {selectedCount} ürün seçildi — Kategori değiştir:
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={bulkCategoryId}
            onChange={(event) => onBulkCategoryChange(event.target.value)}
            className="rounded-lg border border-blue-200 bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Kategori seçin</option>
            {flatCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {"— ".repeat(category.depth)}
                {category.name}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            className="border-blue-200 bg-card text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            onClick={onApplyBulkCategory}
            disabled={!bulkCategoryId || pending}
          >
            <Check className="size-4" />
            Tümüne Uygula
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold text-foreground">{selectedCount} ürün seçildi</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="border-emerald-200 bg-card text-emerald-700 hover:bg-emerald-50"
            onClick={() => onBulkSetStock(true)}
            disabled={pending}
          >
            <PackageCheck className="size-4" />
            Stoğu Aç
          </Button>
          <Button
            variant="secondary"
            className="border-slate-200 bg-card text-muted-foreground hover:bg-slate-100"
            onClick={() => onBulkSetStock(false)}
            disabled={pending}
          >
            <PackageX className="size-4" />
            Stoğu Kapat
          </Button>
          <Button
            variant="secondary"
            className="border-red-200 bg-card text-red-700 hover:bg-red-100"
            onClick={onRequestBulkDelete}
            disabled={pending}
          >
            <Trash2 className="size-4" />
            Seçilenleri Sil
          </Button>
        </div>
      </div>
    </div>
  );
}
