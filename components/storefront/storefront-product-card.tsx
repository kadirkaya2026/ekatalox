"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Minus, Plus, Store, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StorefrontProduct } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const floatingActionTransition = {
  type: "spring",
  stiffness: 420,
  damping: 28,
  mass: 0.9,
} as const;

export type ProductPriceSize = "card" | "modal" | "crossSell" | "compact";

export function ProductPrice({
  product,
  size = "card",
}: {
  product: Pick<StorefrontProduct, "price" | "original_price" | "currency">;
  size?: ProductPriceSize;
}) {
  const sizeClasses = {
    card: {
      current: "text-sm font-extrabold text-emerald-600 sm:text-base",
      original: "text-[10px] font-medium text-slate-400 line-through sm:text-xs",
    },
    crossSell: {
      current: "text-base font-extrabold text-emerald-600",
      original: "text-[11px] font-medium text-slate-400 line-through",
    },
    modal: {
      current: "text-2xl font-extrabold tracking-tight text-emerald-600",
      original: "text-sm font-medium text-slate-400 line-through",
    },
    compact: {
      current: "text-sm font-extrabold text-emerald-600",
      original: "text-[11px] font-medium text-slate-400 line-through",
    },
  }[size];

  const hasDiscount =
    typeof product.original_price === "number" && product.original_price > product.price;

  if (!hasDiscount) {
    return (
      <p className={sizeClasses.current}>
        {formatCurrency(product.price, product.currency)}
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      <p className={sizeClasses.original}>
        {formatCurrency(product.original_price!, product.currency)}
      </p>
      <p className={sizeClasses.current}>
        {formatCurrency(product.price, product.currency)}
      </p>
    </div>
  );
}

export function DiscountSticker({ product }: { product: StorefrontProduct }) {
  if (
    typeof product.discount_percentage !== "number" ||
    product.discount_percentage <= 0
  ) {
    return null;
  }

  return (
    <span className="absolute left-2 top-2 z-10 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
      %{product.discount_percentage} İndirim
    </span>
  );
}

export const StorefrontFloatingCartAction = memo(function StorefrontFloatingCartAction({
  product,
  cartQuantity,
  compact = false,
  onIncrease,
  onDecrease,
  onOpenAddToCart,
}: {
  product: StorefrontProduct;
  cartQuantity: number;
  compact?: boolean;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onOpenAddToCart: (productId: string) => void;
}) {
  if (!product.is_in_stock) {
    return null;
  }

  if (cartQuantity > 0) {
    return (
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={`stepper-${product.id}`}
          data-unit-picker-root="true"
          onClick={(event) => event.stopPropagation()}
          initial={{ opacity: 0, scale: 0.88, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -4 }}
          transition={floatingActionTransition}
          className={cn(
            "absolute z-30 flex origin-top-right flex-col items-center rounded-[1.35rem] border border-emerald-400/30 bg-[linear-gradient(180deg,rgba(16,185,129,0.98)_0%,rgba(5,150,105,0.96)_100%)] p-1 text-white shadow-[0_18px_40px_rgba(5,150,105,0.34)] backdrop-blur",
            compact ? "-right-2 -top-2" : "-right-2.5 -top-2.5 sm:-right-2 sm:-top-2",
            compact ? "w-10" : "w-11 sm:w-12",
          )}
        >
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={(event) => {
              event.stopPropagation();
              if (!product.has_variants) {
                onIncrease(product.id);
              } else {
                onOpenAddToCart(product.id);
              }
            }}
            className={cn(
              "flex items-center justify-center rounded-full text-white transition hover:bg-white/15",
              compact ? "size-8" : "size-9 sm:size-10",
            )}
            aria-label="Adedi artır"
          >
            <Plus className={compact ? "size-4" : "size-4 sm:size-5"} />
          </motion.button>
          <motion.span
            layout
            className={cn(
              "flex min-h-7 items-center justify-center text-center font-bold leading-none",
              compact ? "px-1 text-[11px]" : "px-1 text-sm",
            )}
          >
            {product.has_variants ? `${cartQuantity}M` : cartQuantity}
          </motion.span>
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={(event) => {
              event.stopPropagation();
              if (!product.has_variants) {
                onDecrease(product.id);
              } else {
                onOpenAddToCart(product.id);
              }
            }}
            className={cn(
              "flex items-center justify-center rounded-full text-white transition hover:bg-white/15",
              compact ? "size-8" : "size-9 sm:size-10",
            )}
            aria-label={
              product.has_variants
                ? "Model seçimini aç"
                : cartQuantity === 1
                  ? "Ürünü sepetten çıkar"
                  : "Adedi azalt"
            }
          >
            {!product.has_variants && cartQuantity === 1 ? (
              <Trash2 className={compact ? "size-4" : "size-4 sm:size-5"} />
            ) : (
              <Minus className={compact ? "size-4" : "size-4 sm:size-5"} />
            )}
          </motion.button>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      layout
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "absolute z-30 origin-top-right",
        compact ? "-right-2 -top-2" : "-right-2.5 -top-2.5 sm:-right-2 sm:-top-2",
      )}
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.03 }}
        onClick={(event) => {
          event.stopPropagation();
          onOpenAddToCart(product.id);
        }}
        className={cn(
          "flex items-center justify-center rounded-xl border border-emerald-600 bg-emerald-500 text-white shadow-[0_14px_30px_rgba(16,185,129,0.32)] transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-400",
          compact ? "size-8" : "size-9 sm:size-10",
        )}
        aria-label="Ürün ekleme birimini seç"
      >
        <Plus className={compact ? "size-3.5" : "size-4"} strokeWidth={2.8} />
      </motion.button>
    </motion.div>
  );
});

export const StorefrontProductCard = memo(function StorefrontProductCard({
  product,
  cartQuantity,
  addedVariantCount,
  productCardClassName,
  productImageWrapClassName,
  onOpenDetail,
  onIncrease,
  onDecrease,
  onOpenAddToCart,
}: {
  product: StorefrontProduct;
  cartQuantity: number;
  addedVariantCount: number;
  productCardClassName: string;
  productImageWrapClassName: string;
  onOpenDetail: (productId: string) => void;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onOpenAddToCart: (productId: string) => void;
}) {
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
        productCardClassName,
        "relative overflow-visible cursor-pointer rounded-[1.2rem] border-slate-200/70 shadow-[0_10px_24px_rgba(15,23,42,0.06)]",
        !product.is_in_stock && "opacity-60 saturate-50",
      )}
    >
      <StorefrontFloatingCartAction
        product={product}
        cartQuantity={cartQuantity}
        compact
        onIncrease={onIncrease}
        onDecrease={onDecrease}
        onOpenAddToCart={onOpenAddToCart}
      />
      <div
        className={cn(
          productImageWrapClassName,
          "overflow-hidden rounded-t-[1.2rem] p-2.5 sm:p-4",
        )}
      >
        <DiscountSticker product={product} />
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.product_name}
            fill
            className="object-contain p-3 transition duration-500 group-hover:scale-[1.04] sm:p-5"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-[1rem] border border-dashed border-slate-200/80 bg-white/70">
            <Store className="size-7 text-slate-300 sm:size-9" />
          </div>
        )}
        {!product.is_in_stock ? (
          <div className="absolute inset-x-0 bottom-0 z-10 bg-slate-950/72 px-2 py-1.5 text-center backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white sm:text-[11px]">
              Tükendi
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5 sm:p-3.5">
        <ProductPrice product={product} size="card" />
        <p className="line-clamp-2 text-[11px] font-semibold leading-4 text-slate-900 sm:text-[13px] sm:leading-5">
          {product.product_name}
        </p>
        <p className="truncate text-[10px] leading-4 text-slate-400 sm:text-[11px]">
          {product.sku_code ? `SKU: ${product.sku_code}` : "SKU bilgisi yok"}
        </p>
        {product.has_variants ? (
          <div className="flex flex-wrap gap-1 pt-1">
            <Badge className="bg-blue-50 px-2 py-1 text-[10px] text-blue-700">
              {product.variants.length} model
            </Badge>
            {addedVariantCount > 0 ? (
              <Badge className="bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">
                {addedVariantCount} Model Eklendi
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
});
