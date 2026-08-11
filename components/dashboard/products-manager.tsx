"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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

// Büyük kataloglarda (binlerce ürün) tüm tabloyu her sayfa açılışında
// sunucudan çekip tarayıcıda tutmak sayfayı kilitliyordu — bu yüzden arama,
// kategori filtresi ve sayfalama artık sunucu tarafında (bkz.
// getTenantProductsPage), her seferinde sadece bir sayfalık satır geliyor.
const PRODUCTS_PAGE_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 350;

export function ProductsManager({
  tenant,
  initialProducts,
  initialTotal,
  initialCategories,
  priceLists,
}: {
  tenant: Tenant;
  initialProducts: Product[];
  initialTotal: number;
  initialCategories: Category[];
  priceLists: PriceList[];
}) {
  const pricedLists = useMemo(
    () => priceLists.filter((list) => !list.is_catalog_only),
    [priceLists],
  );
  const [products, setProducts] = useState(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [grandTotal, setGrandTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTermRaw] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
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
  const categories = initialCategories;
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const flatCategories = useMemo(() => flattenCategoryTree(categoryTree), [categoryTree]);

  const expandedCategoryIds = useMemo(() => {
    if (!selectedCategoryIds.length) return [];
    const ids = new Set(
      selectedCategoryIds.flatMap((categoryId) => getDescendantCategoryIds(categories, categoryId)),
    );
    return Array.from(ids);
  }, [categories, selectedCategoryIds]);

  // Arama metni bir kategori adıyla eşleşiyorsa (ör. "viski") o kategorideki
  // ürünler de sonuca dahil olsun — bkz. getTenantProductsPage'in
  // matchCategoryIds parametresi.
  const matchCategoryIds = useMemo(() => {
    const term = debouncedSearchTerm.trim().toLowerCase();
    if (!term) return [];
    return categories.filter((category) => category.name.toLowerCase().includes(term)).map((c) => c.id);
  }, [categories, debouncedSearchTerm]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchTerm(searchTerm), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const usage = useMemo(() => {
    const limit = getEffectiveProductLimit(tenant.plan ?? "baslangic", tenant.product_limit_addon);
    return {
      total: grandTotal,
      limit,
      remaining: Math.max(limit - grandTotal, 0),
      giftAddon: tenant.product_limit_addon ?? 0,
    };
  }, [grandTotal, tenant.plan, tenant.product_limit_addon]);

  async function fetchPage(targetPage: number) {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      if (debouncedSearchTerm.trim()) params.set("q", debouncedSearchTerm.trim());
      if (expandedCategoryIds.length) params.set("categoryIds", expandedCategoryIds.join(","));
      if (matchCategoryIds.length) params.set("matchCategoryIds", matchCategoryIds.join(","));

      const response = await fetch(`/api/tenant/products?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Ürünler yüklenemedi.");
        return;
      }

      setProducts(result.products as Product[]);
      setTotal(result.total as number);
    } finally {
      setIsLoading(false);
    }
  }

  const isFirstRender = useRef(true);
  const categoryFilterKey = expandedCategoryIds.join(",");
  const matchCategoryKey = matchCategoryIds.join(",");
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    void fetchPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearchTerm, categoryFilterKey, matchCategoryKey]);

  function setSearchTerm(value: string) {
    setSearchTermRaw(value);
    setPage(1);
  }

  function toggleCategoryFilter(categoryId: string) {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
    setPage(1);
  }

  function clearCategoryFilters() {
    setSelectedCategoryIds([]);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStartIndex = (currentPage - 1) * PRODUCTS_PAGE_SIZE;

  const categoryNameMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const isLimitFull = usage.remaining <= 0;
  const pageProductIds = products.map((product) => product.id);
  // "Tümünü seç" burada sadece o an yüklü olan sayfayı kapsar — binlerce
  // ürünü tek seferde belleğe çekmeden filtreye uyan HER şeyi seçtirmek
  // ayrı bir uçtan-uca sorgu gerektirir, şimdilik sayfa sayfa seçim yeterli.
  const allPageSelected =
    pageProductIds.length > 0 && pageProductIds.every((id) => selectedProductIds.includes(id));
  const somePageSelected =
    pageProductIds.some((id) => selectedProductIds.includes(id)) && !allPageSelected;

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

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id ? { ...item, is_in_stock: result.product.is_in_stock } : item,
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

  function toggleSelectAllOnPage() {
    setSelectedProductIds((current) => {
      if (allPageSelected) {
        return current.filter((id) => !pageProductIds.includes(id));
      }

      return Array.from(new Set([...current, ...pageProductIds]));
    });
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

      setProducts((current) => current.filter((item) => item.id !== product.id));
      setTotal((current) => Math.max(0, current - 1));
      setGrandTotal((current) => Math.max(0, current - 1));
      setSelectedProductIds((current) => current.filter((id) => id !== product.id));
      setDeleteTarget(null);
      setMessage("Ürün kalıcı olarak silindi.");
      router.refresh();
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

      const deletedCount = (result.deletedIds ?? []).length;
      setTotal((current) => Math.max(0, current - deletedCount));
      setGrandTotal((current) => Math.max(0, current - deletedCount));
      setSelectedProductIds([]);
      setBulkDeleteOpen(false);
      setMessage(`${deletedCount} ürün kalıcı olarak silindi.`);
      await fetchPage(currentPage);
      router.refresh();
    });
  }

  async function moveProductToOrder(productId: string, targetOrder: number) {
    setMessage(null);
    setIsOrderSaving(true);

    try {
      const response = await fetch("/api/tenant/products/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, targetOrder }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Ürün sıralaması kaydedilemedi.");
        return;
      }

      setMessage("Ürün katalog sırası güncellendi.");
      await fetchPage(currentPage);
    } catch {
      setMessage("Ürün sıralaması kaydedilemedi.");
    } finally {
      setIsOrderSaving(false);
    }
  }

  function handleSetProductOrder(productId: string, targetOrder: number) {
    const clamped = Math.min(Math.max(1, Math.floor(targetOrder)), grandTotal);
    void moveProductToOrder(productId, clamped);
  }

  // Yukarı/aşağı oklar ve sürükle-bırak, sadece o an yüklü sayfa içindeki
  // komşu ürünle yer değiştirir — sayfa sınırının dışına (bir önceki/sonraki
  // sayfaya) taşımak için "Sıra" kutusuna hedef pozisyonu yazmak gerekir.
  function handleMoveProduct(productId: string, direction: "up" | "down") {
    const index = products.findIndex((product) => product.id === productId);
    if (index < 0) return;

    const neighbor = products[direction === "up" ? index - 1 : index + 1];
    if (!neighbor) return;

    void moveProductToOrder(productId, neighbor.display_order);
  }

  function handleProductDrop(targetProductId: string) {
    if (!draggedProductId || draggedProductId === targetProductId) {
      setDraggedProductId(null);
      return;
    }

    const target = products.find((product) => product.id === targetProductId);
    setDraggedProductId(null);
    if (!target) return;

    void moveProductToOrder(draggedProductId, target.display_order);
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

      // Aktif bir kategori filtresi varsa ürün artık listeden düşmüş
      // olabilir — sayfayı yeniden çekmek en güvenilir yol.
      await fetchPage(currentPage);
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

      setSelectedProductIds([]);
      setMessage(
        `${result.updatedProducts.length} ürünün stoğu ${is_in_stock ? "açıldı" : "kapatıldı"}.`,
      );
      await fetchPage(currentPage);
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

      setSelectedProductIds([]);
      setBulkCategoryId("");
      setMessage(`${result.updatedProducts.length} ürünün kategorisi güncellendi.`);
      await fetchPage(currentPage);
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
          grandTotal={grandTotal}
          filteredProducts={products}
          pageStartIndex={pageStartIndex}
          totalFilteredCount={total}
          pricedLists={pricedLists}
          flatCategories={flatCategories}
          categoryNameMap={categoryNameMap}
          selectedProductIds={selectedProductIds}
          onToggleSelect={toggleSelectProduct}
          allFilteredSelected={allPageSelected}
          someFilteredSelected={somePageSelected}
          onToggleSelectAllFiltered={toggleSelectAllOnPage}
          draggedProductId={draggedProductId}
          onDragStart={setDraggedProductId}
          onDragEnd={() => setDraggedProductId(null)}
          onDrop={handleProductDrop}
          isOrderSaving={isOrderSaving || isLoading}
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

        {total ? (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-5 py-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              {pageStartIndex + 1}-{Math.min(pageStartIndex + PRODUCTS_PAGE_SIZE, total)}
              {" / "}
              {total} ürün
              {isLoading ? " · yükleniyor…" : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="h-8 px-3 text-xs"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isLoading}
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
                disabled={currentPage >= pageCount || isLoading}
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
            setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
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
            setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
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
