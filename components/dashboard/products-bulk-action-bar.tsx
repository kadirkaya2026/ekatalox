"use client";

import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CategoryNode } from "@/lib/categories/tree";

export function ProductsBulkActionBar({
  selectedCount,
  flatCategories,
  bulkCategoryId,
  onBulkCategoryChange,
  onApplyBulkCategory,
  onRequestBulkDelete,
  pending,
}: {
  selectedCount: number;
  flatCategories: CategoryNode[];
  bulkCategoryId: string;
  onBulkCategoryChange: (categoryId: string) => void;
  onApplyBulkCategory: () => void;
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

      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold text-red-800">
          {selectedCount} ürün seçildi. Bu işlem geri alınamaz.
        </p>
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
  );
}
