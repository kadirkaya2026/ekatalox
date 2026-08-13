import { sanitizePrice } from "@/lib/products/parse-price-input";

export type StockImportFieldKey = "barcode" | "product_name" | "price" | "ignore";

export interface StockImportRawTable {
  headers: string[];
  rows: string[][];
}

export interface ColumnMapping {
  sourceHeader: string;
  field: StockImportFieldKey;
}

export interface StockImportSourceRow {
  rowNumber: number;
  barcode: string | null;
  productName: string | null;
  price: number | null;
}

// Barkod okuyucu/market otomasyon yazılımları vendor'a göre farklı başlıklar
// kullanabiliyor — bu sözlük sadece dropdown'ları ön-doldurmak için, kullanıcı
// her zaman elle değiştirebilir (bkz. stock-import-panel.tsx eşleştirme adımı).
// Gerçek bir POS stok raporunda ("Stok Cinsi", "Fiyat"/"Fiyat2".."Fiyat5" gibi
// birden fazla fiyat sütunu) test edilerek eklendi.
const STOCK_IMPORT_FIELD_ALIASES: Record<Exclude<StockImportFieldKey, "ignore">, string[]> = {
  barcode: ["barkod", "barcode", "stok kodu", "sku", "model no", "ürün kodu", "urun kodu", "product code", "ean", "code"],
  product_name: [
    "ürün adı",
    "urun adi",
    "ürün",
    "urun",
    "product name",
    "name",
    "açıklama",
    "aciklama",
    "description",
    "stok adı",
    "stok adi",
    "stok cinsi",
  ],
  price: ["fiyat", "satış fiyatı", "satis fiyati", "price", "unit price", "fiyatı", "fiyati", "birim fiyat"],
};

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

// Sadece TAM eşleşme kullanılıyor (substring/includes değil) — aksi halde
// "Fiyat" alias'ı "Fiyat2"/"Fiyat3" gibi numaralı varyantları da yanlışlıkla
// eşleştirip birden fazla sütunu aynı anda "Fiyat" olarak öneriyordu.
export function guessFieldForHeader(header: string): StockImportFieldKey {
  const normalized = normalizeHeader(header);

  for (const [field, aliases] of Object.entries(STOCK_IMPORT_FIELD_ALIASES) as Array<
    [Exclude<StockImportFieldKey, "ignore">, string[]]
  >) {
    if (aliases.includes(normalized)) {
      return field;
    }
  }

  return "ignore";
}

// Excel'de büyük barkod sayıları (ör. EAN-13) "General" sayı biçimiyle
// bilimsel gösterime yuvarlanabiliyor (8.68183E+12) — bulk-operations-panel.tsx
// bunu ham hücreyi header:1 ile alıp sayısal hücreleri String()'e çevirerek
// çözüyor; barkod hassasiyeti için burada da aynı düzeltme uygulanıyor.
export async function parseStockImportSpreadsheet(file: File): Promise<StockImportRawTable> {
  const isCsv = file.name.toLowerCase().endsWith(".csv");

  if (isCsv) {
    const Papa = (await import("papaparse")).default;
    const text = await file.text();
    const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
    const [headerRow, ...dataRows] = result.data;

    if (!headerRow?.length) {
      return { headers: [], rows: [] };
    }

    return {
      headers: headerRow.map((h) => String(h ?? "").trim()),
      rows: dataRows.map((row) => row.map((cell) => String(cell ?? "").trim())),
    };
  }

  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  });

  if (!rawRows.length) {
    return { headers: [], rows: [] };
  }

  const headers = (rawRows[0] as unknown[]).map((h) => String(h ?? "").trim());
  const rows = rawRows
    .slice(1)
    .filter((row) => (row as unknown[]).some((cell) => String(cell ?? "").trim().length > 0))
    .map((row) =>
      (row as unknown[]).map((cell) => (typeof cell === "number" ? String(cell) : String(cell ?? "").trim())),
    );

  return { headers, rows };
}

export function mapRawRowsToSourceRows(
  raw: StockImportRawTable,
  mapping: ColumnMapping[],
): StockImportSourceRow[] {
  const fieldByHeader = new Map(mapping.map((entry) => [entry.sourceHeader, entry.field]));
  const indexForField = (field: StockImportFieldKey) =>
    raw.headers.findIndex((header) => fieldByHeader.get(header) === field);

  const barcodeIndex = indexForField("barcode");
  const productNameIndex = indexForField("product_name");
  const priceIndex = indexForField("price");

  return raw.rows.map((row, index) => {
    const rawBarcode = barcodeIndex >= 0 ? row[barcodeIndex]?.trim() : "";
    const rawProductName = productNameIndex >= 0 ? row[productNameIndex]?.trim() : "";
    const rawPrice = priceIndex >= 0 ? row[priceIndex]?.trim() : "";

    return {
      rowNumber: index + 1,
      barcode: rawBarcode ? rawBarcode : null,
      productName: rawProductName ? rawProductName : null,
      price: rawPrice ? sanitizePrice(rawPrice) : null,
    };
  });
}
