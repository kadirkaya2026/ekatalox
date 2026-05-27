"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  GripVertical,
  ImagePlus,
  ListFilter,
  PencilLine,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, TableWrapper } from "@/components/ui/table";
import {
  buildCategoryTree,
  flattenCategoryTree,
  getDescendantCategoryIds,
} from "@/lib/categories/tree";
import {
  defaultCurrencyCode,
  supportedCurrencyCodes,
} from "@/lib/products/constants";
import type { Category, Product, Tenant } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

interface ProductFormState {
  category_id: string;
  sku_code: string;
  product_name: string;
  currency: string;
  price_tier_1: string;
  price_tier_2: string;
  price_tier_3: string;
  is_in_stock: boolean;
  package_quantity: string;
  carton_quantity: string;
  image: File | null;
}

const emptyForm: ProductFormState = {
  category_id: "",
  sku_code: "",
  product_name: "",
  currency: defaultCurrencyCode,
  price_tier_1: "",
  price_tier_2: "",
  price_tier_3: "",
  is_in_stock: true,
  package_quantity: "",
  carton_quantity: "",
  image: null,
};

const PACKAGE_UPGRADE_PHONE = "905354172510";

function buildPackageUpgradeHref(companyName: string) {
  const message = `Merhaba, paketimi yükseltmek istiyorum. Firma: ${companyName}`;
  return `https://wa.me/${PACKAGE_UPGRADE_PHONE}?text=${encodeURIComponent(message)}`;
}

function toFormData(form: ProductFormState) {
  const formData = new FormData();
  formData.set("category_id", form.category_id);
  formData.set("sku_code", form.sku_code);
  formData.set("product_name", form.product_name);
  formData.set("currency", form.currency);
  formData.set("price_tier_1", form.price_tier_1 || "0");
  formData.set("price_tier_2", form.price_tier_2 || "0");
  formData.set("price_tier_3", form.price_tier_3 || "0");
  formData.set("is_in_stock", String(form.is_in_stock));
  formData.set("package_quantity", form.package_quantity.trim());
  formData.set("carton_quantity", form.carton_quantity.trim());

  if (form.image) {
    formData.set("image", form.image);
  }

  return formData;
}

function productToForm(product: Product): ProductFormState {
  return {
    category_id: product.category_id,
    sku_code: product.sku_code,
    product_name: product.product_name,
    currency: product.currency ?? defaultCurrencyCode,
    price_tier_1: String(product.price_tier_1),
    price_tier_2: String(product.price_tier_2),
    price_tier_3: String(product.price_tier_3),
    is_in_stock: product.is_in_stock,
    package_quantity: product.package_quantity ? String(product.package_quantity) : "",
    carton_quantity: product.carton_quantity ? String(product.carton_quantity) : "",
    image: null,
  };
}

function reorderProducts(products: Product[], fromIndex: number, toIndex: number) {
  const nextProducts = [...products];
  const [movedProduct] = nextProducts.splice(fromIndex, 1);
  nextProducts.splice(toIndex, 0, movedProduct);

  return nextProducts.map((product, index) => ({
    ...product,
    display_order: index + 1,
  }));
}

export function ProductsManager({
  tenant,
  products: controlledProducts,
  onProductsUpdated,
  initialProducts,
  initialCategories,
}: {
  tenant: Tenant;
  products?: Product[];
  onProductsUpdated?: (products: Product[]) => void;
  initialProducts: Product[];
  initialCategories: Category[];
}) {
  const [internalProducts, setInternalProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [editForm, setEditForm] = useState<ProductFormState>(emptyForm);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const categoryFilterRef = useRef<HTMLDivElement | null>(null);
  const products = controlledProducts ?? internalProducts;
  const syncProducts = onProductsUpdated ?? setInternalProducts;
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

  const usage = useMemo(
    () => ({
      total: products.length,
      limit: tenant.max_product_limit,
      remaining: Math.max(tenant.max_product_limit - products.length, 0),
    }),
    [products.length, tenant.max_product_limit],
  );

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

  function updateEditField<Key extends keyof ProductFormState>(
    key: Key,
    value: ProductFormState[Key],
  ) {
    setEditForm((current) => ({ ...current, [key]: value }));
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setEditForm(productToForm(product));
  }

  function updateProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProduct) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/tenant/products/${editingProduct.id}`, {
        method: "PATCH",
        body: toFormData(editForm),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Ürün güncellenemedi.");
        return;
      }

      syncProducts(
        products.map((item) =>
          item.id === editingProduct.id ? (result.product as Product) : item,
        ),
      );
      setEditingProduct(null);
      setMessage("Ürün güncellendi.");
    });
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

  function persistProductOrder(nextProducts: Product[]) {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/tenant/products/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: nextProducts.map((product) => product.id),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Ürün sıralaması kaydedilemedi.");
        return;
      }

      if (result.products) {
        syncProducts(result.products as Product[]);
      }

      setMessage("Ürün vitrin sırası güncellendi.");
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
    syncProducts(nextProducts);
    persistProductOrder(nextProducts);
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
    syncProducts(nextProducts);
    setDraggedProductId(null);
    persistProductOrder(nextProducts);
  }

  const renderStockBadge = (product: Product) => (
    <Badge
      className={cn(
        product.is_in_stock
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500",
      )}
    >
      {product.is_in_stock ? "Stokta var" : "Stok kapalı"}
    </Badge>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Toplam ürün</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{usage.total}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Paket limiti</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{usage.limit}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Kalan kapasite</p>
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
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Mevcut ürünler</h2>
              <p className="mt-1 text-sm text-slate-600">
                Masaüstünde tablo, mobilde kart düzeni ile hızlı yönetim.
              </p>
            </div>
            <div className="w-full lg:max-w-md">
                <Input
                  placeholder="Ürün adı veya SKU ara"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white p-2 text-slate-500 shadow-sm">
                <ArrowUpDown className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Vitrin sıralaması</p>
                <p className="mt-1 text-sm text-slate-600">
                  Ürünleri sürükleyip bırakın veya yukarı/aşağı butonlarıyla sıralayın.
                  Bu sıra storefront tarafında doğrudan kullanılır.
                </p>
              </div>
            </div>
          </div>

          {selectedProductIds.length ? (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm font-semibold text-red-800">
                {selectedProductIds.length} ürün seçildi. Bu işlem geri alınamaz.
              </p>
              <Button
                variant="secondary"
                className="border-red-200 bg-white text-red-700 hover:bg-red-100"
                onClick={() => setBulkDeleteOpen(true)}
                disabled={pending}
              >
                <Trash2 className="size-4" />
                Seçilenleri Sil
              </Button>
            </div>
          ) : null}
        </div>

        <TableWrapper>
          <Table>
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
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
                    onChange={toggleSelectAllFiltered}
                    aria-label="Tüm filtrelenmiş ürünleri seç"
                  />
                </th>
                <th className="px-4 py-3">Sıra</th>
                <th className="px-4 py-3">Ürün</th>
                <th className="px-4 py-3">Stok</th>
                <th className="px-4 py-3">Katman 1</th>
                <th className="px-4 py-3">Katman 2</th>
                <th className="px-4 py-3">
                  <div className="relative inline-flex items-center gap-2" ref={categoryFilterRef}>
                    <span>Katman 3</span>
                    <Button
                      variant="secondary"
                      className="h-9 gap-2 px-3 py-2 text-xs"
                      onClick={() => setCategoryFilterOpen((current) => !current)}
                    >
                      <ListFilter className="size-3.5" />
                      {selectedCategoryIds.length
                        ? `Kategori (${selectedCategoryIds.length})`
                        : "Kategori"}
                      <ChevronDown
                        className={cn(
                          "size-3.5 transition-transform",
                          categoryFilterOpen && "rotate-180",
                        )}
                      />
                    </Button>

                    {categoryFilterOpen ? (
                      <div className="absolute left-full top-1/2 z-20 ml-3 w-80 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div>
                            <p className="text-sm font-semibold normal-case tracking-normal text-slate-900">
                              Kategorilere göre filtrele
                            </p>
                            <p className="mt-1 text-xs normal-case tracking-normal text-slate-500">
                              İşaretli kategorilerdeki ürünler listelenir.
                            </p>
                          </div>
                          {selectedCategoryIds.length ? (
                            <button
                              type="button"
                              onClick={clearCategoryFilters}
                              className="text-xs font-semibold normal-case tracking-normal text-emerald-700 transition hover:text-emerald-800"
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
                                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 normal-case tracking-normal transition hover:bg-slate-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleCategoryFilter(category.id)}
                                    className="size-4 rounded border-slate-300 text-emerald-600"
                                  />
                                  <span
                                    className="min-w-0 text-sm text-slate-700"
                                    style={{ paddingLeft: `${category.depth * 12}px` }}
                                  >
                                    {category.name}
                                  </span>
                                  {checked ? (
                                    <Check className="ml-auto size-4 text-emerald-600" />
                                  ) : null}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm normal-case tracking-normal text-slate-500">
                            Henüz kategori bulunmuyor.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </th>
                <th className="px-4 py-3 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr
                  key={product.id}
                  className={cn(
                    "border-t border-slate-100",
                    draggedProductId === product.id && "bg-emerald-50/60",
                  )}
                  draggable
                  onDragStart={() => setDraggedProductId(product.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleProductDrop(product.id)}
                  onDragEnd={() => setDraggedProductId(null)}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product.id)}
                      onChange={() => toggleSelectProduct(product.id)}
                      aria-label={`${product.product_name} seç`}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-slate-200 bg-white p-2 text-slate-400">
                        <GripVertical className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {index + 1}
                        </p>
                        <div className="mt-1 flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveProduct(product.id, "up")}
                            disabled={index === 0 || pending}
                            className="rounded-md border border-slate-200 px-2 py-1 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                            aria-label={`${product.product_name} yukarı taşı`}
                          >
                            <ArrowUp className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveProduct(product.id, "down")}
                            disabled={index === filteredProducts.length - 1 || pending}
                            className="rounded-md border border-slate-200 px-2 py-1 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                            aria-label={`${product.product_name} aşağı taşı`}
                          >
                            <ArrowDown className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
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
                        <p className="font-semibold text-slate-900">{product.product_name}</p>
                        <p className="text-sm text-slate-500">
                          {product.sku_code} •{" "}
                          {categoryNameMap.get(product.category_id) ?? "Kategori yok"} •{" "}
                          {product.currency}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">{renderStockBadge(product)}</td>
                  <td className="px-4 py-4 text-base font-semibold text-slate-900">
                    {formatCurrency(Number(product.price_tier_1), product.currency)}
                  </td>
                  <td className="px-4 py-4 text-base font-semibold text-slate-900">
                    {formatCurrency(Number(product.price_tier_2), product.currency)}
                  </td>
                  <td className="px-4 py-4 text-base font-semibold text-slate-900">
                    {formatCurrency(Number(product.price_tier_3), product.currency)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => toggleStock(product)}>
                        {product.is_in_stock ? "Stoğu kapat" : "Stoğu aç"}
                      </Button>
                      <Button variant="secondary" onClick={() => openEdit(product)}>
                        <PencilLine className="size-4" />
                        Düzenle
                      </Button>
                      <Button
                        variant="secondary"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteTarget(product)}
                      >
                        <Trash2 className="size-4" />
                        Sil
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>

        {!filteredProducts.length ? (
          <div className="border-t border-slate-100 px-5 py-8 text-center">
            <p className="text-sm font-semibold text-slate-900">
              Filtrelerinize uygun ürün bulunamadı.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Kategori seçimini temizleyin veya ürün adı, SKU ya da para birimi ile tekrar deneyin.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 p-4 md:hidden">
          {filteredProducts.map((product, index) => (
            <Card key={product.id} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(product.id)}
                    onChange={() => toggleSelectProduct(product.id)}
                  />
                  Seç
                </label>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <GripVertical className="size-4" />
                  <span>Sıra {index + 1}</span>
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
                  <p className="font-semibold text-slate-900">{product.product_name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {product.sku_code} •{" "}
                    {categoryNameMap.get(product.category_id) ?? "Kategori yok"} •{" "}
                    {product.currency}
                  </p>
                  <div className="mt-3">{renderStockBadge(product)}</div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleMoveProduct(product.id, "up")}
                  disabled={index === 0 || pending}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
                >
                  Yukarı taşı
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveProduct(product.id, "down")}
                  disabled={index === filteredProducts.length - 1 || pending}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
                >
                  Aşağı taşı
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                <div>
                  <p className="text-xs text-slate-500">Katman 1</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCurrency(Number(product.price_tier_1), product.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Katman 2</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCurrency(Number(product.price_tier_2), product.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Katman 3</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCurrency(Number(product.price_tier_3), product.currency)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => toggleStock(product)}
                >
                  {product.is_in_stock ? "Stoğu kapat" : "Stoğu aç"}
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => openEdit(product)}
                >
                  Düzenle
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => setDeleteTarget(product)}
                >
                  Sil
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Modal
        open={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        title={editingProduct ? `${editingProduct.product_name} • Düzenle` : "Ürün Düzenle"}
      >
        <form onSubmit={updateProduct} className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={editForm.category_id}
              onChange={(event) => updateEditField("category_id", event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            >
              <option value="">Kategori seçin</option>
              {flatCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {"— ".repeat(category.depth)}
                  {category.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="SKU kodu"
              value={editForm.sku_code}
              onChange={(event) => updateEditField("sku_code", event.target.value)}
            />
            <Input
              placeholder="Ürün adı"
              value={editForm.product_name}
              onChange={(event) => updateEditField("product_name", event.target.value)}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <select
              value={editForm.currency}
              onChange={(event) => updateEditField("currency", event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            >
              {supportedCurrencyCodes.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            <Input
              type="number"
              step="0.01"
              value={editForm.price_tier_1}
              onChange={(event) => updateEditField("price_tier_1", event.target.value)}
            />
            <Input
              type="number"
              step="0.01"
              value={editForm.price_tier_2}
              onChange={(event) => updateEditField("price_tier_2", event.target.value)}
            />
            <Input
              type="number"
              step="0.01"
              value={editForm.price_tier_3}
              onChange={(event) => updateEditField("price_tier_3", event.target.value)}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="Paket adedi"
              value={editForm.package_quantity}
              onChange={(event) => updateEditField("package_quantity", event.target.value)}
            />
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="Koli adedi"
              value={editForm.carton_quantity}
              onChange={(event) => updateEditField("carton_quantity", event.target.value)}
            />
          </div>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            <ImagePlus className="size-4 text-emerald-700" />
            <span>{editForm.image ? editForm.image.name : "Yeni fotoğraf seç"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => updateEditField("image", event.target.files?.[0] ?? null)}
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={editForm.is_in_stock}
              onChange={(event) => updateEditField("is_in_stock", event.target.checked)}
            />
            Stokta görünsün
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditingProduct(null)}>
              İptal
            </Button>
            <Button type="submit" disabled={pending}>
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>

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
              <p className="mt-1 text-sm text-red-800">SKU: {deleteTarget.sku_code}</p>
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