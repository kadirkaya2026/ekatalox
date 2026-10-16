import {
  attributeKey,
  compareAttributeValues,
  resolveVariantAttributes,
} from "@/lib/products/variant-attributes";
import type { StorefrontProduct } from "@/lib/types";

// Vitrin filtresi (16 Eki 2026, Trendyol düzeni): kategori sayfasında alt
// kategori, marka, fiyat aralığı, indirim ve varyant özellikleri (Beden,
// Renk…). Fiyat ziyaretçinin fiyat listesine bağlı olduğundan süzme,
// fiyat sıralamasındaki gibi ince satırlar üzerinde sunucuda yapılır.

export interface StorefrontRefine {
  /** Seçilen alt kategoriler, alt dalları dahil genişletilmiş id listesi. */
  sub: string[];
  /** Marka anahtarları (attributeKey). */
  brands: string[];
  /** Başlık anahtarı → değer anahtarları; örn. {beden:["m","l"]}. */
  attrs: Record<string, string[]>;
  min: number | null;
  max: number | null;
  discounted: boolean;
}

export interface StorefrontFacetValue {
  key: string;
  label: string;
  count: number;
}

export interface StorefrontFacets {
  total: number;
  /** category_id → ürün sayısı (alt kategori seçimi hariç diğer filtrelerle). */
  categories: Record<string, number>;
  brands: StorefrontFacetValue[];
  attributes: Array<{ key: string; label: string; values: StorefrontFacetValue[] }>;
  price: { min: number; max: number } | null;
  discounted: number;
}

export const EMPTY_REFINE: StorefrontRefine = {
  sub: [],
  brands: [],
  attrs: {},
  min: null,
  max: null,
  discounted: false,
};

export function isRefineActive(refine: StorefrontRefine) {
  return (
    refine.sub.length > 0 ||
    refine.brands.length > 0 ||
    Object.values(refine.attrs).some((values) => values.length > 0) ||
    refine.min !== null ||
    refine.max !== null ||
    refine.discounted
  );
}

function parseNumber(value: string | null) {
  if (!value) return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** API isteği için: tek "refine" parametresinde JSON. */
export function serializeRefine(refine: StorefrontRefine) {
  return JSON.stringify({
    s: refine.sub,
    b: refine.brands,
    a: refine.attrs,
    n: refine.min,
    x: refine.max,
    d: refine.discounted ? 1 : 0,
  });
}

export function parseRefine(raw: string | null | undefined): StorefrontRefine {
  if (!raw) return EMPTY_REFINE;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    const strings = (input: unknown, limit: number) =>
      Array.isArray(input)
        ? input.filter((item): item is string => typeof item === "string" && item.length <= 80).slice(0, limit)
        : [];
    const attrs: Record<string, string[]> = {};
    if (value.a && typeof value.a === "object" && !Array.isArray(value.a)) {
      for (const [axis, values] of Object.entries(value.a as Record<string, unknown>).slice(0, 6)) {
        const list = strings(values, 50);
        if (list.length) attrs[axis.slice(0, 60)] = list;
      }
    }
    const num = (input: unknown) =>
      typeof input === "number" && Number.isFinite(input) && input >= 0 ? input : null;
    return {
      sub: strings(value.s, 500),
      brands: strings(value.b, 100),
      attrs,
      min: num(value.n),
      max: num(value.x),
      discounted: value.d === 1 || value.d === true,
    };
  } catch {
    return EMPTY_REFINE;
  }
}

// ---- Adres çubuğu: ?marka=jbl,anker&fiyat=100-500&indirim=1&alt=kulaklik&beden=m,l
const REFINE_URL_KEYS = ["alt", "marka", "fiyat", "indirim"];
const RESERVED_URL_KEYS = new Set<string>([
  ...REFINE_URL_KEYS,
  "kategori", "q", "urun", "kampanya", "bildirim", "tekrar", "preview", "sihirbaz", "tema", "ekUrun",
]);

/** Özellik başlığının adresteki adı (ayrılmış adlarla çakışırsa "oz-" öneki). */
function attributeUrlKey(axisKey: string) {
  return RESERVED_URL_KEYS.has(axisKey) ? `oz-${axisKey}` : axisKey;
}

/** Adresteki filtre anahtarlarını siler; özellik başlıkları yalnız bilinenler (axisKeys). */
export function clearRefineFromUrl(params: URLSearchParams, axisKeys: string[]) {
  for (const key of REFINE_URL_KEYS) params.delete(key);
  for (const axis of axisKeys) params.delete(attributeUrlKey(axis));
}

export function writeRefineToUrl(
  params: URLSearchParams,
  refine: StorefrontRefine,
  subSlugs: string[],
  previousAxisKeys: string[],
) {
  clearRefineFromUrl(params, [...previousAxisKeys, ...Object.keys(refine.attrs)]);
  if (subSlugs.length) params.set("alt", subSlugs.join(","));
  if (refine.brands.length) params.set("marka", refine.brands.join(","));
  if (refine.min !== null || refine.max !== null) params.set("fiyat", `${refine.min ?? ""}-${refine.max ?? ""}`);
  if (refine.discounted) params.set("indirim", "1");
  for (const [axis, values] of Object.entries(refine.attrs)) {
    if (values.length) params.set(attributeUrlKey(axis), values.join(","));
  }
}

/**
 * Adresten okur. Özellik başlıkları sayfa açılırken bilinmediğinden ayrılmamış
 * her anahtar aday sayılır; istemci, seçenekler gelince bilinmeyenleri atar.
 */
export function readRefineFromUrl(params: URLSearchParams) {
  const list = (value: string | null) =>
    value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
  const price = params.get("fiyat");
  let min: number | null = null;
  let max: number | null = null;
  if (price) {
    const [a, b] = price.split("-");
    min = parseNumber(a ?? null);
    max = parseNumber(b ?? null);
  }
  const attrs: Record<string, string[]> = {};
  for (const [key, value] of params.entries()) {
    if (RESERVED_URL_KEYS.has(key) || key.startsWith("utm_") || key === "fbclid" || key === "gclid") continue;
    const axis = key.startsWith("oz-") ? key.slice(3) : key;
    const values = list(value);
    if (values.length) attrs[axis] = values;
  }
  const refine: StorefrontRefine = {
    ...EMPTY_REFINE,
    brands: list(params.get("marka")),
    attrs,
    min,
    max,
    discounted: params.get("indirim") === "1",
  };
  return { subSlugs: list(params.get("alt")), refine };
}

// ---- Eşleşme

type Skip = "sub" | "brand" | "price" | "discounted" | `attr:${string}`;
type VariantKeys = Array<Record<string, { key: string; label: string; axisLabel: string }>>;

function variantAttributeKeys(product: StorefrontProduct): VariantKeys {
  return product.variants
    .filter((variant) => variant.is_available_for_sale !== false)
    .map((variant) => {
      const keyed: VariantKeys[number] = {};
      for (const [axis, value] of Object.entries(resolveVariantAttributes(variant))) {
        keyed[attributeKey(axis)] = { key: attributeKey(value), label: value, axisLabel: axis };
      }
      return keyed;
    });
}

export function matchesRefine(
  product: StorefrontProduct,
  refine: StorefrontRefine,
  skip?: Skip,
  variantKeys: VariantKeys = variantAttributeKeys(product),
) {
  if (skip !== "sub" && refine.sub.length && !refine.sub.includes(product.category_id)) return false;
  if (skip !== "brand" && refine.brands.length) {
    if (!product.brand || !refine.brands.includes(attributeKey(product.brand))) return false;
  }
  if (skip !== "price" && (refine.min !== null || refine.max !== null)) {
    const price = product.price;
    if (price === null || price <= 0) return false;
    if (refine.min !== null && price < refine.min) return false;
    if (refine.max !== null && price > refine.max) return false;
  }
  if (skip !== "discounted" && refine.discounted && !((product.discount_percentage ?? 0) > 0)) return false;

  const axes = Object.entries(refine.attrs).filter(
    ([axis, values]) => values.length && skip !== `attr:${axis}`,
  );
  if (axes.length) {
    // Aynı varyant tüm başlıkları sağlamalı: "Siyah + XL" seçilince siyahın
    // XL'i olmayan ürün listelenmez.
    const ok = variantKeys.some((keys) =>
      axes.every(([axis, values]) => keys[axis] && values.includes(keys[axis].key)),
    );
    if (!ok) return false;
  }
  return true;
}

export function computeStorefrontFacets(
  products: StorefrontProduct[],
  refine: StorefrontRefine,
): StorefrontFacets {
  const categories: Record<string, number> = {};
  const brands = new Map<string, StorefrontFacetValue>();
  const axes = new Map<string, { label: string; values: Map<string, StorefrontFacetValue> }>();
  let total = 0;
  let discounted = 0;
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  for (const product of products) {
    const keys = variantAttributeKeys(product);
    if (matchesRefine(product, refine, undefined, keys)) total += 1;
    if (matchesRefine(product, refine, "sub", keys)) {
      categories[product.category_id] = (categories[product.category_id] ?? 0) + 1;
    }
    if (product.brand?.trim() && matchesRefine(product, refine, "brand", keys)) {
      const key = attributeKey(product.brand);
      const entry = brands.get(key) ?? { key, label: product.brand.trim(), count: 0 };
      entry.count += 1;
      brands.set(key, entry);
    }
    if (product.price !== null && product.price > 0 && matchesRefine(product, refine, "price", keys)) {
      minPrice = Math.min(minPrice, product.price);
      maxPrice = Math.max(maxPrice, product.price);
    }
    if (
      (product.discount_percentage ?? 0) > 0 &&
      matchesRefine(product, refine, "discounted", keys)
    ) {
      discounted += 1;
    }

    // Her başlık için: o başlık hariç filtrelerle eşleşen üründe görülen değerler (ürün başına bir kez).
    const seenAxes = new Set(keys.flatMap((variant) => Object.keys(variant)));
    for (const axis of seenAxes) {
      if (!matchesRefine(product, refine, `attr:${axis}`, keys)) continue;
      const bucket = axes.get(axis) ?? { label: "", values: new Map<string, StorefrontFacetValue>() };
      const seenValues = new Set<string>();
      for (const variant of keys) {
        const value = variant[axis];
        if (!value || seenValues.has(value.key)) continue;
        seenValues.add(value.key);
        if (!bucket.label) bucket.label = value.axisLabel;
        const entry = bucket.values.get(value.key) ?? { key: value.key, label: value.label, count: 0 };
        entry.count += 1;
        bucket.values.set(value.key, entry);
      }
      axes.set(axis, bucket);
    }
  }

  return {
    total,
    categories,
    brands: [...brands.values()].sort((a, b) => a.label.localeCompare(b.label, "tr")),
    attributes: [...axes.entries()]
      // Tek değerli başlık süzmeye yaramaz; seçili değer varsa yine de kalsın.
      .filter(([axis, bucket]) => bucket.values.size > 1 || (refine.attrs[axis]?.length ?? 0) > 0)
      .map(([axis, bucket]) => ({
        key: axis,
        label: bucket.label,
        values: [...bucket.values.values()].sort(compareAttributeValues),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "tr")),
    price: Number.isFinite(minPrice) ? { min: minPrice, max: maxPrice } : null,
    discounted,
  };
}
