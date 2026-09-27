import type { StorefrontProductCardStyle } from "@/lib/types";

export interface ProductCardStyleClasses {
  card: string;
  imageWrap: string;
  title: string;
  meta: string;
  contentPadding: string;
  /** "fashion": çerçevesiz, 2:3 tam boy görsel (tekstil vitrinleri). */
  variant: "boxed" | "fashion";
}

const BASE: ProductCardStyleClasses = {
  card: "",
  imageWrap: "aspect-square",
  title: "line-clamp-2 text-sm font-semibold sm:text-[15px]",
  meta: "text-[11px] sm:text-xs",
  contentPadding: "p-3 sm:p-4",
  variant: "boxed",
};

export const PRODUCT_CARD_STYLE_CLASSES: Record<
  StorefrontProductCardStyle,
  ProductCardStyleClasses
> = {
  standard: BASE,
  compact: {
    card: "rounded-2xl",
    imageWrap: "aspect-[4/3]",
    title: "line-clamp-1 text-xs font-semibold sm:text-sm",
    meta: "text-[10px] sm:text-[11px]",
    contentPadding: "p-2 sm:p-3",
    variant: "boxed",
  },
  "image-forward": {
    card: "rounded-[1.75rem]",
    imageWrap: "aspect-[5/4]",
    title: "line-clamp-1 text-sm font-bold sm:text-base",
    meta: "hidden sm:block text-[11px]",
    contentPadding: "p-2.5 sm:p-3",
    variant: "boxed",
  },
  // Moda (28 Eyl 2026): setre.com tarzı — kart çerçevesi yok, görsel 2:3
  // kenardan kenara (object-cover), altında ad + fiyat. Yalnız tekstil
  // sektöründeki vitrinlere sunulur (bkz. appearance-catalog).
  fashion: {
    card: "",
    imageWrap: "aspect-[2/3]",
    title: "line-clamp-1 text-[13px] font-normal sm:text-[15px]",
    meta: "hidden",
    contentPadding: "px-0 pt-2.5 pb-1",
    variant: "fashion",
  },
};

export function getProductCardStyleClasses(
  style: StorefrontProductCardStyle | string | null | undefined,
): ProductCardStyleClasses {
  if (style && style in PRODUCT_CARD_STYLE_CLASSES) {
    return PRODUCT_CARD_STYLE_CLASSES[style as StorefrontProductCardStyle];
  }
  return PRODUCT_CARD_STYLE_CLASSES.standard;
}
