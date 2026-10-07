import Papa from "papaparse";
import { isCurrencyCode, normalizeCurrencyCode } from "@/lib/products/constants";
import type { ImportListPrice } from "@/lib/price-lists/import";
import {
  DEFAULT_PRICED_LIST_NAMES,
  parsePriceListCsvHeader,
} from "@/lib/price-lists/constants";
import { isBlankPriceCell, sanitizePrice } from "@/lib/products/parse-price-input";
import type { Product } from "@/lib/types";

export interface ParsedCsvResult {
  parsedHeaders: string[];
  rows: Array<{
    category_name: string;
    sku_code: string;
    product_name: string;
    /** Marka (0161); yalnız "Marka" sütunu olan dosyada anlamlı, boş → null. */
    brand?: string | null;
    image_url: Product["image_url"];
    currency: Product["currency"];
    prices?: ImportListPrice[];
    price_tier_1?: number;
    price_tier_2?: number;
    price_tier_3?: number;
    /** Boş/eksik stok hücresi: undefined → mevcut ürünün stok durumuna dokunulmaz. */
    is_in_stock?: Product["is_in_stock"];
    package_quantity: Product["package_quantity"];
    carton_quantity: Product["carton_quantity"];
  }>;
  errors: string[];
}

// Kullanıcıya gösterilen sütun adları (şablondaki Türkçe başlıklar).
export const PRODUCT_IMPORT_FIELD_LABELS: Record<string, string> = {
  category_name: "Kategori Adı",
  sku_code: "Model No",
  product_name: "Ürün Adı",
  brand: "Marka",
  currency: "Para Birimi",
  price_tier_1: "1. Liste Fiyatı",
  price_tier_2: "2. Liste Fiyatı",
  price_tier_3: "3. Liste Fiyatı",
  is_in_stock: "Stok Durumu",
  package_quantity: "Paket Adedi",
  carton_quantity: "Koli Adedi",
};

const REQUIRED_IMPORT_HEADERS = ["category_name", "sku_code", "product_name"] as const;

const OUT_OF_STOCK_VALUES = new Set([
  "0", "false", "yok", "hayır", "hayir", "no", "stokta yok", "stok yok", "tükendi", "tukendi",
  "kapalı", "kapali", "pasif", "x yok",
]);

/** Boş → undefined (dokunma); "yok/hayır/0/tükendi…" → false; diğer her şey → true.
 *  28 Eyl 2026: eskiden boş ve tanınmayan değer "stok yok" sayılıyordu. */
function normalizeStock(value: string | boolean | undefined) {
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[.!]+$/, "");
  if (!normalized) return undefined;
  return !OUT_OF_STOCK_VALUES.has(normalized);
}

function sanitizeOptionalPositiveInteger(
  value: string | number | undefined,
  rowNumber: number,
  fieldLabel: string,
  errors: string[],
) {
  // "1.000" (binlik nokta), "20 adet", "12,0" gibi yazımlar da kabul edilir.
  const normalized = String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s*(adet|ad\.?|pcs|pc)$/, "")
    .replace(/^(\d{1,3})(\.\d{3})+$/, (match) => match.replace(/\./g, ""))
    .replace(/,0+$/, "");

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
    // "greedy": yalnız boşluk/virgülden oluşan (biçimli ama boş) satırları da atla.
    skipEmptyLines: "greedy",
  });

  const errors: string[] = [];
  const parsedHeaders = (parsed.meta.fields ?? []).map((field) => field.trim());
  const missingHeaders = REQUIRED_IMPORT_HEADERS.filter(
    (header) => !parsedHeaders.includes(header),
  );

  if (missingHeaders.length) {
    errors.push(
      `Dosyada şu sütunlar bulunamadı: ${missingHeaders
        .map((header) => `"${PRODUCT_IMPORT_FIELD_LABELS[header] ?? header}"`)
        .join(", ")}. Lütfen şablondaki başlıkları kullanın.`,
    );
    return { parsedHeaders, rows: [], errors };
  }

  const rows = parsed.data
    .map((row, index) => {
      const category_name = row.category_name?.trim();
      const sku_code = row.sku_code?.trim();
      const product_name = row.product_name?.trim();
      const currency = normalizeCurrencyCode(row.currency);

      if (!category_name || !sku_code || !product_name) {
        const missing = [
          !category_name && "Kategori Adı",
          !sku_code && "Model No",
          !product_name && "Ürün Adı",
        ].filter(Boolean);
        errors.push(`Satır ${index + 2}: ${missing.join(", ")} boş olamaz.`);
        return null;
      }

      if (!isCurrencyCode(currency)) {
        errors.push(
          `Satır ${index + 2}: Para Birimi "${row.currency}" tanınmadı (TL, USD veya EUR yazın).`,
        );
        return null;
      }

      const package_quantity = sanitizeOptionalPositiveInteger(
        row.package_quantity,
        index + 2,
        "Paket Adedi",
        errors,
      );
      const carton_quantity = sanitizeOptionalPositiveInteger(
        row.carton_quantity,
        index + 2,
        "Koli Adedi",
        errors,
      );

      const dynamicPrices = parsedHeaders
        .map((header) => {
          const listName = parsePriceListCsvHeader(header);

          if (!listName) {
            return null;
          }

          // Boş hücre fiyat değildir; 0 yazıp mevcut fiyatı ezmesin.
          if (isBlankPriceCell(row[header])) {
            return null;
          }

          return {
            list_name: listName,
            price: sanitizePrice(row[header]),
          } satisfies ImportListPrice;
        })
        .filter((entry) => entry !== null);

      const legacyPrices = DEFAULT_PRICED_LIST_NAMES.flatMap((listName, index) => {
        const raw =
          index === 0 ? row.price_tier_1 : index === 1 ? row.price_tier_2 : row.price_tier_3;
        return isBlankPriceCell(raw) ? [] : [{ list_name: listName, price: sanitizePrice(raw) }];
      });

      return {
        category_name,
        sku_code,
        product_name,
        brand: row.brand?.trim() || null,
        image_url: row.image_url?.trim() || null,
        currency,
        // Şablon sütunları + "Fiyat: X" sütunları birlikte (biri diğerini silmesin).
        prices: [...legacyPrices, ...dynamicPrices],
        price_tier_1: sanitizePrice(row.price_tier_1),
        price_tier_2: sanitizePrice(row.price_tier_2),
        price_tier_3: sanitizePrice(row.price_tier_3),
        is_in_stock: normalizeStock(row.is_in_stock),
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
