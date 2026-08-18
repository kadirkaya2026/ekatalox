"use client";

import { Store, Tag } from "lucide-react";
import type { CategoryNode } from "@/lib/categories/tree";
import { getDescendantCategoryIds } from "@/lib/categories/tree";
import type { BannerItem, Category, StorefrontProduct } from "@/lib/types";
import { STOREFRONT_BANNER_SIZES, STOREFRONT_PRODUCT_GRID_SIZES } from "@/lib/storefront/image-sizes";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { cn, formatCurrency } from "@/lib/utils";
import { StorefrontImage } from "@/components/storefront/storefront-image";

const CLUSTER_GRADIENTS = [
  "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  "linear-gradient(135deg, #1d4ed8 0%, #38bdf8 100%)",
  "linear-gradient(135deg, #b45309 0%, #f59e0b 100%)",
];

function ClusterBox({
  banner,
  index,
  large,
  title,
}: {
  banner: BannerItem;
  index: number;
  large?: boolean;
  title: string;
}) {
  const { t } = useStorefrontLocale();
  const href = banner.cta_href?.trim() || null;
  const Wrapper = href ? "a" : "div";

  return (
    <Wrapper
      {...(href ? { href } : {})}
      className={cn(
        "relative block w-full overflow-hidden rounded-[1.75rem]",
        large ? "aspect-[3/2]" : "aspect-[16/9]",
        banner.is_visible_on_mobile === false && "hidden sm:block",
      )}
      style={{
        background: banner.background_color ?? CLUSTER_GRADIENTS[index % CLUSTER_GRADIENTS.length],
      }}
    >
      {banner.image_url ? (
        <StorefrontImage
          src={banner.image_url}
          alt={banner.title ?? `${title} kampanya`}
          className="object-cover object-center"
          sizes={STOREFRONT_BANNER_SIZES}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <div className={cn("absolute inset-0 flex flex-col justify-end p-4", large ? "sm:p-7" : "sm:p-4")}>
        {banner.title ? (
          <p className={cn("font-bold text-white", large ? "text-lg sm:text-2xl" : "text-sm sm:text-base")}>
            {banner.title}
          </p>
        ) : null}
        {banner.description ? (
          <p className={cn("mt-1 text-white/85", large ? "text-sm sm:text-base" : "text-xs")}>
            {banner.description}
          </p>
        ) : null}
        <span
          className={cn(
            "mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900",
          )}
        >
          {t("catalog.discoverCta")}
        </span>
      </div>
    </Wrapper>
  );
}

export function StorefrontHeroCluster({
  heroClusterItems,
  storefrontTitle,
}: {
  heroClusterItems: BannerItem[];
  storefrontTitle: string;
}) {
  if (heroClusterItems.length < 2) {
    return null;
  }

  const [main, ...rest] = heroClusterItems;
  const sideItems = rest.slice(0, 2);
  // Her görsel kendi mobil görünürlüğünü taşır (bkz. ClusterBox); hepsi
  // mobilde gizliyse bölümün boş grid boşluğu (margin) da kalmasın.
  const noneVisibleOnMobile = [main, ...sideItems].every(
    (banner) => banner.is_visible_on_mobile === false,
  );

  return (
    <section
      className={cn(
        "grid-cols-1 gap-3 sm:mb-8 sm:grid sm:grid-cols-[1.6fr_1fr] sm:gap-4",
        noneVisibleOnMobile ? "hidden sm:grid" : "mb-5 grid",
      )}
    >
      <ClusterBox banner={main} index={0} large title={storefrontTitle} />
      <div className="grid grid-cols-1 gap-3">
        {sideItems.map((banner, index) => (
          <ClusterBox key={banner.id} banner={banner} index={index + 1} title={storefrontTitle} />
        ))}
      </div>
    </section>
  );
}

export function StorefrontPromoTiles({ products }: { products: StorefrontProduct[] }) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();

  const discounted = products.filter((product) => (product.discount_percentage ?? 0) > 0).slice(0, 6);

  if (!discounted.length) {
    return null;
  }

  return (
    <section className="mb-5 sm:mb-8">
      <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {discounted.map((product) => (
          <div
            key={product.id}
            className={cn(
              "relative w-40 shrink-0 overflow-hidden rounded-2xl p-3 sm:w-auto",
              theme.border,
              theme.surface,
              theme.elevation1,
            )}
          >
            <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
              <Tag className="size-2.5" />%{Math.round(product.discount_percentage ?? 0)}
            </span>
            <div className={cn("relative aspect-square overflow-hidden rounded-xl", theme.productImageWrap)}>
              {product.image_url ? (
                <StorefrontImage
                  src={product.image_url}
                  alt={product.product_name}
                  className="object-contain p-3"
                  sizes={STOREFRONT_PRODUCT_GRID_SIZES}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Store className={cn("size-6", theme.textMuted)} />
                </div>
              )}
            </div>
            <p className={cn("mt-2 line-clamp-2 text-xs font-semibold", theme.text)}>{product.product_name}</p>
            {product.price ? (
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={cn("text-sm font-extrabold", theme.productPrice)}>
                  {formatCurrency(product.price, product.currency)}
                </span>
                {product.original_price ? (
                  <span className={cn("text-[11px] font-medium line-through", theme.textMuted)}>
                    {formatCurrency(product.original_price, product.currency)}
                  </span>
                ) : null}
              </div>
            ) : null}
            <p className={cn("mt-1 text-[10px] font-medium", theme.textMuted)}>{t("catalog.viewProduct")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const TILE_GRADIENTS = [
  "linear-gradient(135deg, #059669 0%, #10b981 100%)",
  "linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)",
  "linear-gradient(135deg, #b45309 0%, #f59e0b 100%)",
  "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
  "linear-gradient(135deg, #be123c 0%, #fb7185 100%)",
  "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
];

export function StorefrontCategoryTiles({
  categories,
  flatCategories,
  selectedCategoryId,
  products,
  onCategoryChange,
  layout = "scroll",
}: {
  categories: CategoryNode[];
  flatCategories: Category[];
  selectedCategoryId: string;
  products: StorefrontProduct[];
  onCategoryChange: (categoryId: string) => void;
  layout?: "scroll" | "grid4";
}) {
  const theme = useStorefrontTheme();

  if (!categories.length) {
    return null;
  }

  const isGrid4 = layout === "grid4";

  const tiles = categories.map((category, index) => {
    // Öncelik: kare kutucuk için özel yüklenen görsel (tile_image_url) →
    // kategori sayfasının geniş banner'ı (kırpılarak) → kategorideki (alt
    // kategoriler dahil) bir ürünün fotoğrafı. Burada gösterilen kategoriler
    // genelde ANA (üst) kategoriler — ürünler ise her zaman en alttaki
    // yaprak kategoriye atanır, bu yüzden sadece tam category_id eşleşmesi
    // aramak (eski davranış) üst kategori kutucuklarını hep görselsiz
    // bırakıyordu; alt kategori id'leri de dahil edilerek düzeltildi.
    const customImage = category.tile_image_url ?? category.banner_item?.image_url ?? null;
    const categoryAndDescendantIds = new Set(getDescendantCategoryIds(flatCategories, category.id));
    const representativeProduct = products.find((product) => categoryAndDescendantIds.has(product.category_id));
    const isActive = selectedCategoryId === category.id || categoryAndDescendantIds.has(selectedCategoryId);
    return { category, image: customImage ?? representativeProduct?.image_url ?? null, index, isActive };
  });

  return (
    <section className={isGrid4 ? "" : "mb-5 sm:mb-8"}>
      <div
        className={
          isGrid4
            ? "grid grid-cols-4 gap-2.5"
            : "scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-6 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-10"
        }
      >
        {tiles.map(({ category, image, index, isActive }) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryChange(category.id)}
            className={
              isGrid4
                ? "group flex flex-col items-center gap-2"
                : "group flex w-20 shrink-0 flex-col items-center gap-1.5 sm:w-auto"
            }
          >
            <div
              className={cn(
                isGrid4
                  ? "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl shadow-sm transition group-hover:scale-105"
                  : "relative flex size-16 items-center justify-center overflow-hidden rounded-2xl shadow-sm transition group-hover:scale-105 sm:size-16",
                isActive && theme.activeTileBg,
              )}
              style={isActive ? undefined : { background: TILE_GRADIENTS[index % TILE_GRADIENTS.length] }}
            >
              {image ? (
                <StorefrontImage
                  src={image}
                  alt={category.name}
                  className="object-cover"
                  sizes={isGrid4 ? "33vw" : "64px"}
                />
              ) : (
                <Store className={cn(isGrid4 ? "size-8" : "size-6", isActive ? theme.activeTileText : "text-white/90")} />
              )}
            </div>
            <span
              className={cn(
                "line-clamp-2 text-center text-[11px] font-semibold leading-tight",
                theme.text,
              )}
            >
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
