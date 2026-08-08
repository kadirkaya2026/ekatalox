"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { ProductEditModal } from "@/components/dashboard/product-edit-modal";
import { ProductVariantMatrixModal } from "@/components/dashboard/product-variant-matrix-modal";
import { ProductsBulkActionBar } from "@/components/dashboard/products-bulk-action-bar";
import { ProductsTable } from "@/components/dashboard/products-table";
import { ProductsToolbar } from "@/components/dashboard/products-toolbar";
import {
  buildCategoryTree,
  flattenCategoryTree,
  getDescendantCategoryIds,
} from "@/lib/categories/tree";
import { buildPackageUpgradeHref, getEffectiveProductLimit } from "@/lib/billing/plans";
import {
  buildProductFormFromProduct,
  toProductFormData,
} from "@/lib/hooks/use-product-form";
import type { Category, PriceList, Product, Tenant } from "@/lib/types";

// Büyük kataloglarda (binlerce ürün) filtrelenmiş listenin tamamını tek
// seferde DOM'a basmak sayfayı kilitliyordu — bu yüzden sadece bir sayfalık
// satırı render ediyoruz.
const PRODUCTS_PAGE_SIZE = 100;

function reorderProducts(products: Product[], fromIndex: number, toIndex: number) {
  const nextProducts = [...products];
  const [movedProduct] = nextProducts.splice(fromIndex, 1);
  nextProducts.splice(toIndex, 0, movedProduct);

  return nextProducts.map((product, index) => ({
    ...product,
    display_order: index + 1,
  }));
}

function sortProductsByDisplayOrder(productList: Product[]) {
  return [...productList].sort((left, right) => {
    if (left.display_order !== right.display_order) {
      return left.display_order - right.display_order;
    }

    return left.product_name.localeCompare(right.product_name, "tr-TR");
  });
}


export function ProductsManager({
  tenant,
  products: controlledProducts,
  onProductsUpdated,
  initialProducts,
  initialCategories,
  priceLists,
}: {
  tenant: Tenant;
  products?: Product[];
  onProductsUpdated?: (products: Product[]) => void;
  initialProducts: Product[];
  initialCategories: Category[];
  priceLists: PriceList[];
}) {
  const pricedLists = useMemo(
    () => priceLists.filter((list) => !list.is_catalog_only),
    [priceLists],
  );
  const [internalProducts, setInternalProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [variantMatrixProduct, setVariantMatrixProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
  const [inlineCategoryProductId, setInlineCategoryProductId] = useState<string | null>(null);
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [isOrderSaving, setIsOrderSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const products = controlledProducts ?? internalProducts;
  const applyProducts = onProductsUpdated ?? setInternalProducts;
  // After persisting a change, also refresh the route so the server payload
  // (used when this page is revisited from the router cache) is up to date.
  // Local component state isn't reset by refresh(), so the open page won't flicker.
  const syncProducts = (next: Product[]) => {
    applyProducts(next);
    router.refresh();
  };
  const categories = initialCategories;
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const flatCategories = useMemo(() => flattenCategoryTree(categoryTree), [categoryTree]);
  const selectedCategoryProductIds = useMemo(() => {
    if (!selectedCategoryIds.length) {
      return null;
    }

    const categoryIds = new Set(
      selectedCategoryIds.flatMap((categoryId) =>
        getDescendantCategoryIds(categories, categoryId),
      ),
    );

    return categoryIds;
  }, [categories, selectedCategoryIds]);

  const usage = useMemo(() => {
    const limit = getEffectiveProductLimit(tenant.plan ?? "baslangic", tenant.product_limit_addon);
    return {
      total: products.length,
      limit,
      remaining: Math.max(limit - products.length, 0),
      giftAddon: tenant.product_limit_addon ?? 0,
    };
  }, [products.length, tenant.plan, tenant.product_limit_addon]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const categoryMap = new Map(
      categories.map((category) => [category.id, category.name.toLowerCase()]),
    );

    const orderedProducts = [...products].sort((left, right) => {
      if (left.display_order !== right.display_order) {
        return left.display_order - right.display_order;
      }

      return left.product_name.localeCompare(right.product_name, "tr-TR");
    });

    return orderedProducts.filter((product) => {
      const matchesCategory =
        !selectedCategoryProductIds || selectedCategoryProductIds.has(product.category_id);

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        product.product_name.toLowerCase().includes(normalizedSearch) ||
        product.sku_code.toLowerCase().includes(normalizedSearch) ||
        product.currency.toLowerCase().includes(normalizedSearch) ||
        categoryMap.get(product.category_id)?.includes(normalizedSearch)
      );
    });
  }, [categories, products, searchTerm, selectedCategoryProductIds]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PAGE_SIZE));

  // Filtre değişince sayfayı 1'e sıfırla. Bir effect yerine render sırasında
  // yapılıyor (React'in "adjusting state during render" deseni) — bkz.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const filterKey = `${searchTerm}|${selectedCategoryIds.join(",")}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const currentPage = Math.min(page, pageCount);
  const pageStartIndex = (currentPage - 1) * PRODUCTS_PAGE_SIZE;
  const pagedProducts = filteredProducts.slice(pageStartIndex, pageStartIndex + PRODUCTS_PAGE_SIZE);

  const categoryNameMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const isLimitFull = usage.remaining <= 0;
  const filteredProductIds = filteredProducts.map((product) => product.id);
  const allFilteredSelected =
    filteredProductIds.length > 0 &&
    filteredProductIds.every((id) => selectedProductIds.includes(id));
  const someFilteredSelected =
    filteredProductIds.some((id) => selectedProductIds.includes(id)) &&
    !allFilteredSelected;

  function openEdit(product: Product) {
    setEditingProduct(product);
  }

  function openVariantMatrix(product: Product) {
    setVariantMatrixProduct(product);
  }

  function closeVariantMatrix() {
    setVariantMatrixProduct(null);
  }

  function toggleStock(product: Product) {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/tenant/products/toggle-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          is_in_stock: !product.is_in_stock,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Stok güncellenemedi.");
        return;
      }

      syncProducts(
        products.map((item) =>
          item.id === product.id
            ? { ...item, is_in_stock: result.product.is_in_stock }
            : item,
        ),
      );
      setMessage("Stok durumu güncellendi.");
    });
  }


  function toggleSelectProduct(productId: string) {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }

  function toggleSelectAllFiltered() {
    setSelectedProductIds((current) => {
      if (allFilteredSelected) {
        return current.filter((id) => !filteredProductIds.includes(id));
      }

      return Array.from(new Set([...current, ...filteredProductIds]));
    });
  }

  function toggleCategoryFilter(categoryId: string) {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  }

  function clearCategoryFilters() {
    setSelectedCategoryIds([]);
  }

  function handleDeleteProduct(product: Product) {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/tenant/products/${product.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Ürün silinemedi.");
        return;
      }

      const updatedProducts = products.filter((item) => item.id !== product.id);
      syncProducts(updatedProducts);
      setSelectedProductIds((current) => current.filter((id) => id !== product.id));
      setDeleteTarget(null);
      setMessage("Ürün kalıcı olarak silindi.");
    });
  }

  function handleBulkDelete() {
    if (!selectedProductIds.length) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/tenant/products/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedProductIds }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Seçilen ürünler silinemedi.");
        return;
      }

      const deletedIds = new Set<string>(result.deletedIds ?? []);
      const updatedProducts = products.filter((item) => !deletedIds.has(item.id));
      syncProducts(updatedProducts);
      setSelectedProductIds([]);
      setBulkDeleteOpen(false);
      setMessage(`${deletedIds.size} ürün kalıcı olarak silindi.`);
    });
  }

  async function saveProductOrder(
    nextProducts: Product[],
    payload:
      | { productId: string; targetOrder: number }
      | { productIds: string[] },
  ) {
    const previousProducts = products;

    syncProducts(nextProducts);
    setMessage(null);
    setIsOrderSaving(true);

    try {
      const response = await fetch("/api/tenant/products/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        syncProducts(previousProducts);
        setMessage(result.error ?? "Ürün sıralaması kaydedilemedi.");
        return;
      }

      setMessage("Ürün katalog sırası güncellendi.");
      router.refresh();
    } catch {
      syncProducts(previousProducts);
      setMessage("Ürün sıralaması kaydedilemedi.");
    } finally {
      setIsOrderSaving(false);
    }
  }

  function handleSetProductOrder(productId: string, targetOrder: number) {
    const sorted = sortProductsByDisplayOrder(products);
    const sourceIndex = sorted.findIndex((product) => product.id === productId);

    if (sourceIndex < 0) {
      return;
    }

    const targetIndex =
      Math.min(Math.max(1, Math.floor(targetOrder)), sorted.length) - 1;

    if (targetIndex === sourceIndex) {
      return;
    }

    const nextProducts = reorderProducts(sorted, sourceIndex, targetIndex);
    void saveProductOrder(nextProducts, {
      productId,
      targetOrder: targetIndex + 1,
    });
  }

  function handleMoveProduct(productId: string, direction: "up" | "down") {
    const visibleIndex = filteredProducts.findIndex((product) => product.id === productId);

    if (visibleIndex < 0) {
      return;
    }

    const targetVisibleIndex = direction === "up" ? visibleIndex - 1 : visibleIndex + 1;

    if (targetVisibleIndex < 0 || targetVisibleIndex >= filteredProducts.length) {
      return;
    }

    const targetProductId = filteredProducts[targetVisibleIndex]?.id;
    const sourceIndex = products.findIndex((product) => product.id === productId);
    const targetIndex = products.findIndex((product) => product.id === targetProductId);

    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }

    const nextProducts = reorderProducts(products, sourceIndex, targetIndex);
    void saveProductOrder(nextProducts, {
      productIds: nextProducts.map((product) => product.id),
    });
  }

  function handleProductDrop(targetProductId: string) {
    if (!draggedProductId || draggedProductId === targetProductId) {
      setDraggedProductId(null);
      return;
    }

    const sourceIndex = products.findIndex((product) => product.id === draggedProductId);
    const targetIndex = products.findIndex((product) => product.id === targetProductId);

    if (sourceIndex < 0 || targetIndex < 0) {
      setDraggedProductId(null);
      return;
    }

    const nextProducts = reorderProducts(products, sourceIndex, targetIndex);
    setDraggedProductId(null);
    void saveProductOrder(nextProducts, {
      productIds: nextProducts.map((product) => product.id),
    });
  }

  function handleInlineCategoryChange(product: Product, newCategoryId: string) {
    setInlineCategoryProductId(null);
    if (newCategoryId === product.category_id) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const formData = toProductFormData({
        ...buildProductFormFromProduct(product, priceLists),
        category_id: newCategoryId,
      });
      const response = await fetch(`/api/tenant/products/${product.id}`, {
        method: "PATCH",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Kategori güncellenemedi.");
        return;
      }

      syncProducts(
        products.map((item) =>
          item.id === product.id ? (result.product as Product) : item,
        ),
      );
      setMessage("Kategori güncellendi.");
    });
  }

  function handleBulkSetStock(is_in_stock: boolean) {
    if (!selectedProductIds.length) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/tenant/products/bulk-toggle-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedProductIds, is_in_stock }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Stok güncellenemedi.");
        return;
      }

      const updatedMap = new Map<string, Product>(
        (result.updatedProducts as Product[]).map((p) => [p.id, p]),
      );
      syncProducts(products.map((item) => updatedMap.get(item.id) ?? item));
      setSelectedProductIds([]);
      setMessage(
        `${result.updatedProducts.length} ürünün stoğu ${is_in_stock ? "açıldı" : "kapatıldı"}.`,
      );
    });
  }

  function handleBulkCategoryUpdate() {
    if (!selectedProductIds.length || !bulkCategoryId) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/tenant/products/bulk-update-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedProductIds, category_id: bulkCategoryId }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Kategoriler güncellenemedi.");
        return;
      }

      const updatedMap = new Map<string, Product>(
        (result.updatedProducts as Product[]).map((p) => [p.id, p]),
      );
      syncProducts(products.map((item) => updatedMap.get(item.id) ?? item));
      setSelectedProductIds([]);
      setBulkCategoryId("");
      setMessage(`${result.updatedProducts.length} ürünün kategorisi güncellendi.`);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Toplam ürün</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{usage.total}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Paket limiti</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{usage.limit}</p>
          {usage.giftAddon ? (
            <p className="mt-1 text-xs font-semibold text-amber-600">
              +{usage.giftAddon} hediye ürün kapasitesi
            </p>
          ) : null}
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Kalan kapasite</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{usage.remaining}</p>
        </Card>
      </div>

      {isLimitFull ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Paketiniz doldu, yeni ürün ekleyemezsiniz.
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Limitiniz {usage.limit} ürüne ulaştı. Paket yükseltebilir veya ürün
                  silerek yeniden yer açabilirsiniz.
                </p>
              </div>
            </div>
            <Button asChild href={buildPackageUpgradeHref(tenant.company_name)}>
              Paketimi Yükseltmek İstiyorum
            </Button>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <ProductsToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            flatCategories={flatCategories}
            selectedCategoryIds={selectedCategoryIds}
            onToggleCategory={toggleCategoryFilter}
            onClearCategories={clearCategoryFilters}
          />

          {selectedProductIds.length ? (
            <ProductsBulkActionBar
              selectedCount={selectedProductIds.length}
              flatCategories={flatCategories}
              bulkCategoryId={bulkCategoryId}
              onBulkCategoryChange={setBulkCategoryId}
              onApplyBulkCategory={handleBulkCategoryUpdate}
              onBulkSetStock={handleBulkSetStock}
              onRequestBulkDelete={() => setBulkDeleteOpen(true)}
              pending={pending}
            />
          ) : null}
        </div>

        <ProductsTable
          products={products}
          filteredProducts={pagedProducts}
          pageStartIndex={pageStartIndex}
          totalFilteredCount={filteredProducts.length}
          pricedLists={pricedLists}
          flatCategories={flatCategories}
          categoryNameMap={categoryNameMap}
          selectedProductIds={selectedProductIds}
          onToggleSelect={toggleSelectProduct}
          allFilteredSelected={allFilteredSelected}
          someFilteredSelected={someFilteredSelected}
          onToggleSelectAllFiltered={toggleSelectAllFiltered}
          draggedProductId={draggedProductId}
          onDragStart={setDraggedProductId}
          onDragEnd={() => setDraggedProductId(null)}
          onDrop={handleProductDrop}
          isOrderSaving={isOrderSaving}
          onSetOrder={handleSetProductOrder}
          onMoveProduct={handleMoveProduct}
          inlineCategoryProductId={inlineCategoryProductId}
          onInlineCategoryEditStart={setInlineCategoryProductId}
          onInlineCategoryEditEnd={() => setInlineCategoryProductId(null)}
          onInlineCategoryChange={handleInlineCategoryChange}
          onOpenVariantMatrix={openVariantMatrix}
          onToggleStock={toggleStock}
          onOpenEdit={openEdit}
          onRequestDelete={setDeleteTarget}
        />

        {filteredProducts.length ? (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-5 py-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              {pageStartIndex + 1}-{Math.min(pageStartIndex + PRODUCTS_PAGE_SIZE, filteredProducts.length)}
              {" / "}
              {filteredProducts.length} ürün
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="h-8 px-3 text-xs"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                Önceki
              </Button>
              <span className="text-sm text-muted-foreground">
                Sayfa {currentPage} / {pageCount}
              </span>
              <Button
                variant="secondary"
                className="h-8 px-3 text-xs"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage >= pageCount}
              >
                Sonraki
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {editingProduct ? (
        <ProductEditModal
          product={editingProduct}
          flatCategories={flatCategories}
          priceLists={priceLists}
          tenant={tenant}
          onClose={() => setEditingProduct(null)}
          onSaved={(updated) => {
            syncProducts(products.map((item) => (item.id === updated.id ? updated : item)));
            setEditingProduct(null);
            setMessage("Ürün güncellendi.");
          }}
          onError={setMessage}
        />
      ) : null}

      {variantMatrixProduct ? (
        <ProductVariantMatrixModal
          product={variantMatrixProduct}
          priceLists={priceLists}
          pricedLists={pricedLists}
          onClose={closeVariantMatrix}
          onSaved={(updated) => {
            syncProducts(products.map((item) => (item.id === updated.id ? updated : item)));
            setMessage("Varyant matrisi güncellendi.");
            closeVariantMatrix();
          }}
        />
      ) : null}

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Ürünü kalıcı olarak sil"
      >
        {deleteTarget ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-900">
                {deleteTarget.product_name}
              </p>
              <p className="mt-1 text-sm text-red-800">Model No: {deleteTarget.sku_code}</p>
              <p className="mt-3 text-sm text-red-800">
                Bu işlem geri alınamaz. Ürün kaydı ve bağlı görsel kalıcı olarak
                silinecektir.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Vazgeç
              </Button>
              <Button onClick={() => handleDeleteProduct(deleteTarget)} disabled={pending}>
                <Trash2 className="size-4" />
                Kalıcı Olarak Sil
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Seçili ürünleri kalıcı olarak sil"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">
              {selectedProductIds.length} ürün silinecek
            </p>
            <p className="mt-2 text-sm text-red-800">
              Bu işlem geri alınamaz. Seçili ürün kayıtları ve bağlı görseller
              kalıcı olarak kaldırılacaktır.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBulkDeleteOpen(false)}>
              Vazgeç
            </Button>
            <Button onClick={handleBulkDelete} disabled={pending}>
              <Trash2 className="size-4" />
              Seçilenleri Kalıcı Olarak Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}