export function getStorefrontHomePath() {
  return "/";
}

export function getStorefrontSectionPath(sectionId: string) {
  return `/section/${sectionId}`;
}

/**
 * Vitrin ürün sayfası adresi: model kodu URL'e uygunsa /urun/<kod> (küçük
 * harf), değilse /urun/<id>. Sunucu tarafı eşleşme lib/data.ts
 * getStorefrontProductBySlug.
 */
export function getStorefrontProductPath(product: { id: string; sku_code?: string | null }) {
  const sku = (product.sku_code ?? "").trim().toLowerCase();
  return `/urun/${/^[a-z0-9_-]+$/.test(sku) ? sku : product.id}`;
}

export function toPublicStorefrontPath(pathname: string, subdomain: string) {
  const internalBase = `/store/${subdomain}`;

  if (pathname === internalBase) {
    return getStorefrontHomePath();
  }

  if (pathname.startsWith(`${internalBase}/`)) {
    return pathname.slice(internalBase.length) || getStorefrontHomePath();
  }

  return pathname;
}
