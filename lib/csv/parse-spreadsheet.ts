import Papa from "papaparse";
import type { WorkBook } from "xlsx";
import { parseProductsCsv, type ParsedCsvResult } from "@/lib/csv/parse-products";

// Excel/CSV → ParsedCsvResult (panel Toplu İşlemler). 28 Eyl 2026 denetimiyle
// panelden ayrıldı ki gerçek dosyalarla test edilebilsin.

// Türkçe kolon başlıkları → teknik alan adı eşlemesi
export const TURKISH_COLUMN_MAP: Record<string, string> = {
  "Kategori Adı": "category_name",
  "Model No": "sku_code",
  "Stok Kodu (SKU)": "sku_code",
  "Ürün Adı": "product_name",
  "Marka": "brand",
  "Para Birimi": "currency",
  "1. Liste Fiyatı": "price_tier_1",
  "2. Liste Fiyatı": "price_tier_2",
  "3. Liste Fiyatı": "price_tier_3",
  "Stok Durumu": "is_in_stock",
  "Paket Adedi": "package_quantity",
  "Koli Adedi": "carton_quantity",
};

// Başlık eşleştirme anahtarı: büyük/küçük harf, Türkçe karakter, boşluk ve
// noktalama farkı önemsiz ("1.liste fiyatı" = "1. Liste Fiyatı", macOS NFD dahil).
function headerKey(header: string) {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]/g, "");
}

// Kullanıcıların gerçekte yazdığı başlıklar (28 Eyl 2026 denetimi).
const HEADER_ALIASES: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  const add = (field: string, names: string[]) => names.forEach((name) => (map[headerKey(name)] = field));
  Object.entries(TURKISH_COLUMN_MAP).forEach(([name, field]) => add(field, [name, field]));
  add("category_name", ["Kategori", "Kategori İsmi", "Ürün Kategorisi", "Grup"]);
  add("sku_code", ["Model Kodu", "Stok Kodu", "Ürün Kodu", "Kod", "SKU", "Model", "Stok No"]);
  add("product_name", ["Ürün", "Ürün İsmi", "Ürün Açıklaması", "Ad", "İsim"]);
  add("brand", ["Marka", "Brand", "Marka Adı"]);
  add("currency", ["Döviz", "Döviz Cinsi", "Para"]);
  add("price_tier_1", ["Fiyat", "Satış Fiyatı", "Liste Fiyatı", "1. Liste", "1.Liste", "1. Fiyat", "Fiyat 1"]);
  add("price_tier_2", ["2. Liste", "2.Liste", "2. Fiyat", "Fiyat 2"]);
  add("price_tier_3", ["3. Liste", "3.Liste", "3. Fiyat", "Fiyat 3"]);
  add("is_in_stock", ["Stok", "Stok Var mı", "Stokta"]);
  add("package_quantity", ["Paket", "Paket İçi", "Paket İçi Adet"]);
  add("carton_quantity", ["Koli", "Koli İçi", "Koli İçi Adet"]);
  add("image_url", ["Görsel", "Görsel URL", "Resim", "Resim URL", "Fotoğraf"]);
  return map;
})();

const REQUIRED_FIELDS = ["category_name", "sku_code", "product_name"];

function mapHeaderRow(row: unknown[]) {
  const used = new Set<string>();
  return row.map((cell) => {
    const original = String(cell ?? "").trim();
    // "Fiyat: VIP" gibi dinamik liste sütunları olduğu gibi kalır.
    if (/^fiyat\s*:/i.test(original)) return original;
    // "İndirimli Fiyat: VIP" (liste indirimli fiyatı) da olduğu gibi kalır.
    if (/^indirimli\s+fiyat\s*:/.test(original.normalize("NFC").toLocaleLowerCase("tr-TR").replace(/ı/g, "i"))) return original;
    const field = HEADER_ALIASES[headerKey(original)];
    // Aynı alana ikinci sütun (ör. hem "Model No" hem "Stok Kodu") eşlenmez.
    if (field && !used.has(field)) {
      used.add(field);
      return field;
    }
    return original;
  });
}

function countRequired(headers: string[]) {
  return REQUIRED_FIELDS.filter((field) => headers.includes(field)).length;
}

export async function parseSpreadsheetFile(file: { name: string; arrayBuffer(): Promise<ArrayBuffer> }): Promise<ParsedCsvResult> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();

  // CSV'yi SheetJS'e sayı olarak yorumlatma: "1.250,50" ve "00123" metin kalsın.
  // Türkçe Excel "CSV" çıktısı Windows-1254 olabilir.
  let workbook: WorkBook;
  if (file.name.toLowerCase().endsWith(".csv")) {
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      text = new TextDecoder("windows-1254").decode(buffer);
    }
    workbook = XLSX.read(text.replace(/^\uFEFF/, ""), { type: "string", raw: true });
  } else {
    workbook = XLSX.read(buffer, { type: "array" });
  }

  // Başlık satırını bul: görünür sayfalarda, ilk 10 satırda zorunlu alanları
  // en çok içeren satır (üstte başlık/boşluk satırı olabilir).
  const hiddenSheets = new Set(
    (workbook.Workbook?.Sheets ?? [])
      .filter((sheetInfo) => sheetInfo.Hidden)
      .map((sheetInfo) => sheetInfo.name),
  );
  let best: { rows: unknown[][]; formatted: unknown[][]; headerIndex: number; headers: string[] } | null = null;
  for (const sheetName of workbook.SheetNames) {
    if (hiddenSheets.has(sheetName)) continue;
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: true });
    for (let index = 0; index < Math.min(rows.length, 10); index += 1) {
      const headers = mapHeaderRow(rows[index] ?? []);
      if (!best || countRequired(headers) > countRequired(best.headers)) {
        const formatted = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
        best = { rows, formatted, headerIndex: index, headers };
      }
      if (best && countRequired(best.headers) === REQUIRED_FIELDS.length) break;
    }
    if (best && countRequired(best.headers) === REQUIRED_FIELDS.length) break;
  }

  if (!best || !best.rows.length) {
    return { parsedHeaders: [], rows: [], errors: ["Dosya boş."] };
  }

  const englishHeaders = [...best.headers];
  const skuColumn = englishHeaders.indexOf("sku_code");

  // image_url şablonda yok; parse fonksiyonu için boş sütun olarak ekle
  const hasImageUrl = englishHeaders.includes("image_url");
  if (!hasImageUrl) englishHeaders.push("image_url");

  // Sayı hücreleri: tam sayılar olduğu gibi (13 haneli barkod bilimsel
  // gösterime düşmesin); ondalıklılar 6 haneyle (14.455 → "14.455000", binlik
  // sanılıp 14455 olmasın). Model No'da Excel biçimli baştaki sıfırlar korunur.
  const dataRows = best.rows.slice(best.headerIndex + 1).map((row, rowOffset) => {
    const formattedRow = best!.formatted[best!.headerIndex + 1 + rowOffset] ?? [];
    const stringified = (row as unknown[]).map((cell, column) => {
      if (typeof cell !== "number") return cell;
      if (column === skuColumn) {
        const shown = String(formattedRow[column] ?? "").trim();
        if (/^0\d+$/.test(shown)) return shown;
      }
      return Number.isInteger(cell) ? String(cell) : cell.toFixed(6);
    });
    return hasImageUrl ? stringified : [...stringified, ""];
  });

  const csvString = Papa.unparse([englishHeaders, ...dataRows]);
  return parseProductsCsv(csvString);
}

