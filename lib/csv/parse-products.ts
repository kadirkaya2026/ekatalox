import Papa from "papaparse";
import {
  isCurrencyCode,
  normalizeCurrencyCode,
  productCsvHeaders,
} from "@/lib/products/constants";
import type { Product } from "@/lib/types";

export interface ParsedCsvResult {
  rows: Array<
    Pick<
      Product,
      | "sku_code"
      | "product_name"
      | "image_url"
      | "currency"
      | "price_tier_1"
      | "price_tier_2"
      | "price_tier_3"
      | "is_in_stock"
    >
  >;
  errors: string[];
}

function normalizeBoolean(value: string | boolean | undefined) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  return ["1", "true", "var", "evet", "yes", "stock", "stokta"].includes(normalized);
}

function normalizeNumber(value: string | number | undefined) {
  const normalized = String(value ?? "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  const result = Number(normalized);
  return Number.isFinite(result) ? result : 0;
}

export function parseProductsCsv(csvText: string): ParsedCsvResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const errors: string[] = [];
  const parsedHeaders = (parsed.meta.fields ?? []).map((field) => field.trim());
  const missingHeaders = productCsvHeaders.filter((header) => !parsedHeaders.includes(header));

  if (missingHeaders.length) {
    errors.push(`Eksik CSV başlıkları: ${missingHeaders.join(", ")}`);
  }

  const rows = parsed.data
    .map((row, index) => {
      const sku_code = row.sku_code?.trim();
      const product_name = row.product_name?.trim();
      const currency = normalizeCurrencyCode(row.currency);

      if (!sku_code || !product_name) {
        errors.push(`Satır ${index + 2}: sku_code ve product_name zorunludur.`);
        return null;
      }

      if (!isCurrencyCode(currency)) {
        errors.push(`Satır ${index + 2}: currency alanı TRY, USD veya EUR olmalıdır.`);
        return null;
      }

      return {
        sku_code,
        product_name,
        image_url: row.image_url?.trim() || null,
        currency,
        price_tier_1: normalizeNumber(row.price_tier_1),
        price_tier_2: normalizeNumber(row.price_tier_2),
        price_tier_3: normalizeNumber(row.price_tier_3),
        is_in_stock: normalizeBoolean(row.is_in_stock),
      };
    })
    .filter(Boolean) as ParsedCsvResult["rows"];

  if (parsed.errors.length) {
    parsed.errors.forEach((error) => {
      errors.push(error.message);
    });
  }

  return { rows, errors };
}