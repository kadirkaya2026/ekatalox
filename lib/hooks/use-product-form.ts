"use client";

import { useMemo, useState } from "react";
import { defaultCurrencyCode } from "@/lib/products/constants";
import {
  appendProductPricesToFormData,
  buildListDiscountFormState,
  buildListPriceFormState,
  getMinPriceFromFormState,
} from "@/lib/products/price-form";
import { computeDiscountPercentage } from "@/lib/storefront/pricing";
import {
  ProductImageValidationError,
  validateProductImageFile,
} from "@/lib/storage/product-images";
import type { PriceList, Product } from "@/lib/types";

export type ProductImageSlot = 1 | 2 | 3;

export interface ProductFormState {
  category_id: string;
  sku_code: string;
  product_name: string;
  // Marka (0161): isteğe bağlı; vitrinde adın üstünde görünür.
  brand: string;
  currency: string;
  listPrices: Record<string, string>;
  // Liste başına indirimli fiyat; boş = o listede indirim yok.
  listDiscounts: Record<string, string>;
  // Liste başına "Bu listede gizle" (0162): işaretli listede ürün, fiyatı
  // girilmiş olsa bile vitrinde görünmez.
  hiddenLists: Record<string, boolean>;
  is_in_stock: boolean;
  // Stok takibi (0153): açıkken adet girilir, vitrinde "Stok: X adet" görünür.
  track_stock: boolean;
  stock_quantity: string;
  is_recommended: boolean;
  is_discount_active: boolean;
  discount_price: string;
  // Alış fiyatı (maliyet) — kârlılık raporu için; müşteriye gösterilmez.
  purchase_price: string;
  // Alkollü ürün — tekel mağazalarda vitrinde gösterilmez (bkz. 0114).
  is_alcohol: boolean;
  package_quantity: string;
  carton_quantity: string;
  description: string;
  image: File | null;
  image2: File | null;
  image3: File | null;
  removeImage: boolean;
  removeImage2: boolean;
  removeImage3: boolean;
}

export function buildEmptyProductForm(priceLists: PriceList[]): ProductFormState {
  return {
    category_id: "",
    sku_code: "",
    product_name: "",
    brand: "",
    currency: defaultCurrencyCode,
    listPrices: buildListPriceFormState(priceLists),
    listDiscounts: buildListDiscountFormState(priceLists),
    hiddenLists: {},
    is_in_stock: true,
    track_stock: false,
    stock_quantity: "",
    is_recommended: false,
    is_discount_active: false,
    discount_price: "",
    purchase_price: "",
    is_alcohol: false,
    package_quantity: "",
    carton_quantity: "",
    description: "",
    image: null,
    image2: null,
    image3: null,
    removeImage: false,
    removeImage2: false,
    removeImage3: false,
  };
}

export function buildProductFormFromProduct(
  product: Product,
  priceLists: PriceList[],
): ProductFormState {
  return {
    category_id: product.category_id,
    sku_code: product.sku_code,
    product_name: product.product_name,
    brand: product.brand ?? "",
    currency: product.currency ?? defaultCurrencyCode,
    listPrices: buildListPriceFormState(priceLists, product),
    listDiscounts: buildListDiscountFormState(priceLists, product),
    hiddenLists: Object.fromEntries(
      (product.hidden_price_list_ids ?? []).map((priceListId) => [priceListId, true]),
    ),
    is_in_stock: product.is_in_stock,
    track_stock: Boolean(product.track_stock),
    stock_quantity: product.stock_quantity != null ? String(product.stock_quantity) : "",
    is_recommended: product.is_recommended,
    is_discount_active: product.is_discount_active,
    discount_price:
      product.discount_price !== null && product.discount_price !== undefined
        ? String(product.discount_price)
        : "",
    purchase_price:
      product.purchase_price !== null && product.purchase_price !== undefined
        ? String(product.purchase_price)
        : "",
    is_alcohol: Boolean(product.is_alcohol),
    package_quantity: product.package_quantity ? String(product.package_quantity) : "",
    carton_quantity: product.carton_quantity ? String(product.carton_quantity) : "",
    description: product.description ?? "",
    image: null,
    image2: null,
    image3: null,
    removeImage: false,
    removeImage2: false,
    removeImage3: false,
  };
}

export function toProductFormData(form: ProductFormState) {
  const formData = new FormData();
  formData.set("category_id", form.category_id);
  formData.set("sku_code", form.sku_code);
  formData.set("product_name", form.product_name);
  formData.set("brand", form.brand.trim());
  formData.set("currency", form.currency);
  appendProductPricesToFormData(
    formData,
    form.listPrices,
    form.listDiscounts,
    form.is_discount_active,
  );
  formData.set(
    "hidden_price_list_ids",
    JSON.stringify(
      Object.entries(form.hiddenLists)
        .filter(([, hidden]) => hidden)
        .map(([priceListId]) => priceListId),
    ),
  );
  formData.set("is_in_stock", String(form.is_in_stock));
  formData.set("track_stock", String(form.track_stock));
  formData.set("stock_quantity", form.track_stock ? form.stock_quantity.trim() : "");
  formData.set("is_recommended", String(form.is_recommended));
  formData.set("is_discount_active", String(form.is_discount_active));
  formData.set("discount_price", form.is_discount_active ? form.discount_price.trim() : "");
  formData.set("purchase_price", form.purchase_price.trim());
  formData.set("is_alcohol", String(form.is_alcohol));
  formData.set("package_quantity", form.package_quantity.trim());
  formData.set("carton_quantity", form.carton_quantity.trim());
  formData.set("description", form.description.trim());

  if (form.image) {
    formData.set("image", form.image);
  } else if (form.removeImage) {
    formData.set("remove_image", "1");
  }

  if (form.image2) {
    formData.set("image_2", form.image2);
  } else if (form.removeImage2) {
    formData.set("remove_image_2", "1");
  }

  if (form.image3) {
    formData.set("image_3", form.image3);
  } else if (form.removeImage3) {
    formData.set("remove_image_3", "1");
  }

  return formData;
}

export function getProductDiscountPreview(form: ProductFormState) {
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

const IMAGE_SLOT_FIELDS: Record<
  ProductImageSlot,
  { file: "image" | "image2" | "image3"; remove: "removeImage" | "removeImage2" | "removeImage3" }
> = {
  1: { file: "image", remove: "removeImage" },
  2: { file: "image2", remove: "removeImage2" },
  3: { file: "image3", remove: "removeImage3" },
};

// Ürün ekleme ve düzenleme formları aynı alan setini, aynı doğrulama ve
// aynı FormData serileştirmesini paylaşır — bu hook her iki yerde de
// kullanılır (bkz. product-add-form.tsx, product-edit-modal.tsx).
export function useProductForm(
  initial: ProductFormState | (() => ProductFormState),
  options?: { onImageResult?: (message: string | null) => void },
) {
  const [form, setForm] = useState<ProductFormState>(initial);

  function updateField<Key extends keyof ProductFormState>(
    key: Key,
    value: ProductFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateListPrice(priceListId: string, value: string) {
    setForm((current) => ({
      ...current,
      listPrices: {
        ...current.listPrices,
        [priceListId]: value,
      },
    }));
  }

  function updateListDiscount(priceListId: string, value: string) {
    setForm((current) => ({
      ...current,
      listDiscounts: {
        ...current.listDiscounts,
        [priceListId]: value,
      },
    }));
  }

  function updateListHidden(priceListId: string, hidden: boolean) {
    setForm((current) => ({
      ...current,
      hiddenLists: {
        ...current.hiddenLists,
        [priceListId]: hidden,
      },
    }));
  }

  function handleImageSelect(slot: ProductImageSlot, file: File | null) {
    const { file: fileKey, remove: removeKey } = IMAGE_SLOT_FIELDS[slot];

    if (!file) {
      updateField(fileKey, null);
      return;
    }

    try {
      validateProductImageFile(file);
    } catch (error) {
      options?.onImageResult?.(
        error instanceof ProductImageValidationError
          ? error.message
          : "Resim dosyası okunamadı.",
      );
      return;
    }

    options?.onImageResult?.(null);
    setForm((current) => ({ ...current, [fileKey]: file, [removeKey]: false }));
  }

  function handleImageRemove(slot: ProductImageSlot) {
    const { file: fileKey, remove: removeKey } = IMAGE_SLOT_FIELDS[slot];
    setForm((current) => ({ ...current, [fileKey]: null, [removeKey]: true }));
  }

  const discountPreview = useMemo(() => getProductDiscountPreview(form), [form]);

  return {
    form,
    setForm,
    updateField,
    updateListPrice,
    updateListDiscount,
    updateListHidden,
    handleImageSelect,
    handleImageRemove,
    discountPreview,
  };
}
