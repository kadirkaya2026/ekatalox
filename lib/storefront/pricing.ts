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

export function toStorefrontProduct(product: Product, tierLevel: PriceTierLevel): StorefrontProduct {
  return {
    id: product.id,
    category_id: product.category_id,
    sku_code: product.sku_code,
    product_name: product.product_name,
    image_url: product.image_url,
    is_in_stock: product.is_in_stock,
    currency: product.currency,
    price: pickPriceByTier(product, tierLevel),
    package_quantity: product.package_quantity,
    carton_quantity: product.carton_quantity,
  };
}