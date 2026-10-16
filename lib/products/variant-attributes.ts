import { slugify } from "@/lib/storefront/retail-config";

// Varyant özellikleri (0176, 16 Eki 2026): vitrin filtresinde "Beden",
// "Renk" gibi başlıklar. Panelde başlık seçilmiş varyantta attributes
// doludur; eski varyantlarda (yalnız model_name) beden/renk adından tahmin
// edilir. Tahmin edilemeyen adlar (model kodu vb.) filtreye girmez.

export type VariantAttributes = Record<string, string>;

export const VARIANT_AXIS_SUGGESTIONS = ["Beden", "Renk", "Numara"] as const;
export const MAX_VARIANT_AXES = 2;

const SIZE_TOKENS = new Set([
  "xxs", "xs", "s", "m", "l", "xl", "xxl", "xxxl", "2xl", "3xl", "4xl", "5xl", "6xl", "std", "standart",
]);
const SIZE_ORDER = ["xxs", "xs", "s", "m", "l", "xl", "xxl", "2xl", "xxxl", "3xl", "4xl", "5xl", "6xl", "std", "standart"];

const COLOR_WORDS = new Set([
  "siyah", "beyaz", "kirmizi", "mavi", "lacivert", "yesil", "sari", "turuncu", "mor", "pembe", "gri", "kahverengi",
  "kahve", "bej", "ekru", "krem", "bordo", "haki", "fume", "antrasit", "gold", "altin", "gumus", "silver", "rose",
  "lila", "turkuaz", "mint", "vizon", "taba", "hardal", "indigo", "petrol", "fusya", "somon", "murdum", "camel",
  "tas", "kiremit", "nar", "zumrut", "pudra", "leylak", "safran", "black", "white", "red", "blue", "green",
  "yellow", "orange", "purple", "pink", "grey", "gray", "brown", "navy", "beige", "cream", "transparan", "seffaf",
  "metalik", "rengarenk", "renkli", "desenli",
]);
const COLOR_MODIFIERS = new Set(["acik", "koyu", "mat", "parlak", "neon", "pastel", "metalik", "light", "dark"]);

/** Filtre anahtarı: büyük/küçük harf ve Türkçe karakter farkı birleşir. */
export function attributeKey(value: string) {
  return slugify(value.replace(/\s+/g, " ").trim());
}

function titleCase(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1))
    .join(" ");
}

// "XS/S", "S-M", "LXL", "ML" gibi ara bedenler tek beden değeri sayılır.
function compoundSize(raw: string): string | null {
  const compact = raw.toLowerCase().replace(/\s+/g, "");
  const parts = compact.split(/[-/]/).filter(Boolean);
  if (parts.length === 2 && parts.every((part) => SIZE_TOKENS.has(part))) {
    return parts.map((part) => part.toUpperCase()).join("/");
  }
  if (/^[a-z0-9]{2,5}$/.test(compact) && !SIZE_TOKENS.has(compact)) {
    for (let i = 1; i < compact.length; i += 1) {
      const a = compact.slice(0, i);
      const b = compact.slice(i);
      if (SIZE_TOKENS.has(a) && SIZE_TOKENS.has(b) && a !== "std" && b !== "std") {
        return `${a.toUpperCase()}/${b.toUpperCase()}`;
      }
    }
  }
  return null;
}

function guessPart(part: string): [string, string] | null {
  const clean = part.trim().replace(/\s+/g, " ");
  if (!clean) return null;
  const words = clean.split(" ");
  const keys = words.map((word) => attributeKey(word));

  // "M", "XL", "M Beden", "Beden L", "38 Beden"
  const withoutLabel = keys.filter((k) => k !== "beden" && k !== "size");
  if (withoutLabel.length === 1) {
    const token = withoutLabel[0];
    if (SIZE_TOKENS.has(token)) return ["Beden", token === "std" || token === "standart" ? "Standart" : token.toUpperCase()];
    if (/^\d{2}$/.test(token) && keys.length > 1 && Number(token) >= 26 && Number(token) <= 60) {
      return ["Beden", token];
    }
  }
  // Tek başına 24–60 arası sayı (28 bel, 38 beden …) giyim bedeni sayılır.
  if (keys.length === 1 && /^\d{2}$/.test(keys[0])) {
    const n = Number(keys[0]);
    if (n >= 24 && n <= 60) return ["Beden", keys[0]];
  }
  if (words.length === 1) {
    const compound = compoundSize(clean);
    if (compound) return ["Beden", compound];
  }

  // "Siyah", "Koyu Mavi", "Açık Gri" (en çok 3 kelime, hepsi renk/ton kelimesi)
  if (
    words.length <= 3 &&
    keys.some((k) => COLOR_WORDS.has(k)) &&
    keys.every((k) => COLOR_WORDS.has(k) || COLOR_MODIFIERS.has(k))
  ) {
    return ["Renk", titleCase(clean)];
  }
  return null;
}

/** Varyant adından tahmin: "Siyah / M" → {Renk:"Siyah", Beden:"M"}. */
export function guessVariantAttributes(modelName: string): VariantAttributes {
  const whole = modelName.trim();
  const compound = compoundSize(whole);
  if (compound && !/\s/.test(whole.replace(/\s*([-/])\s*/g, "$1"))) return { Beden: compound };
  const parts = modelName.split(/\s*[/|,]\s*|\s+-\s+/).filter(Boolean);
  if (!parts.length || parts.length > MAX_VARIANT_AXES) return {};
  const result: VariantAttributes = {};
  for (const part of parts) {
    const guess = guessPart(part);
    // Bir parça bile tanınmazsa ad bir model kodu vb. olabilir: tahmin yok.
    if (!guess) return {};
    // "Beyaz/Siyah" gibi iki renkli ürün tek renk değeri olur.
    if (result[guess[0]]) {
      if (guess[0] !== "Renk") return {};
      result.Renk = `${result.Renk}/${guess[1]}`;
      continue;
    }
    result[guess[0]] = guess[1];
  }
  return result;
}

export function cleanVariantAttributes(raw: unknown): VariantAttributes {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result: VariantAttributes = {};
  for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== "string") continue;
    const axis = name.trim().replace(/\s+/g, " ").slice(0, 40);
    const text = value.trim().replace(/\s+/g, " ").slice(0, 60);
    if (axis && text && Object.keys(result).length < MAX_VARIANT_AXES) result[axis] = text;
  }
  return result;
}

/** Kayıtlı özellik varsa o, yoksa addan tahmin. */
export function resolveVariantAttributes(variant: {
  model_name: string;
  attributes?: Record<string, string> | null;
}): VariantAttributes {
  const stored = cleanVariantAttributes(variant.attributes);
  return Object.keys(stored).length ? stored : guessVariantAttributes(variant.model_name);
}

/** Filtrede değer sırası: bedenler doğal sırayla, sayılar küçükten büyüğe, gerisi alfabe. */
function sizeRank(key: string) {
  const exact = SIZE_ORDER.indexOf(key);
  if (exact !== -1) return exact;
  // Ara beden (s-m, l-xl) ilk bedenin hemen arkasına.
  const first = SIZE_ORDER.indexOf(key.split("-")[0]);
  return first !== -1 && key.includes("-") ? first + 0.5 : -1;
}

export function compareAttributeValues(a: { key: string; label: string }, b: { key: string; label: string }) {
  const sa = sizeRank(a.key);
  const sb = sizeRank(b.key);
  if (sa !== -1 || sb !== -1) {
    if (sa === -1) return 1;
    if (sb === -1) return -1;
    return sa - sb;
  }
  const na = Number(a.key);
  const nb = Number(b.key);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return a.label.localeCompare(b.label, "tr");
}
