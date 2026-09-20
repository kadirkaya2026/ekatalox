"use client";

import type { StorefrontProduct } from "@/lib/types";
import { useStorefrontLayout } from "@/lib/storefront/layout-context";
import {
  StorefrontProductCard,
} from "@/components/storefront/storefront-product-card";
import { StorefrontProductListRow } from "@/components/storefront/storefront-product-list-row";
import { Fragment, type ReactNode } from "react";

// Ücretsiz plan: her `every` üründen sonra bir reklam kartı (bkz.
// components/storefront/storefront-ads.tsx). Grid ve liste görünümünde aynı.
export type StorefrontAdSlot = { every: number; card: ReactNode; row: ReactNode };

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
  adSlot,
}: {
  products: StorefrontProduct[];
  adSlot?: StorefrontAdSlot | null;
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
  const adEvery = adSlot && adSlot.every > 0 ? adSlot.every : 0;
  const renderAd = (index: number, node: ReactNode) =>
    adEvery && (index + 1) % adEvery === 0 ? <Fragment key={`ad-${index}`}>{node}</Fragment> : null;

  if (layout.productView === "list-row") {
    return (
      <div className={containerClass}>
        {products.map((product, index) => (
          <Fragment key={product.id}>
          <StorefrontProductListRow
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
          {renderAd(index, adSlot?.row)}
          </Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {products.map((product, index) => (
        <Fragment key={product.id}>
        <StorefrontProductCard
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
        {renderAd(index, adSlot?.card)}
        </Fragment>
      ))}
    </div>
  );
}
