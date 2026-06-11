import Papa from "papaparse";
import {
  isCurrencyCode,
  normalizeCurrencyCode,
  requiredProductCsvHeaders,
} from "@/lib/products/constants";
import type { ImportListPrice } from "@/lib/price-lists/import";
import {
  DEFAULT_PRICED_LIST_NAMES,
  parsePriceListCsvHeader,
} from "@/lib/price-lists/constants";
import { sanitizePrice } from "@/lib/products/parse-price-input";
import type { Product } from "@/lib/types";

export interface ParsedCsvResult {
  parsedHeaders: string[];
  rows: Array<{
    category_name: string;
    sku_code: string;
    product_name: string;
    image_url: Product["image_url"];
    currency: Product["currency"];
    prices?: ImportListPrice[];
    price_tier_1?: number;
    price_tier_2?: number;
    price_tier_3?: number;
    is_in_stock: Product["is_in_stock"];
    package_quantity: Product["package_quantity"];
    carton_quantity: Product["carton_quantity"];
  }>;
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

function sanitizeOptionalPositiveInteger(
  value: string | number | undefined,
  rowNumber: number,
  fieldLabel: string,
  errors: string[],
) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsedValue = Number(normalized);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    errors.push(`Satır ${rowNumber}: ${fieldLabel} pozitif tam sayı olmalıdır.`);
    return null;
  }

  return parsedValue;
}

export function parseProductsCsv(csvText: string): ParsedCsvResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const errors: string[] = [];
  const parsedHeaders = (parsed.meta.fields ?? []).map((field) => field.trim());
  const missingHeaders = requiredProductCsvHeaders.filter(
    (header) => !parsedHeaders.includes(header),
  );

  if (missingHeaders.length) {
    errors.push(`Eksik CSV başlıkları: ${missingHeaders.join(", ")}`);
  }

  const rows = parsed.data
    .map((row, index) => {
      const category_name = row.category_name?.trim();
      const sku_code = row.sku_code?.trim();
      const product_name = row.product_name?.trim();
      const currency = normalizeCurrencyCode(row.currency);

      if (!category_name || !sku_code || !product_name) {
        errors.push(
          `Satır ${index + 2}: category_name, sku_code ve product_name zorunludur.`,
        );
        return null;
      }

      if (!isCurrencyCode(currency)) {
        errors.push(`Satır ${index + 2}: currency alanı TRY, USD veya EUR olmalıdır.`);
        return null;
      }

      const package_quantity = sanitizeOptionalPositiveInteger(
        row.package_quantity,
        index + 2,
        "package_quantity",
        errors,
      );
      const carton_quantity = sanitizeOptionalPositiveInteger(
        row.carton_quantity,
        index + 2,
        "carton_quantity",
        errors,
      );

      const dynamicPrices = parsedHeaders
        .map((header) => {
          const listName = parsePriceListCsvHeader(header);

          if (!listName) {
            return null;
          }

          return {
            list_name: listName,
            price: sanitizePrice(row[header]),
          } satisfies ImportListPrice;
        })
        .filter((entry): entry is ImportListPrice => Boolean(entry));

      const legacyPrices = DEFAULT_PRICED_LIST_NAMES.map((listName, index) => ({
        list_name: listName,
        price: sanitizePrice(
          index === 0 ? row.price_tier_1 : index === 1 ? row.price_tier_2 : row.price_tier_3,
        ),
      }));

      return {
        category_name,
        sku_code,
        product_name,
        image_url: row.image_url?.trim() || null,
        currency,
        prices: dynamicPrices.length ? dynamicPrices : legacyPrices,
        price_tier_1: sanitizePrice(row.price_tier_1),
        price_tier_2: sanitizePrice(row.price_tier_2),
        price_tier_3: sanitizePrice(row.price_tier_3),
        is_in_stock: normalizeBoolean(row.is_in_stock),
        package_quantity,
        carton_quantity,
      };
    })
    .filter(Boolean) as ParsedCsvResult["rows"];

  if (parsed.errors.length) {
    parsed.errors.forEach((error) => {
      errors.push(error.message);
    });
  }

  return { parsedHeaders, rows, errors };
}