"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Layers,
  PackageCheck,
  PackageX,
  PencilLine,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableWrapper } from "@/components/ui/table";
import type { CategoryNode } from "@/lib/categories/tree";
import { getPriceListDisplayName } from "@/lib/price-lists/constants";
import { getProductDisplayPriceForList } from "@/lib/products/variant-pricing";
import type { PriceList, Product } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

function ProductOrderInput({
  displayOrder,
  maxOrder,
  disabled,
  productName,
  onCommit,
}: {
  displayOrder: number;
  maxOrder: number;
  disabled?: boolean;
  productName: string;
  onCommit: (targetOrder: number) => void;
}) {
  const [draft, setDraft] = useState(String(displayOrder));
  const [isEditing, setIsEditing] = useState(false);
  const [syncedDisplayOrder, setSyncedDisplayOrder] = useState(displayOrder);

  // Ürün başka bir yerden (sürükle-bırak, toplu sıralama) yeniden sıralanırsa
  // bu satırın taslak değerini güncel tut — kullanıcı bu satırı aktif olarak
  // düzenliyorsa dokunma.
  if (displayOrder !== syncedDisplayOrder && !isEditing) {
    setSyncedDisplayOrder(displayOrder);
    setDraft(String(displayOrder));
  }

  function commit() {
    const parsed = Number.parseInt(draft, 10);

    if (!Number.isFinite(parsed) || parsed < 1 || parsed > maxOrder) {
      setDraft(String(displayOrder));
      setIsEditing(false);
      return;
    }

    onCommit(parsed);
    setIsEditing(false);
  }

  function cancel() {
    setDraft(String(displayOrder));
    setIsEditing(false);
  }

  return (
    <input
      type="number"
      min={1}
      max={maxOrder}
      inputMode="numeric"
      value={draft}
      disabled={disabled}
      aria-label={`${productName} katalog sırası`}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={() => setIsEditing(true)}
      onBlur={commit}
      onKeyDown={(event) => {
        event.stopPropagation();

        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }

        if (event.key === "Escape") {
          event.preventDefault();
          cancel();
        }
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      className="w-14 rounded-md border border-border bg-card px-2 py-1 text-center text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

function renderProductListPrice(product: Product, priceListId: string) {
  const display = getProductDisplayPriceForList(product, priceListId);

  return (
    <div>
      <p className="font-semibold text-foreground">
        {formatCurrency(display.price ?? 0, product.currency)}
      </p>
      {display.price_from ? <p className="text-xs text-muted-foreground">modelden</p> : null}
    </div>
  );
}

function renderStockBadge(product: Product) {
  return (
    <Badge
      className={cn(
        product.is_in_stock
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-muted-foreground",
      )}
    >
      {product.is_in_stock ? "Stokta var" : "Stok kapalı"}
    </Badge>
  );
}

function renderVariantCountBadge(product: Product) {
  const variantCount = product.variants?.length ?? 0;

  if (!variantCount) {
    return <Badge className="bg-slate-100 text-muted-foreground">Tek ürün</Badge>;
  }

  return <Badge className="bg-blue-50 text-blue-700">{variantCount} model</Badge>;
}

export function ProductsTable({
  grandTotal,
  filteredProducts,
  pageStartIndex = 0,
  totalFilteredCount,
  pricedLists,
  flatCategories,
  categoryNameMap,
  selectedProductIds,
  onToggleSelect,
  allFilteredSelected,
  someFilteredSelected,
  onToggleSelectAllFiltered,
  draggedProductId,
  onDragStart,
  onDragEnd,
  onDrop,
  isOrderSaving,
  onSetOrder,
  onMoveProduct,
  inlineCategoryProductId,
  onInlineCategoryEditStart,
  onInlineCategoryEditEnd,
  onInlineCategoryChange,
  onOpenVariantMatrix,
  onToggleStock,
  onOpenEdit,
  onRequestDelete,
}: {
  grandTotal: number;
  filteredProducts: Product[];
  pageStartIndex?: number;
  totalFilteredCount?: number;
  pricedLists: PriceList[];
  flatCategories: CategoryNode[];
  categoryNameMap: Map<string, string>;
  selectedProductIds: string[];
  onToggleSelect: (productId: string) => void;
  allFilteredSelected: boolean;
  someFilteredSelected: boolean;
  onToggleSelectAllFiltered: () => void;
  draggedProductId: string | null;
  onDragStart: (productId: string) => void;
  onDragEnd: () => void;
  onDrop: (targetProductId: string) => void;
  isOrderSaving: boolean;
  onSetOrder: (productId: string, targetOrder: number) => void;
  onMoveProduct: (productId: string, direction: "up" | "down") => void;
  inlineCategoryProductId: string | null;
  onInlineCategoryEditStart: (productId: string) => void;
  onInlineCategoryEditEnd: () => void;
  onInlineCategoryChange: (product: Product, newCategoryId: string) => void;
  onOpenVariantMatrix: (product: Product) => void;
  onToggleStock: (product: Product) => void;
  onOpenEdit: (product: Product) => void;
  onRequestDelete: (product: Product) => void;
}) {
  const resolvedTotalCount = totalFilteredCount ?? filteredProducts.length;

  return (
    <>
      <TableWrapper>
        <Table>
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  ref={(element) => {
                    if (element) {
                      element.indeterminate = someFilteredSelected;
                    }
                  }}
                  onChange={onToggleSelectAllFiltered}
                  aria-label="Tüm filtrelenmiş ürünleri seç"
                />
              </th>
              <th className="px-4 py-3">Sıra</th>
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Stok</th>
              <th className="px-4 py-3">Model</th>
              {pricedLists.map((list) => (
                <th key={list.id} className="px-4 py-3">
                  {getPriceListDisplayName(list)}
                </th>
              ))}
              <th className="sticky right-0 z-10 border-l border-border bg-muted/60 px-4 py-3 text-right">
                Aksiyon
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product, index) => (
              <tr
                key={product.id}
                className={cn(
                  "border-t border-border",
                  draggedProductId === product.id && "bg-emerald-50/60",
                )}
                draggable
                onDragStart={() => onDragStart(product.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => onDrop(product.id)}
                onDragEnd={onDragEnd}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(product.id)}
                    onChange={() => onToggleSelect(product.id)}
                    aria-label={`${product.product_name} seç`}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-border bg-card p-2 text-slate-400">
                      <GripVertical className="size-4" />
                    </div>
                    <div>
                      <ProductOrderInput
                        displayOrder={product.display_order}
                        maxOrder={grandTotal}
                        disabled={isOrderSaving}
                        productName={product.product_name}
                        onCommit={(targetOrder) => onSetOrder(product.id, targetOrder)}
                      />
                      <div className="mt-1 flex gap-1">
                        <button
                          type="button"
                          onClick={() => onMoveProduct(product.id, "up")}
                          disabled={index === 0 || isOrderSaving}
                          className="rounded-md border border-border px-2 py-1 text-muted-foreground transition hover:bg-muted/60 disabled:opacity-40"
                          aria-label={`${product.product_name} yukarı taşı`}
                        >
                          <ArrowUp className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveProduct(product.id, "down")}
                          disabled={index === filteredProducts.length - 1 || isOrderSaving}
                          className="rounded-md border border-border px-2 py-1 text-muted-foreground transition hover:bg-muted/60 disabled:opacity-40"
                          aria-label={`${product.product_name} aşağı taşı`}
                        >
                          <ArrowDown className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-slate-100">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.product_name}
                          fill
                          className="object-cover"
                          sizes="56px"
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{product.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.sku_code} • {product.currency}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {inlineCategoryProductId === product.id ? (
                    <select
                      autoFocus
                      value={product.category_id}
                      onChange={(event) => onInlineCategoryChange(product, event.target.value)}
                      onBlur={onInlineCategoryEditEnd}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") onInlineCategoryEditEnd();
                      }}
                      className="rounded-lg border border-emerald-300 bg-card px-2 py-1.5 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      <option value="">Kategori seçin</option>
                      {flatCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {"— ".repeat(category.depth)}
                          {category.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onInlineCategoryEditStart(product.id)}
                      className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-slate-100"
                      title="Tıkla ve değiştir"
                    >
                      <span>{categoryNameMap.get(product.category_id) ?? "—"}</span>
                      <PencilLine className="size-3.5 text-slate-400 opacity-0 transition group-hover:opacity-100" />
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">{renderStockBadge(product)}</td>
                <td className="px-4 py-3">{renderVariantCountBadge(product)}</td>
                {pricedLists.map((list) => (
                  <td key={list.id} className="px-4 py-3 text-base">
                    {renderProductListPrice(product, list.id)}
                  </td>
                ))}
                <td
                  className={cn(
                    "sticky right-0 z-10 border-l border-border bg-card px-2 py-3 align-top",
                    draggedProductId === product.id && "bg-emerald-50/60",
                  )}
                >
                  <div className="ml-auto grid w-[9.5rem] grid-cols-2 gap-1">
                    <Button
                      variant="secondary"
                      className="h-11 w-full flex-col justify-center gap-0.5 px-0.5 text-[9px] font-semibold leading-[1.1]"
                      onClick={() => onOpenVariantMatrix(product)}
                      title="Model matrisini düzenle"
                      aria-label="Model matrisini düzenle"
                    >
                      <Layers className="size-3.5 shrink-0" />
                      <span className="text-center">Model</span>
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-11 w-full flex-col justify-center gap-0.5 px-0.5 text-[9px] font-semibold leading-[1.1]"
                      onClick={() => onToggleStock(product)}
                      title={product.is_in_stock ? "Stoğu kapat" : "Stoğu aç"}
                      aria-label={product.is_in_stock ? "Stoğu kapat" : "Stoğu aç"}
                    >
                      {product.is_in_stock ? (
                        <PackageX className="size-3.5 shrink-0" />
                      ) : (
                        <PackageCheck className="size-3.5 shrink-0" />
                      )}
                      <span className="text-center">
                        {product.is_in_stock ? "Stok Kapat" : "Stok Aç"}
                      </span>
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-11 w-full flex-col justify-center gap-0.5 px-0.5 text-[9px] font-semibold leading-[1.1]"
                      onClick={() => onOpenEdit(product)}
                      title="Ürünü düzenle"
                      aria-label="Ürünü düzenle"
                    >
                      <PencilLine className="size-3.5 shrink-0" />
                      <span className="text-center">Düzenle</span>
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-11 w-full flex-col justify-center gap-0.5 border-red-200 px-0.5 text-[9px] font-semibold leading-[1.1] text-red-700 hover:bg-red-50"
                      onClick={() => onRequestDelete(product)}
                      title="Ürünü kalıcı olarak sil"
                      aria-label="Ürünü kalıcı olarak sil"
                    >
                      <Trash2 className="size-3.5 shrink-0" />
                      <span className="text-center">Sil</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrapper>

      {!filteredProducts.length ? (
        <div className="border-t border-border px-5 py-8 text-center">
          <p className="text-sm font-semibold text-foreground">
            Filtrelerinize uygun ürün bulunamadı.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Kategori seçimini temizleyin veya ürün adı, model no ya da para birimi ile tekrar
            deneyin.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 p-4 md:hidden">
        {filteredProducts.map((product, index) => (
          <Card key={product.id} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(product.id)}
                  onChange={() => onToggleSelect(product.id)}
                />
                Seç
              </label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GripVertical className="size-4" />
                <span className="shrink-0">Sıra</span>
                <ProductOrderInput
                  displayOrder={product.display_order}
                  maxOrder={grandTotal}
                  disabled={isOrderSaving}
                  productName={product.product_name}
                  onCommit={(targetOrder) => onSetOrder(product.id, targetOrder)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-slate-100">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.product_name}
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{product.product_name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {product.sku_code} • {product.currency}
                </p>
                <div className="mt-2">
                  {inlineCategoryProductId === product.id ? (
                    <select
                      autoFocus
                      value={product.category_id}
                      onChange={(event) => onInlineCategoryChange(product, event.target.value)}
                      onBlur={onInlineCategoryEditEnd}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") onInlineCategoryEditEnd();
                      }}
                      className="w-full rounded-lg border border-emerald-300 bg-card px-2 py-1.5 text-sm text-foreground"
                    >
                      <option value="">Kategori seçin</option>
                      {flatCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {"— ".repeat(category.depth)}
                          {category.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onInlineCategoryEditStart(product.id)}
                      className="flex items-center gap-1 text-sm text-muted-foreground underline-offset-2 hover:underline"
                    >
                      <span>{categoryNameMap.get(product.category_id) ?? "Kategori yok"}</span>
                      <PencilLine className="size-3 text-slate-400" />
                    </button>
                  )}
                </div>
                <div className="mt-2">{renderStockBadge(product)}</div>
                <div className="mt-2">{renderVariantCountBadge(product)}</div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => onMoveProduct(product.id, "up")}
                disabled={index === 0 || isOrderSaving}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground disabled:opacity-40"
              >
                Yukarı taşı
              </button>
              <button
                type="button"
                onClick={() => onMoveProduct(product.id, "down")}
                disabled={index === filteredProducts.length - 1 || isOrderSaving}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground disabled:opacity-40"
              >
                Aşağı taşı
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl bg-muted/60 p-3 sm:grid-cols-3">
              {pricedLists.map((list) => (
                <div key={list.id} className="text-center">
                  <p className="text-xs text-muted-foreground">{getPriceListDisplayName(list)}</p>
                  <div className="mt-1 text-sm">{renderProductListPrice(product, list.id)}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => onOpenVariantMatrix(product)}>
                Model
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => onToggleStock(product)}>
                {product.is_in_stock ? "Stoğu kapat" : "Stoğu aç"}
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => onOpenEdit(product)}>
                Düzenle
              </Button>
              <Button
                variant="secondary"
                className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => onRequestDelete(product)}
              >
                Sil
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
