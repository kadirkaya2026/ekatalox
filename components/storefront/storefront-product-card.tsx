"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BorderTrace, useCartAddFeedback } from "@/components/storefront/border-trace";
import type { StorefrontProduct } from "@/lib/types";
import { STOREFRONT_PRODUCT_GRID_SIZES } from "@/lib/storefront/image-sizes";
import { formatProductModelNo } from "@/lib/products/constants";
import { cn, formatCurrency } from "@/lib/utils";
import { StorefrontImage } from "@/components/storefront/storefront-image";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";

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
  product: Pick<
    StorefrontProduct,
    "price" | "price_max" | "price_from" | "original_price" | "currency"
  >;
  size?: ProductPriceSize;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();

  if (product.price === null) {
    return null;
  }

  const sizeClasses = {
    card: {
      current: cn("text-sm sm:text-base", theme.productPrice),
      original: cn("text-[10px] sm:text-xs", theme.productPriceOriginal),
    },
    crossSell: {
      current: cn("text-base", theme.productPrice),
      original: cn("text-[11px]", theme.productPriceOriginal),
    },
    modal: {
      current: cn("text-2xl tracking-tight", theme.productPrice),
      original: cn("text-sm", theme.productPriceOriginal),
    },
    compact: {
      current: cn("text-sm", theme.productPrice),
      original: cn("text-[11px]", theme.productPriceOriginal),
    },
  }[size];

  const hasDiscount =
    typeof product.original_price === "number" && product.original_price > product.price;
  const hasPriceRange =
    typeof product.price_max === "number" && product.price_max > product.price;
  // Modelli üründe kartta yalnız en düşük fiyat, EK METİNSİZ gösterilir
  // ("…'den başlayan fiyatlarla" istenmedi — kullanıcı kararı, 2 Eyl 2026).
  const currentPriceLabel =
    size === "compact" || product.price_from
      ? formatCurrency(product.price, product.currency)
      : hasPriceRange
        ? `${formatCurrency(product.price, product.currency)}${t("product.priceFromRangeSuffix")}`
        : formatCurrency(product.price, product.currency);

  if (!hasDiscount) {
    return (
      <p className={sizeClasses.current}>
        {currentPriceLabel}
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      <p className={sizeClasses.original}>
        {formatCurrency(product.original_price!, product.currency)}
      </p>
      <p className={sizeClasses.current}>
        {currentPriceLabel}
      </p>
    </div>
  );
}

export function DiscountSticker({ product }: { product: StorefrontProduct }) {
  const { t } = useStorefrontLocale();

  if (
    product.price === null ||
    typeof product.discount_percentage !== "number" ||
    product.discount_percentage <= 0
  ) {
    return null;
  }

  return (
    <span className="absolute left-2 top-2 z-10 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
      {t("product.discountBadge", { percentage: product.discount_percentage })}
    </span>
  );
}

export const StorefrontFloatingCartAction = memo(function StorefrontFloatingCartAction({
  product,
  cartQuantity,
  compact = false,
  positionClassName,
  onIncrease,
  onDecrease,
  onOpenAddToCart,
}: {
  product: StorefrontProduct;
  cartQuantity: number;
  compact?: boolean;
  // Varsayılanda buton/step kartın köşesinden DIŞARI taşar. Yatay
  // kaydırma kabı (ör. indirimli ürün şeridi) taşan kısmı kırptığı için
  // oradaki kartlar konumu kart İÇİNE alacak şekilde geçersiz kılıyor.
  positionClassName?: string;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onOpenAddToCart: (productId: string) => void;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  // Paket/koli seçimli ürünlerde satır kimliği birime bağlı: +/- doğrudan
  // adet artıramaz, birim seçme penceresi açılır (modeller gibi).
  const unitBased =
    product.has_variants || Boolean(product.package_quantity) || Boolean(product.carton_quantity);

  if (!product.is_in_stock) {
    return null;
  }

  if (cartQuantity > 0) {
    return (
      <AnimatePresence initial={false}>
        <motion.div
          key={`stepper-${product.id}`}
          data-unit-picker-root="true"
          onClick={(event) => event.stopPropagation()}
          initial={{ opacity: 0, scale: 0.88, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -4 }}
          transition={floatingActionTransition}
          className={cn(
            "absolute z-30 flex origin-top-right flex-col items-center rounded-[1.35rem] p-1 text-white",
            theme.floatingCartStepper,
            positionClassName ??
              (compact ? "-right-2 -top-2" : "-right-2.5 -top-2.5 sm:-right-2 sm:-top-2"),
            compact ? "w-10" : "w-11 sm:w-12",
          )}
        >
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={(event) => {
              event.stopPropagation();
              if (!unitBased) {
                onIncrease(product.id);
              } else {
                onOpenAddToCart(product.id);
              }
            }}
            className={cn(
              "flex items-center justify-center rounded-full text-white transition hover:bg-white/15",
              compact ? "size-8" : "size-9 sm:size-10",
            )}
            aria-label={t("product.increaseAria")}
          >
            <Plus className={compact ? "size-4" : "size-4 sm:size-5"} />
          </motion.button>
          <span
            className={cn(
              "flex min-h-7 items-center justify-center text-center font-bold leading-none",
              compact ? "px-1 text-[11px]" : "px-1 text-sm",
            )}
          >
            {product.has_variants ? `${cartQuantity}M` : cartQuantity}
          </span>
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={(event) => {
              event.stopPropagation();
              if (!unitBased) {
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
                ? t("product.openVariantSelectionAria")
                : cartQuantity === 1
                  ? t("product.removeAria")
                  : t("product.decreaseAria")
            }
          >
            {!unitBased && cartQuantity === 1 ? (
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
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "absolute z-30 origin-top-right",
        positionClassName ??
          (compact ? "-right-2 -top-2" : "-right-2.5 -top-2.5 sm:-right-2 sm:-top-2"),
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
          theme.floatingCartAddButton,
          compact ? "size-8" : "size-9 sm:size-10",
        )}
        aria-label={t("product.selectAddUnitAria")}
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
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const handleOpenDetail = () => onOpenDetail(product.id);

  // Getir tarzı sepete ekleme geri bildirimi (ortak mantık: border-trace.tsx
  // useCartAddFeedback) — indirimli ürün şeridiyle birebir aynı davranış.
  const { imagePulse, traceRef: borderTraceRef, initiallyInCart } =
    useCartAddFeedback(cartQuantity);

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
        "relative overflow-visible cursor-pointer rounded-[1.2rem] outline-none focus-visible:ring-2 focus-visible:ring-current/50",
        theme.border,
        theme.elevation1,
        theme.surfaceRing,
        !product.is_in_stock && "opacity-60 saturate-50",
      )}
    >
      {/* Sepetteki ürünün çizgisi görselin değil KARTIN çevresini dolanır
          (kullanıcı kararı, 3 Eyl 2026). */}
      <BorderTrace
        ref={borderTraceRef}
        defaultVisible={initiallyInCart}
        className={theme.productImageSparkle}
        radius={19}
      />
      <StorefrontFloatingCartAction
        product={product}
        cartQuantity={cartQuantity}
        compact
        onIncrease={onIncrease}
        onDecrease={onDecrease}
        onOpenAddToCart={onOpenAddToCart}
      />
      <motion.div
        animate={imagePulse}
        className={cn(
          productImageWrapClassName,
          "overflow-hidden rounded-[1.2rem] p-2.5 sm:p-4",
        )}
      >
        <DiscountSticker product={product} />
        {product.image_url ? (
          <StorefrontImage
            src={product.image_url}
            alt={product.product_name}
            className="object-contain p-3 transition duration-500 group-hover:scale-[1.04] sm:p-5"
            sizes={STOREFRONT_PRODUCT_GRID_SIZES}
          />
        ) : (
          <div className={theme.emptyImage}>
            <ProductImagePlaceholder
              productName={product.product_name}
              iconClassName={cn("size-6 sm:size-7", theme.textMuted)}
              textClassName={cn("text-[10px] sm:text-[11px]", theme.textMuted)}
            />
          </div>
        )}
        {!product.is_in_stock ? (
          <div className={theme.productOutOverlay}>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white sm:text-[11px]">
              {t("product.soon")}
            </span>
          </div>
        ) : null}
      </motion.div>

      <div className="flex flex-1 flex-col gap-1 p-2.5 sm:p-3.5">
        <ProductPrice product={product} size="card" />
        {/* Mobilde 3 satır: dar kartta ürün adı anlaşılmaz kalmasın. */}
        <p className={cn("line-clamp-3 text-[11px] leading-4 sm:line-clamp-2 sm:text-[13px] sm:leading-5", theme.productTitle)}>
          {product.product_name}
        </p>
        {theme.showProductModelNo ? (
          <p className={cn("truncate text-[10px] leading-4 sm:text-[11px]", theme.productMeta)}>
            {formatProductModelNo(product.sku_code)}
          </p>
        ) : null}
        {product.has_variants ? (
          <div className="flex flex-wrap gap-1 pt-1">
            <Badge className={theme.variantBadge}>
              {t("product.modelCount", { count: product.variants.length })}
            </Badge>
            {addedVariantCount > 0 ? (
              <Badge className={theme.addedVariantBadge}>
                {t("product.modelsAdded", { count: addedVariantCount })}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
});
