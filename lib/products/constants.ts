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

export function normalizeCurrencyCode(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
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