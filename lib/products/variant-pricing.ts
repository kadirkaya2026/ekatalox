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

export function hasExplicitVariantPricesForList(product: Product, priceListId: string) {
  return (product.variants ?? []).some(
    (variant) => getVariantPriceForList(variant.prices, priceListId) !== null,
  );
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
    typeof product.prices?.find((entry) => entry.price_list_id === priceListId)?.discount_price ===
    "number"
      ? product.prices.find((entry) => entry.price_list_id === priceListId)!.discount_price!
      : null;

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

export function collectDisplayVariantPrices(
  product: Product,
  priceListId: string,
  isCatalogOnly: boolean,
) {
  if (isCatalogOnly) {
    return [];
  }

  const variants = product.variants ?? [];

  if (!variants.length) {
    const resolved = resolveStorefrontVariantPrice({}, product, priceListId, false).price;
    return resolved !== null ? [resolved] : [];
  }

  const hasExplicit = hasExplicitVariantPricesForList(product, priceListId);
  const sourceVariants = hasExplicit
    ? variants.filter(
        (variant) => getVariantPriceForList(variant.prices, priceListId) !== null,
      )
    : variants;

  return sourceVariants
    .map((variant) => resolveStorefrontVariantPrice(variant, product, priceListId, false).price)
    .filter((price): price is number => price !== null);
}

export function getMinVariantListPrice(
  product: Product,
  priceListId: string,
  isCatalogOnly: boolean,
) {
  const resolvedPrices = collectDisplayVariantPrices(product, priceListId, isCatalogOnly);

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
  const resolvedPrices = collectDisplayVariantPrices(product, priceListId, isCatalogOnly);

  if (!resolvedPrices.length) {
    return null;
  }

  return Math.max(...resolvedPrices);
}

export function getProductDisplayPriceForList(
  product: Product,
  priceListId: string,
  isCatalogOnly = false,
) {
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;
  const hasExplicit = hasExplicitVariantPricesForList(product, priceListId);

  if (!hasVariants) {
    const pricing = resolveStorefrontVariantPrice({}, product, priceListId, isCatalogOnly);

    return {
      price: pricing.price,
      price_max: null as number | null,
      price_from: false,
      original_price: pricing.original_price,
      discount_percentage: pricing.discount_percentage,
    };
  }

  const minPrice = getMinVariantListPrice(product, priceListId, isCatalogOnly);
  const maxPrice = getMaxVariantListPrice(product, priceListId, isCatalogOnly);

  if (minPrice === null) {
    return {
      price: null,
      price_max: null,
      price_from: false,
      original_price: null,
      discount_percentage: null,
    };
  }

  const cheapestVariant = variants.find((variant) => {
    const resolved = resolveStorefrontVariantPrice(variant, product, priceListId, false);
    return resolved.price === minPrice;
  });

  const cheapestPricing = cheapestVariant
    ? resolveStorefrontVariantPrice(cheapestVariant, product, priceListId, isCatalogOnly)
    : resolveStorefrontVariantPrice({}, product, priceListId, isCatalogOnly);

  return {
    price: cheapestPricing.price,
    price_max: maxPrice !== null && maxPrice !== minPrice ? maxPrice : null,
    price_from: hasExplicit,
    original_price: cheapestPricing.original_price,
    discount_percentage: cheapestPricing.discount_percentage,
  };
}
