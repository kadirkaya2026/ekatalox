"use client";

import { memo } from "react";
import { Minus, Plus, Store, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StorefrontProduct } from "@/lib/types";
import { STOREFRONT_CART_THUMB_SIZES } from "@/lib/storefront/image-sizes";
import { formatProductModelNo } from "@/lib/products/constants";
import { cn } from "@/lib/utils";
import { StorefrontImage } from "@/components/storefront/storefront-image";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { ProductPrice } from "@/components/storefront/storefront-product-card";

function StorefrontInlineCartAction({
  product,
  cartQuantity,
  onIncrease,
  onDecrease,
  onOpenAddToCart,
}: {
  product: StorefrontProduct;
  cartQuantity: number;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onOpenAddToCart: (productId: string) => void;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();

  if (!product.is_in_stock) {
    return (
      <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold", theme.stockBadgeOut)}>
        {t("product.soon")}
      </span>
    );
  }

  if (cartQuantity > 0) {
    return (
      <div
        data-unit-picker-root="true"
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-xl p-1",
          theme.border,
          theme.surface,
        )}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (!product.has_variants) {
              onDecrease(product.id);
            } else {
              onOpenAddToCart(product.id);
            }
          }}
          className={cn("flex size-8 items-center justify-center rounded-lg transition", theme.quantityStepperButton)}
          aria-label={cartQuantity === 1 && !product.has_variants ? t("listRow.removeAria") : t("listRow.decreaseAria")}
        >
          {!product.has_variants && cartQuantity === 1 ? (
            <Trash2 className="size-4" />
          ) : (
            <Minus className="size-4" />
          )}
        </button>
        <span className={cn("min-w-7 text-center text-sm font-bold", theme.text)}>
          {product.has_variants ? `${cartQuantity}M` : cartQuantity}
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (!product.has_variants) {
              onIncrease(product.id);
            } else {
              onOpenAddToCart(product.id);
            }
          }}
          className={cn(
            "flex size-8 items-center justify-center rounded-lg text-white transition",
            theme.primaryButton,
          )}
          aria-label={t("listRow.increaseAria")}
        >
          <Plus className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpenAddToCart(product.id);
      }}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl text-white transition",
        theme.floatingCartAddButton,
      )}
      aria-label={t("listRow.addAria")}
    >
      <Plus className="size-4" strokeWidth={2.8} />
    </button>
  );
}

export const StorefrontProductListRow = memo(function StorefrontProductListRow({
  product,
  cartQuantity,
  addedVariantCount,
  onOpenDetail,
  onIncrease,
  onDecrease,
  onOpenAddToCart,
}: {
  product: StorefrontProduct;
  cartQuantity: number;
  addedVariantCount: number;
  onOpenDetail: (productId: string) => void;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onOpenAddToCart: (productId: string) => void;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();

  const handleOpenDetail = () => onOpenDetail(product.id);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleOpenDetail}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpenDetail();
        }
      }}
      className={cn(
        "grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-2.5 transition sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:gap-4 sm:p-3",
        theme.border,
        theme.surface,
        theme.elevation1,
        theme.surfaceRing,
        !product.is_in_stock && "opacity-60 saturate-50",
      )}
    >
      <div
        className={cn(
          "relative size-14 shrink-0 overflow-hidden rounded-xl sm:size-16",
          theme.border,
          theme.productImageWrap,
        )}
      >
        {product.image_url ? (
          <StorefrontImage
            src={product.image_url}
            alt={product.product_name}
            className="object-contain p-1.5 sm:p-2"
            sizes={STOREFRONT_CART_THUMB_SIZES}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Store className={cn("size-5", theme.logoPlaceholder)} />
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-0.5">
        <p className={cn("line-clamp-2 text-[13px] font-semibold leading-5 sm:text-sm", theme.productTitle)}>
          {product.product_name}
        </p>
        {theme.showProductModelNo ? (
          <p className={cn("truncate text-[11px]", theme.productMeta)}>
            {formatProductModelNo(product.sku_code)}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {product.is_in_stock ? (
            <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold", theme.stockBadgeIn)}>
              {t("product.inStock")}
            </span>
          ) : (
            <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold", theme.stockBadgeOut)}>
              {t("product.soon")}
            </span>
          )}
          {product.has_variants ? (
            <>
              <Badge className={theme.variantBadge}>{t("product.modelCount", { count: product.variants.length })}</Badge>
              {addedVariantCount > 0 ? (
                <Badge className={theme.addedVariantBadge}>{t("product.modelsAddedShort", { count: addedVariantCount })}</Badge>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="col-start-3 row-start-1 text-right sm:col-start-3">
        <ProductPrice product={product} size="compact" />
      </div>

      <div
        className="col-start-3 row-start-2 flex justify-end sm:col-start-4 sm:row-start-1 sm:items-center"
        onClick={(event) => event.stopPropagation()}
      >
        <StorefrontInlineCartAction
          product={product}
          cartQuantity={cartQuantity}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          onOpenAddToCart={onOpenAddToCart}
        />
      </div>
    </article>
  );
});
