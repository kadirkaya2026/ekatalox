import { toStorefrontVariant } from "@/lib/products/records";
import { computeDiscountPercentage } from "@/lib/products/pricing-utils";
import { getProductDisplayPriceForList } from "@/lib/products/variant-pricing";
import { getProductPriceForList } from "@/lib/price-lists/records";
import type { Product, StorefrontProduct } from "@/lib/types";

export { computeDiscountPercentage };

export function getMinListPrice(product: Pick<Product, "prices">) {
  const values = (product.prices ?? []).map((entry) => Number(entry.price));

  if (!values.length) {
    return 0;
  }

  return Math.min(...values);
}

export function resolveStorefrontPrice(
  product: Product,
  priceListId: string,
  isCatalogOnly: boolean,
) {
  if (isCatalogOnly) {
    return {
      price: null,
      original_price: null,
      discount_percentage: null,
    };
  }

  const listPrice = getProductPriceForList(product.prices, priceListId);
  const discountPrice =
    typeof product.discount_price === "number" ? product.discount_price : null;

  if (
    product.is_discount_active &&
    discountPrice !== null &&
    discountPrice >= 0 &&
    discountPrice < listPrice
  ) {
    return {
      price: discountPrice,
      original_price: listPrice,
      discount_percentage: computeDiscountPercentage(listPrice, discountPrice),
    };
  }

  return {
    price: listPrice,
    original_price: null,
    discount_percentage: null,
  };
}

function resolveVariantProductCardPricing(
  product: Product,
  priceListId: string,
  isCatalogOnly: boolean,
) {
  return getProductDisplayPriceForList(product, priceListId, isCatalogOnly);
}

export function toStorefrontProduct(
  product: Product,
  priceListId: string,
  isCatalogOnly: boolean,
): StorefrontProduct {
  const variants = (product.variants ?? []).map((variant) =>
    toStorefrontVariant(variant, product, priceListId, isCatalogOnly),
  );
  const pricing = resolveVariantProductCardPricing(product, priceListId, isCatalogOnly);

  return {
    id: product.id,
    category_id: product.category_id,
    sku_code: product.sku_code,
    product_name: product.product_name,
    description: product.description ?? null,
    image_url: product.image_url,
    is_in_stock: product.is_in_stock,
    is_recommended: product.is_recommended,
    currency: product.currency,
    price: pricing.price,
    price_max: pricing.price_max,
    price_from: pricing.price_from,
    original_price: pricing.original_price,
    discount_percentage: pricing.discount_percentage,
    package_quantity: product.package_quantity,
    carton_quantity: product.carton_quantity,
    stock_quantity: null,
    has_variants: variants.length > 0,
    variants,
  };
}

/** @deprecated Use getMinListPrice */
export function getMinTierPrice(product: Pick<Product, "prices">) {
  return getMinListPrice(product);
}

/** @deprecated Use getProductPriceForList */
export function pickPriceByTier(product: Product, _tierLevel: never) {
  return getMinListPrice(product);
}
