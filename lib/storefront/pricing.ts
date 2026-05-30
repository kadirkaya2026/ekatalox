import { toStorefrontVariant } from "@/lib/products/records";
import type { PriceTierLevel, Product, StorefrontProduct } from "@/lib/types";

export function pickPriceByTier(product: Product, tierLevel: PriceTierLevel) {
  if (tierLevel === 1) {
    return Number(product.price_tier_1);
  }

  if (tierLevel === 2) {
    return Number(product.price_tier_2);
  }

  return Number(product.price_tier_3);
}

export function computeDiscountPercentage(original: number, sale: number) {
  if (original <= 0 || sale >= original) {
    return null;
  }

  return Math.round(((original - sale) / original) * 100);
}

export function getMinTierPrice(
  product: Pick<Product, "price_tier_1" | "price_tier_2" | "price_tier_3">,
) {
  return Math.min(
    Number(product.price_tier_1),
    Number(product.price_tier_2),
    Number(product.price_tier_3),
  );
}

export function resolveStorefrontPrice(product: Product, tierLevel: PriceTierLevel) {
  const tierPrice = pickPriceByTier(product, tierLevel);
  const discountPrice =
    typeof product.discount_price === "number" ? product.discount_price : null;

  if (
    product.is_discount_active &&
    discountPrice !== null &&
    discountPrice >= 0 &&
    discountPrice < tierPrice
  ) {
    return {
      price: discountPrice,
      original_price: tierPrice,
      discount_percentage: computeDiscountPercentage(tierPrice, discountPrice),
    };
  }

  return {
    price: tierPrice,
    original_price: null,
    discount_percentage: null,
  };
}

export function toStorefrontProduct(product: Product, tierLevel: PriceTierLevel): StorefrontProduct {
  const variants = (product.variants ?? []).map((variant) =>
    toStorefrontVariant(variant, product.is_in_stock),
  );
  const pricing = resolveStorefrontPrice(product, tierLevel);

  return {
    id: product.id,
    category_id: product.category_id,
    sku_code: product.sku_code,
    product_name: product.product_name,
    description: product.description ?? null,
    image_url: product.image_url,
    is_in_stock: product.is_in_stock,
    currency: product.currency,
    price: pricing.price,
    original_price: pricing.original_price,
    discount_percentage: pricing.discount_percentage,
    package_quantity: product.package_quantity,
    carton_quantity: product.carton_quantity,
    stock_quantity: null,
    has_variants: variants.length > 0,
    variants,
  };
}
