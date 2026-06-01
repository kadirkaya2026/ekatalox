"use client";

import type { StorefrontProduct } from "@/lib/types";
import { useStorefrontLayout } from "@/lib/storefront/layout-context";
import {
  StorefrontProductCard,
} from "@/components/storefront/storefront-product-card";
import { StorefrontProductListRow } from "@/components/storefront/storefront-product-list-row";

export function StorefrontProductListing({
  products,
  cartQuantityByProductId,
  cartVariantCountByProductId,
  productCardClassName,
  productImageWrapClassName,
  gridClassName,
  onOpenDetail,
  onIncrease,
  onDecrease,
  onOpenAddToCart,
}: {
  products: StorefrontProduct[];
  cartQuantityByProductId: Map<string, number>;
  cartVariantCountByProductId: Map<string, number>;
  productCardClassName: string;
  productImageWrapClassName: string;
  gridClassName?: string;
  onOpenDetail: (productId: string) => void;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onOpenAddToCart: (productId: string) => void;
}) {
  const layout = useStorefrontLayout();
  const containerClass = gridClassName ?? layout.productGridClass;

  if (layout.productView === "list-row") {
    return (
      <div className={containerClass}>
        {products.map((product) => (
          <StorefrontProductListRow
            key={product.id}
            product={product}
            cartQuantity={
              product.has_variants
                ? cartVariantCountByProductId.get(product.id) ?? 0
                : cartQuantityByProductId.get(product.id) ?? 0
            }
            addedVariantCount={cartVariantCountByProductId.get(product.id) ?? 0}
            onOpenDetail={onOpenDetail}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
            onOpenAddToCart={onOpenAddToCart}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {products.map((product) => (
        <StorefrontProductCard
          key={product.id}
          product={product}
          cartQuantity={
            product.has_variants
              ? cartVariantCountByProductId.get(product.id) ?? 0
              : cartQuantityByProductId.get(product.id) ?? 0
          }
          addedVariantCount={cartVariantCountByProductId.get(product.id) ?? 0}
          productCardClassName={productCardClassName}
          productImageWrapClassName={productImageWrapClassName}
          onOpenDetail={onOpenDetail}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          onOpenAddToCart={onOpenAddToCart}
        />
      ))}
    </div>
  );
}
