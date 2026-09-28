export const supportedCurrencyCodes = ["TRY", "USD", "EUR"] as const;

export type CurrencyCode = (typeof supportedCurrencyCodes)[number];

export const defaultCurrencyCode: CurrencyCode = "TRY";

export const productCsvHeaders = [
  "category_name",
  "sku_code",
  "product_name",
  "image_url",
  "currency",
  "price_tier_1",
  "price_tier_2",
  "price_tier_3",
  "is_in_stock",
  "package_quantity",
  "carton_quantity",
] as const;

export const requiredProductCsvHeaders = [
  "category_name",
  "sku_code",
  "product_name",
  "image_url",
  "currency",
  "price_tier_1",
  "price_tier_2",
  "price_tier_3",
  "is_in_stock",
] as const;

// Excel'de yazılan yaygın biçimler (28 Eyl 2026 denetimi): "TL", "₺", "$",
// "€", "Euro"… boş hücre TRY sayılır; bilinmeyen değer olduğu gibi döner.
const CURRENCY_ALIASES: Record<string, string> = {
  TL: "TRY", "₺": "TRY", TRL: "TRY", YTL: "TRY", "TÜRK LİRASI": "TRY", "LİRA": "TRY",
  $: "USD", DOLAR: "USD", DOLLAR: "USD", "US$": "USD",
  "€": "EUR", EURO: "EUR", AVRO: "EUR",
};

export function normalizeCurrencyCode(value: unknown) {
  const code = String(value ?? "")
    .trim()
    .toLocaleUpperCase("tr-TR");
  if (!code) return "TRY";
  return CURRENCY_ALIASES[code] ?? code;
}

export function isCurrencyCode(value: string): value is CurrencyCode {
  return supportedCurrencyCodes.includes(value as CurrencyCode);
}

export const PRODUCT_MODEL_NO_LABEL = "Model No";

export function formatProductModelNo(skuCode: string | null | undefined) {
  return skuCode?.trim()
    ? `${PRODUCT_MODEL_NO_LABEL}: ${skuCode.trim()}`
    : `${PRODUCT_MODEL_NO_LABEL} bilgisi yok`;
}

// Ürünler sayfasındaki satış durumu filtresi. is_in_stock=false olan ürün
// vitrinde sipariş edilemez ("Stok kapalı" rozeti) — tenant admin bu ürünleri
// ayıklayıp toplu işlem yapabilsin diye filtreleniyor.
export const productStockFilters = ["all", "in_stock", "out_of_stock"] as const;

export type ProductStockFilter = (typeof productStockFilters)[number];

export function parseProductStockFilter(value: unknown): ProductStockFilter {
  return productStockFilters.includes(value as ProductStockFilter)
    ? (value as ProductStockFilter)
    : "all";
}

// Katalog kalitesi süzgeci (Genel Bakış "Görselsiz / Fiyatsız ürün"
// bağlantıları): products.has_image / has_price kolonları (0129).
export const productQualityFilters = ["all", "no_image", "no_price"] as const;

export type ProductQualityFilter = (typeof productQualityFilters)[number];

export function parseProductQualityFilter(value: unknown): ProductQualityFilter {
  return productQualityFilters.includes(value as ProductQualityFilter)
    ? (value as ProductQualityFilter)
    : "all";
}
