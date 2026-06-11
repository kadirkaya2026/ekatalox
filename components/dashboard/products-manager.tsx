"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { ProductDescriptionEditor } from "@/components/dashboard/product-description-editor";
import { Table, TableWrapper } from "@/components/ui/table";
import {
  buildCategoryTree,
  flattenCategoryTree,
  getDescendantCategoryIds,
} from "@/lib/categories/tree";
import { buildPackageUpgradeHref } from "@/lib/billing/plans";
import {
  defaultCurrencyCode,
  supportedCurrencyCodes,
} from "@/lib/products/constants";
import { ProductPriceFields } from "@/components/dashboard/product-price-fields";
import {
  appendProductPricesToFormData,
  buildListPriceFormState,
  getMinPriceFromFormState,
} from "@/lib/products/price-form";
import { getProductPriceForList } from "@/lib/price-lists/records";
import { getPriceListDisplayName } from "@/lib/price-lists/constants";
import { computeDiscountPercentage } from "@/lib/storefront/pricing";
import type { Category, PriceList, Product, ProductVariant, Tenant } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

interface ProductFormState {
  category_id: string;
  sku_code: string;
  product_name: string;
  currency: string;
  listPrices: Record<string, string>;
  is_in_stock: boolean;
  is_discount_active: boolean;
  discount_price: string;
  package_quantity: string;
  carton_quantity: string;
  description: string;
  image: File | null;
}

interface VariantMatrixRow {
  id?: string;
  model_name: string;
  package_quantity: string;
  carton_quantity: string;
  is_available_for_sale: boolean;
  display_order: number;
}

const emptyForm = (priceLists: PriceList[]): ProductFormState => ({
  category_id: "",
  sku_code: "",
  product_name: "",
  currency: defaultCurrencyCode,
  listPrices: buildListPriceFormState(priceLists),
  is_in_stock: true,
  is_discount_active: false,
  discount_price: "",
  package_quantity: "",
  carton_quantity: "",
  description: "",
  image: null,
});

const emptyVariantRow = (display_order: number): VariantMatrixRow => ({
  model_name: "",
  package_quantity: "",
  carton_quantity: "",
  is_available_for_sale: true,
  display_order,
});

function toFormData(form: ProductFormState) {
  const formData = new FormData();
  formData.set("category_id", form.category_id);
  formData.set("sku_code", form.sku_code);
  formData.set("product_name", form.product_name);
  formData.set("currency", form.currency);
  appendProductPricesToFormData(formData, form.listPrices);
  formData.set("is_in_stock", String(form.is_in_stock));
  formData.set("is_discount_active", String(form.is_discount_active));
  formData.set("discount_price", form.is_discount_active ? form.discount_price.trim() : "");
  formData.set("package_quantity", form.package_quantity.trim());
  formData.set("carton_quantity", form.carton_quantity.trim());
  formData.set("description", form.description.trim());

  if (form.image) {
    formData.set("image", form.image);
  }

  return formData;
}

function productToForm(product: Product, priceLists: PriceList[]): ProductFormState {
  return {
    category_id: product.category_id,
    sku_code: product.sku_code,
    product_name: product.product_name,
    currency: product.currency ?? defaultCurrencyCode,
    listPrices: buildListPriceFormState(priceLists, product),
    is_in_stock: product.is_in_stock,
    is_discount_active: product.is_discount_active,
    discount_price:
      product.discount_price !== null && product.discount_price !== undefined
        ? String(product.discount_price)
        : "",
    package_quantity: product.package_quantity ? String(product.package_quantity) : "",
    carton_quantity: product.carton_quantity ? String(product.carton_quantity) : "",
    description: product.description ?? "",
    image: null,
  };
}

function getDiscountPreview(form: ProductFormState) {
  if (!form.is_discount_active || !form.discount_price.trim()) {
    return null;
  }

  const minListPrice = getMinPriceFromFormState(form.listPrices);
  const salePrice = Number(form.discount_price);

  if (Number.isNaN(salePrice)) {
    return null;
  }

  return computeDiscountPercentage(minListPrice, salePrice);
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

function sortProductsByDisplayOrder(productList: Product[]) {
  return [...productList].sort((left, right) => {
    if (left.display_order !== right.display_order) {
      return left.display_order - right.display_order;
    }

    return left.product_name.localeCompare(right.product_name, "tr-TR");
  });
}

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

  useEffect(() => {
    if (!isEditing) {
      setDraft(String(displayOrder));
    }
  }, [displayOrder, isEditing]);

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
      aria-label={`${productName} vitrin sırası`}
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
      className="w-14 rounded-md border border-slate-200 bg-white px-2 py-1 text-center text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

function variantToMatrixRow(variant: ProductVariant, index: number): VariantMatrixRow {
  return {
    id: variant.id,
    model_name: variant.model_name,
    package_quantity: variant.package_quantity ? String(variant.package_quantity) : "",
    carton_quantity: variant.carton_quantity ? String(variant.carton_quantity) : "",
    is_available_for_sale: variant.is_available_for_sale,
    display_order: variant.display_order || index + 1,
  };
}

function normalizeVariantRows(rows: VariantMatrixRow[]) {
  return rows.map((row, index) => {
    return {
      id: row.id ?? "",
      model_name: row.model_name.trim(),
      package_quantity: row.package_quantity.trim() ? Number(row.package_quantity) : null,
      carton_quantity: row.carton_quantity.trim() ? Number(row.carton_quantity) : null,
      is_available_for_sale: row.is_available_for_sale,
      display_order: index + 1,
    };
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
  const [editForm, setEditForm] = useState<ProductFormState>(() => emptyForm(priceLists));
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [variantMatrixOpen, setVariantMatrixOpen] = useState(false);
  const [variantMatrixProduct, setVariantMatrixProduct] = useState<Product | null>(null);
  const [variantRows, setVariantRows] = useState<VariantMatrixRow[]>([]);
  const [variantMessage, setVariantMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
  const [inlineCategoryProductId, setInlineCategoryProductId] = useState<string | null>(null);
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [isOrderSaving, setIsOrderSaving] = useState(false);
  const [pending, startTransition] = useTransition();
  const categoryFilterRef = useRef<HTMLDivElement | null>(null);
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
  const editDiscountPreview = useMemo(() => getDiscountPreview(editForm), [editForm]);
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

  function updateListPrice(priceListId: string, value: string) {
    setEditForm((current) => ({
      ...current,
      listPrices: {
        ...current.listPrices,
        [priceListId]: value,
      },
    }));
  }

  function updateEditField<Key extends keyof ProductFormState>(
    key: Key,
    value: ProductFormState[Key],
  ) {
    setEditForm((current) => ({ ...current, [key]: value }));
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setEditForm(productToForm(product, priceLists));
  }

  function openVariantMatrix(product: Product) {
    setVariantMatrixProduct(product);
    setVariantRows(
      (product.variants ?? []).length
        ? (product.variants ?? []).map(variantToMatrixRow)
        : [emptyVariantRow(1)],
    );
    setVariantMessage(null);
    setVariantMatrixOpen(true);
  }

  function closeVariantMatrix() {
    setVariantMatrixOpen(false);
    setVariantMatrixProduct(null);
    setVariantRows([]);
    setVariantMessage(null);
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

      let result: { error?: string; product?: Product } = {};
      try {
        result = await response.json();
      } catch {
        setMessage("Sunucu yanıtı okunamadı. Lütfen tekrar deneyin.");
        return;
      }

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

  function updateVariantRow(
    index: number,
    key: keyof VariantMatrixRow,
    value: VariantMatrixRow[keyof VariantMatrixRow],
  ) {
    setVariantRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }

        return {
          ...row,
          [key]: value,
        };
      }),
    );
  }

  function addVariantRow() {
    setVariantRows((current) => [...current, emptyVariantRow(current.length + 1)]);
  }

  function removeVariantRow(index: number) {
    setVariantRows((current) => {
      if (current.length === 1) {
        return current;
      }

      return current
        .filter((_, rowIndex) => rowIndex !== index)
        .map((row, rowIndex) => ({
          ...row,
          display_order: rowIndex + 1,
        }));
    });
  }

  function handleVariantMatrixSave() {
    if (!variantMatrixProduct) {
      return;
    }

    const hasEmptyModelName = variantRows.some((row) => !row.model_name.trim());

    if (hasEmptyModelName) {
      setVariantMessage("Her satır için model adı zorunludur.");
      return;
    }

    setVariantMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/tenant/products/${variantMatrixProduct.id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variants: normalizeVariantRows(variantRows),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setVariantMessage(
          result.error ??
            "Varyantlar kaydedilemedi. Migration uygulanmamış olabilir.",
        );
        return;
      }

      syncProducts(
        products.map((item) =>
          item.id === variantMatrixProduct.id ? (result.product as Product) : item,
        ),
      );
      setMessage("Varyant matrisi güncellendi.");
      closeVariantMatrix();
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

      setMessage("Ürün vitrin sırası güncellendi.");
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
      const formData = toFormData({
        ...productToForm(product, priceLists),
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

  const renderVariantCountBadge = (product: Product) => {
    const variantCount = product.variants?.length ?? 0;

    if (!variantCount) {
      return (
        <Badge className="bg-slate-100 text-slate-600">
          Tek ürün
        </Badge>
      );
    }

    return (
      <Badge className="bg-blue-50 text-blue-700">
        {variantCount} model
      </Badge>
    );
  };

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
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl lg:justify-end">
              <div className="w-full lg:max-w-md">
                <Input
                  placeholder="Ürün adı veya model no ara"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
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
                    className={cn(
                      "size-4 transition-transform",
                      categoryFilterOpen && "rotate-180",
                    )}
                  />
                </Button>

                {categoryFilterOpen ? (
                  <div className="absolute right-0 top-full z-20 mt-2 w-full min-w-[18rem] rounded-xl border border-slate-200 bg-white p-3 shadow-lg sm:w-80">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Kategorilere göre filtrele
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          İşaretli kategorilerdeki ürünler listelenir.
                        </p>
                      </div>
                      {selectedCategoryIds.length ? (
                        <button
                          type="button"
                          onClick={clearCategoryFilters}
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
                              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-slate-50"
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
                      <p className="mt-3 text-sm text-slate-500">
                        Henüz kategori bulunmuyor.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
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
                  Ürünleri sürükleyip bırakın, yukarı/aşağı butonlarıyla veya sıra
                  numarasını yazarak sıralayın. Bu global sıra anasayfa ve kategori
                  listelerinde aynı şekilde kullanılır.
                </p>
              </div>
            </div>
          </div>

          {selectedProductIds.length ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-semibold text-blue-800">
                  {selectedProductIds.length} ürün seçildi — Kategori değiştir:
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    value={bulkCategoryId}
                    onChange={(e) => setBulkCategoryId(e.target.value)}
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Kategori seçin</option>
                    {flatCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {"— ".repeat(category.depth)}{category.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    className="border-blue-200 bg-white text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                    onClick={handleBulkCategoryUpdate}
                    disabled={!bulkCategoryId || pending}
                  >
                    <Check className="size-4" />
                    Tümüne Uygula
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
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
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Stok</th>
                <th className="px-4 py-3">Model</th>
                {pricedLists.map((list) => (
                  <th key={list.id} className="px-4 py-3">
                    {getPriceListDisplayName(list)}
                  </th>
                ))}
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
                        <ProductOrderInput
                          displayOrder={product.display_order}
                          maxOrder={products.length}
                          disabled={isOrderSaving}
                          productName={product.product_name}
                          onCommit={(targetOrder) =>
                            handleSetProductOrder(product.id, targetOrder)
                          }
                        />
                        <div className="mt-1 flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveProduct(product.id, "up")}
                            disabled={index === 0 || isOrderSaving}
                            className="rounded-md border border-slate-200 px-2 py-1 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                            aria-label={`${product.product_name} yukarı taşı`}
                          >
                            <ArrowUp className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveProduct(product.id, "down")}
                            disabled={index === filteredProducts.length - 1 || isOrderSaving}
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
                          {product.sku_code} • {product.currency}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {inlineCategoryProductId === product.id ? (
                      <select
                        autoFocus
                        value={product.category_id}
                        onChange={(e) => handleInlineCategoryChange(product, e.target.value)}
                        onBlur={() => setInlineCategoryProductId(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setInlineCategoryProductId(null);
                        }}
                        className="rounded-lg border border-emerald-300 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      >
                        <option value="">Kategori seçin</option>
                        {flatCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {"— ".repeat(category.depth)}{category.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setInlineCategoryProductId(product.id)}
                        className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
                        title="Tıkla ve değiştir"
                      >
                        <span>{categoryNameMap.get(product.category_id) ?? "—"}</span>
                        <PencilLine className="size-3.5 text-slate-400 opacity-0 transition group-hover:opacity-100" />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-4">{renderStockBadge(product)}</td>
                  <td className="px-4 py-4">{renderVariantCountBadge(product)}</td>
                  {pricedLists.map((list) => (
                    <td key={list.id} className="px-4 py-4 text-base font-semibold text-slate-900">
                      {formatCurrency(
                        getProductPriceForList(product.prices, list.id),
                        product.currency,
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-4 align-top">
                    <div className="ml-auto flex max-w-[11rem] flex-wrap justify-end gap-2">
                      <Button
                        variant="secondary"
                        className="h-9 px-3"
                        onClick={() => openVariantMatrix(product)}
                        title="Model matrisi"
                        aria-label="Model matrisi"
                      >
                        <span className="text-xs font-semibold">
                          Model
                        </span>
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-9 px-3"
                        onClick={() => toggleStock(product)}
                        title={product.is_in_stock ? "Stoğu kapat" : "Stoğu aç"}
                        aria-label={product.is_in_stock ? "Stoğu kapat" : "Stoğu aç"}
                      >
                        <Badge
                          className={cn(
                            "pointer-events-none px-1.5 py-0 text-[10px]",
                            product.is_in_stock
                              ? "bg-slate-100 text-slate-600"
                              : "bg-emerald-50 text-emerald-700",
                          )}
                        >
                          {product.is_in_stock ? "Kapat" : "Aç"}
                        </Badge>
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-9 px-3"
                        onClick={() => openEdit(product)}
                        title="Düzenle"
                        aria-label="Düzenle"
                      >
                        <PencilLine className="size-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-9 border-red-200 px-3 text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteTarget(product)}
                        title="Sil"
                        aria-label="Sil"
                      >
                        <Trash2 className="size-4" />
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
              Kategori seçimini temizleyin veya ürün adı, model no ya da para birimi ile tekrar deneyin.
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
                  <span className="shrink-0">Sıra</span>
                  <ProductOrderInput
                    displayOrder={product.display_order}
                    maxOrder={products.length}
                    disabled={isOrderSaving}
                    productName={product.product_name}
                    onCommit={(targetOrder) =>
                      handleSetProductOrder(product.id, targetOrder)
                    }
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
                  <p className="font-semibold text-slate-900">{product.product_name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {product.sku_code} • {product.currency}
                  </p>
                  <div className="mt-2">
                    {inlineCategoryProductId === product.id ? (
                      <select
                        autoFocus
                        value={product.category_id}
                        onChange={(e) => handleInlineCategoryChange(product, e.target.value)}
                        onBlur={() => setInlineCategoryProductId(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setInlineCategoryProductId(null);
                        }}
                        className="w-full rounded-lg border border-emerald-300 bg-white px-2 py-1.5 text-sm text-slate-900"
                      >
                        <option value="">Kategori seçin</option>
                        {flatCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {"— ".repeat(category.depth)}{category.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setInlineCategoryProductId(product.id)}
                        className="flex items-center gap-1 text-sm text-slate-600 underline-offset-2 hover:underline"
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
                  onClick={() => handleMoveProduct(product.id, "up")}
                  disabled={index === 0 || isOrderSaving}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
                >
                  Yukarı taşı
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveProduct(product.id, "down")}
                  disabled={index === filteredProducts.length - 1 || isOrderSaving}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
                >
                  Aşağı taşı
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-3">
                {pricedLists.map((list) => (
                  <div key={list.id} className="text-center">
                    <p className="text-xs text-slate-500">{getPriceListDisplayName(list)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatCurrency(
                        getProductPriceForList(product.prices, list.id),
                        product.currency,
                      )}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => openVariantMatrix(product)}
                >
                  Model
                </Button>
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
              placeholder="Model No"
              value={editForm.sku_code}
              onChange={(event) => updateEditField("sku_code", event.target.value)}
            />
            <Input
              placeholder="Ürün adı"
              value={editForm.product_name}
              onChange={(event) => updateEditField("product_name", event.target.value)}
            />
          </div>

          <ProductDescriptionEditor
            value={editForm.description}
            onChange={(value) => updateEditField("description", value)}
          />

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
          </div>

          <ProductPriceFields
            priceLists={priceLists}
            values={editForm.listPrices}
            onChange={updateListPrice}
          />

          <PlanFeatureGate
            feature="product_discount"
            plan={tenant.plan}
            companyName={tenant.company_name}
          >
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={editForm.is_discount_active}
                  onChange={(event) => updateEditField("is_discount_active", event.target.checked)}
                />
                İndirim uygula
              </label>
              {editForm.is_discount_active ? (
                <div className="mt-3 grid gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="İndirimli satış fiyatı"
                    value={editForm.discount_price}
                    onChange={(event) => updateEditField("discount_price", event.target.value)}
                  />
                  {editDiscountPreview !== null ? (
                    <p className="text-sm font-medium text-emerald-700">
                      Vitrinde yaklaşık %{editDiscountPreview} indirim görünecek
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">
                      İndirimli fiyat, liste fiyatlarından düşük olmalıdır.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </PlanFeatureGate>

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
        open={variantMatrixOpen}
        onClose={closeVariantMatrix}
        title={
          variantMatrixProduct
            ? `${variantMatrixProduct.product_name} • Model Matrisi`
            : "Model Matrisi"
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Hızlı varyant düzenleyici
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Model adı, paket içi, koli içi ve satış durumunu tek ekranda yönetin.
              </p>
            </div>
            <Button variant="secondary" onClick={addVariantRow}>
              <Plus className="size-4" />
              Satır Ekle
            </Button>
          </div>

          {variantMessage ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
              {variantMessage}
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Model Adı</th>
                  <th className="px-3 py-3">Paket İçi</th>
                  <th className="px-3 py-3">Koli İçi</th>
                  <th className="px-3 py-3">Satış Durumu</th>
                  <th className="px-3 py-3 text-right">Sil</th>
                </tr>
              </thead>
              <tbody>
                {variantRows.map((row, index) => {
                  return (
                    <tr key={row.id ?? `variant-row-${index}`} className="border-t border-slate-100">
                      <td className="px-3 py-3">
                        <Input
                          value={row.model_name}
                          onChange={(event) =>
                            updateVariantRow(index, "model_name", event.target.value)
                          }
                          placeholder="Örn: Siyah"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={row.package_quantity}
                          onChange={(event) =>
                            updateVariantRow(index, "package_quantity", event.target.value)
                          }
                          placeholder="Boş bırak"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={row.carton_quantity}
                          onChange={(event) =>
                            updateVariantRow(index, "carton_quantity", event.target.value)
                          }
                          placeholder="Boş bırak"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <label className="flex items-center gap-3 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={row.is_available_for_sale}
                            onChange={(event) =>
                              updateVariantRow(
                                index,
                                "is_available_for_sale",
                                event.target.checked,
                              )
                            }
                          />
                          <span>{row.is_available_for_sale ? "Satışta" : "Kapalı"}</span>
                        </label>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          variant="secondary"
                          className="h-9 border-red-200 px-3 text-red-700 hover:bg-red-50"
                          onClick={() => removeVariantRow(index)}
                          disabled={variantRows.length <= 1}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeVariantMatrix}>
              İptal
            </Button>
            <Button onClick={handleVariantMatrixSave} disabled={pending}>
              Toplu Kaydet
            </Button>
          </div>
        </div>
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