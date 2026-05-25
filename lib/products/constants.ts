export const supportedCurrencyCodes = ["TRY", "USD", "EUR"] as const;

export type CurrencyCode = (typeof supportedCurrencyCodes)[number];

export const defaultCurrencyCode: CurrencyCode = "TRY";

export const productCsvHeaders = [
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