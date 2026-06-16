import { getProductPriceForList } from "@/lib/price-lists/records";
import { computeDiscountPercentage } from "@/lib/products/pricing-utils";
import type { Product, ProductVariant } from "@/lib/types";

export function getVariantPriceForList(
  prices: ProductVariant["prices"],
  priceListId: string,
) {
  const entry = prices?.find((item) => item.price_list_id === priceListId);
  return typeof entry?.price === "number" ? entry.price : null;
}

export function resolveVariantListPrice(
  variant: Pick<ProductVariant, "prices">,
  product: Pick<Product, "prices">,
  priceListId: string,
) {
  const explicitVariantPrice = getVariantPriceForList(variant.prices, priceListId);

  if (explicitVariantPrice !== null) {
    return explicitVariantPrice;
  }

  return getProductPriceForList(product.prices, priceListId);
}

export function resolveStorefrontVariantPrice(
  variant: Pick<ProductVariant, "prices">,
  product: Pick<Product, "prices" | "is_discount_active" | "discount_price">,
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

  const listPrice = resolveVariantListPrice(variant, product, priceListId);
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

export function getMinVariantListPrice(
  product: Product,
  priceListId: string,
  isCatalogOnly: boolean,
) {
  if (isCatalogOnly) {
    return null;
  }

  const variants = product.variants ?? [];

  if (!variants.length) {
    return resolveStorefrontVariantPrice({}, product, priceListId, false).price;
  }

  const resolvedPrices = variants
    .map((variant) => resolveStorefrontVariantPrice(variant, product, priceListId, false).price)
    .filter((price): price is number => price !== null);

  if (!resolvedPrices.length) {
    return null;
  }

  return Math.min(...resolvedPrices);
}

export function getMaxVariantListPrice(
  product: Product,
  priceListId: string,
  isCatalogOnly: boolean,
) {
  if (isCatalogOnly) {
    return null;
  }

  const variants = product.variants ?? [];

  if (!variants.length) {
    return resolveStorefrontVariantPrice({}, product, priceListId, false).price;
  }

  const resolvedPrices = variants
    .map((variant) => resolveStorefrontVariantPrice(variant, product, priceListId, false).price)
    .filter((price): price is number => price !== null);

  if (!resolvedPrices.length) {
    return null;
  }

  return Math.max(...resolvedPrices);
}
