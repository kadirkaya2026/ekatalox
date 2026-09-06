// Vitrin katalog sıralaması (kullanıcı isteği, 6 Eyl 2026: toptancı
// vitrinlerinde müşteri fiyata / yeni eklenenlere göre sıralayabilsin).
// "featured" = bayinin panelde belirlediği sıra (display_order); SSR ilk
// sayfa hep bu sırayla gelir, diğerleri istemciden yeniden çekilir.
export const STOREFRONT_PRODUCT_SORTS = ["featured", "price_asc", "price_desc", "newest"] as const;
export type StorefrontProductSort = (typeof STOREFRONT_PRODUCT_SORTS)[number];

export function parseStorefrontProductSort(value: string | null | undefined): StorefrontProductSort {
  return (STOREFRONT_PRODUCT_SORTS as readonly string[]).includes(value ?? "")
    ? (value as StorefrontProductSort)
    : "featured";
}
