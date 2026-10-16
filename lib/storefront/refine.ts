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

// ---- Eşleşme: sıkıştırılmış seçenek dizini
// Kapsamdaki (kategori/arama) her ürün için kategori, marka, fiyat, indirim
// ve varyant özellikleri sayı olarak tutulur. Sunucu dizini bir kez gönderir;
// filtre sayıları her tıklamada ağdan değil bu dizinden anında hesaplanır
// (17 Eki 2026: mobilde seçim "geç yansıyordu"). Sunucudaki ürün süzmesi de
// aynı eşleşmeyi kullanır.

export interface StorefrontFacetIndex {
  cats: string[];
  brands: Array<{ key: string; label: string }>;
  axes: Array<{ key: string; label: string }>;
  values: Array<{ axis: number; key: string; label: string }>;
  /** [kategori, marka (-1 yok), fiyat (0 yok), indirimde (0/1), varyantlar: [eksen, değer, eksen, değer…]] */
  rows: Array<[number, number, number, 0 | 1, number[][]]>;
}

export function buildFacetIndex(products: StorefrontProduct[]): StorefrontFacetIndex {
  const index: StorefrontFacetIndex = { cats: [], brands: [], axes: [], values: [], rows: [] };
  const catIdx = new Map<string, number>();
  const brandIdx = new Map<string, number>();
  const axisIdx = new Map<string, number>();
  const valueIdx = new Map<string, number>();
  const intern = <T,>(map: Map<string, number>, list: T[], key: string, make: () => T) => {
    let found = map.get(key);
    if (found === undefined) {
      found = list.length;
      list.push(make());
      map.set(key, found);
    }
    return found;
  };

  for (const product of products) {
    const c = intern(catIdx, index.cats, product.category_id, () => product.category_id);
    const brand = product.brand?.trim();
    const b = brand ? intern(brandIdx, index.brands, attributeKey(brand), () => ({ key: attributeKey(brand), label: brand })) : -1;
    const variants: number[][] = [];
    for (const variant of product.variants) {
      if (variant.is_available_for_sale === false) continue;
      const pairs: number[] = [];
      for (const [axis, value] of Object.entries(resolveVariantAttributes(variant))) {
        const axisKey = attributeKey(axis);
        const valueKey = attributeKey(value);
        if (!axisKey || !valueKey) continue;
        const a = intern(axisIdx, index.axes, axisKey, () => ({ key: axisKey, label: axis }));
        const v = intern(valueIdx, index.values, `${a}|${valueKey}`, () => ({ axis: a, key: valueKey, label: value }));
        pairs.push(a, v);
      }
      if (pairs.length) variants.push(pairs);
    }
    const price = product.price !== null && product.price > 0 ? product.price : 0;
    index.rows.push([c, b, price, (product.discount_percentage ?? 0) > 0 ? 1 : 0, variants]);
  }
  return index;
}

interface CompiledRefine {
  sub: Set<number> | null;
  brands: Set<number> | null;
  min: number | null;
  max: number | null;
  discounted: boolean;
  /** [eksen sırası, eksen anahtarı, uygun değer sıraları] */
  attrs: Array<[number, string, Set<number>]>;
}

function compileRefine(index: StorefrontFacetIndex, refine: StorefrontRefine): CompiledRefine {
  const pick = <T,>(list: T[], wanted: (item: T) => boolean) =>
    new Set(list.flatMap((item, i) => (wanted(item) ? [i] : [])));
  const attrs: CompiledRefine["attrs"] = [];
  for (const [axisKey, values] of Object.entries(refine.attrs)) {
    if (!values.length) continue;
    const a = index.axes.findIndex((axis) => axis.key === axisKey);
    // Bilinmeyen başlık seçiliyse hiçbir ürün eşleşmez (-1 hiçbir varyantta yok).
    attrs.push([a, axisKey, pick(index.values, (value) => value.axis === a && values.includes(value.key))]);
  }
  return {
    sub: refine.sub.length ? pick(index.cats, (id) => refine.sub.includes(id)) : null,
    brands: refine.brands.length ? pick(index.brands, (brand) => refine.brands.includes(brand.key)) : null,
    min: refine.min,
    max: refine.max,
    discounted: refine.discounted,
    attrs,
  };
}

type Skip = "sub" | "brand" | "price" | "discounted" | number;

function matchRow(row: StorefrontFacetIndex["rows"][number], c: CompiledRefine, skip?: Skip) {
  if (skip !== "sub" && c.sub && !c.sub.has(row[0])) return false;
  if (skip !== "brand" && c.brands && !c.brands.has(row[1])) return false;
  if (skip !== "price" && (c.min !== null || c.max !== null)) {
    if (!row[2]) return false;
    if (c.min !== null && row[2] < c.min) return false;
    if (c.max !== null && row[2] > c.max) return false;
  }
  if (skip !== "discounted" && c.discounted && !row[3]) return false;
  const axes = c.attrs.filter(([a]) => a !== skip);
  if (axes.length) {
    // Aynı varyant tüm başlıkları sağlamalı: "Siyah + XL" seçilince siyahın
    // XL'i olmayan ürün listelenmez.
    return row[4].some((pairs) =>
      axes.every(([a, , allowed]) => {
        for (let i = 0; i < pairs.length; i += 2) {
          if (pairs[i] === a && allowed.has(pairs[i + 1])) return true;
        }
        return false;
      }),
    );
  }
  return true;
}

/** Sunucu: dizindeki her satırın (ürünün) filtreye uyup uymadığı. */
export function matchFacetIndex(index: StorefrontFacetIndex, refine: StorefrontRefine) {
  const compiled = compileRefine(index, refine);
  return index.rows.map((row) => matchRow(row, compiled));
}

export function computeStorefrontFacets(index: StorefrontFacetIndex, refine: StorefrontRefine): StorefrontFacets {
  const c = compileRefine(index, refine);
  const categories: Record<string, number> = {};
  const brandCounts = new Map<number, number>();
  const valueCounts = new Map<number, number>();
  const axesSeen = new Set<number>();
  let total = 0;
  let discounted = 0;
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  for (const row of index.rows) {
    if (matchRow(row, c)) total += 1;
    if (matchRow(row, c, "sub")) categories[index.cats[row[0]]] = (categories[index.cats[row[0]]] ?? 0) + 1;
    if (row[1] >= 0 && matchRow(row, c, "brand")) brandCounts.set(row[1], (brandCounts.get(row[1]) ?? 0) + 1);
    if (row[2] && matchRow(row, c, "price")) {
      minPrice = Math.min(minPrice, row[2]);
      maxPrice = Math.max(maxPrice, row[2]);
    }
    if (row[3] && matchRow(row, c, "discounted")) discounted += 1;

    // Her başlık için: o başlık hariç filtrelerle eşleşen üründe görülen değerler (ürün başına bir kez).
    const rowAxes = new Set<number>();
    for (const pairs of row[4]) for (let i = 0; i < pairs.length; i += 2) rowAxes.add(pairs[i]);
    for (const a of rowAxes) {
      axesSeen.add(a);
      if (!matchRow(row, c, a)) continue;
      const seen = new Set<number>();
      for (const pairs of row[4]) {
        for (let i = 0; i < pairs.length; i += 2) {
          if (pairs[i] !== a || seen.has(pairs[i + 1])) continue;
          seen.add(pairs[i + 1]);
          valueCounts.set(pairs[i + 1], (valueCounts.get(pairs[i + 1]) ?? 0) + 1);
        }
      }
    }
  }

  const attributes = [...axesSeen]
    .map((a) => {
      const axis = index.axes[a];
      const values = index.values
        .map((value, i) => ({ value, i }))
        .filter(({ value }) => value.axis === a)
        .map(({ value, i }) => ({ key: value.key, label: value.label, count: valueCounts.get(i) ?? 0 }))
        .filter((value) => value.count > 0 || refine.attrs[axis.key]?.includes(value.key))
        .sort(compareAttributeValues);
      return { key: axis.key, label: axis.label, values };
    })
    // Tek değerli başlık süzmeye yaramaz; seçili değer varsa yine de kalsın.
    .filter((axis) => axis.values.length > 1 || (refine.attrs[axis.key]?.length ?? 0) > 0)
    .sort((a, b) => a.label.localeCompare(b.label, "tr"));

  return {
    total,
    categories,
    brands: index.brands
      .map((brand, i) => ({ key: brand.key, label: brand.label, count: brandCounts.get(i) ?? 0 }))
      .filter((brand) => brand.count > 0 || refine.brands.includes(brand.key))
      .sort((a, b) => a.label.localeCompare(b.label, "tr")),
    attributes,
    price: Number.isFinite(minPrice) ? { min: minPrice, max: maxPrice } : null,
    discounted,
  };
}
