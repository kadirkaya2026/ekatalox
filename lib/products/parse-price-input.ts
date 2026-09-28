/**
 * Akıllı fiyat temizleyici.
 *
 * Desteklenen formatlar (örnekler):
 *   "1,20"        → 1.20   (Türkçe ondalık virgülü)
 *   "1.20"        → 1.20   (standart ondalık nokta)
 *   "1.200,50"    → 1200.50 (Türkçe: nokta=binlik, virgül=ondalık)
 *   "1,200.50"    → 1200.50 (İngilizce: virgül=binlik, nokta=ondalık)
 *   "1.20 USD"    → 1.20
 *   "150 TL"      → 150
 *   "1.500"       → 1500  (binlik nokta — 3 hane)
 *   "12,345"      → 12.345 (tek virgül her zaman ondalık)
 *   ""  / "abc"   → 0
 */
export function sanitizePrice(value: string | number | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  let raw = String(value ?? "")
    .replace(/[^\d.,-]/g, "")
    .trim();

  if (!raw) {
    return 0;
  }

  const hasDot = raw.includes(".");
  const hasComma = raw.includes(",");

  if (hasDot && hasComma) {
    if (raw.lastIndexOf(",") > raw.lastIndexOf(".")) {
      raw = raw.replace(/\./g, "").replace(",", ".");
    } else {
      raw = raw.replace(/,/g, "");
    }
  } else if (hasComma && !hasDot) {
    // Türkçede virgül ondalıktır: "12,345" → 12.345, "0,125" → 0.125
    // (28 Eyl 2026: eskiden 3 haneli virgül binlik sayılıp 1000 katına çıkıyordu).
    // Birden fazla virgül yalnız binlik ayıracı olabilir: "1,250,000".
    raw = (raw.match(/,/g) ?? []).length === 1 ? raw.replace(",", ".") : raw.replace(/,/g, "");
  } else if (hasDot && !hasComma) {
    // "1.500" / "1.250.000" → binlik nokta. Tek nokta + 1-2 hane ondalık: "12.5".
    if (/^-?\d{1,3}(\.\d{3})+$/.test(raw)) {
      raw = raw.replace(/\./g, "");
    }
  }

  const result = parseFloat(raw);
  return Number.isFinite(result) ? result : 0;
}

/** Boş / tire / sayı içermeyen fiyat hücresi: içe aktarmada "fiyat yok" sayılır
 *  (0 yazılıp mevcut fiyatı ezmesin). */
export function isBlankPriceCell(value: string | number | undefined | null) {
  if (typeof value === "number") return !Number.isFinite(value);
  return !/\d/.test(String(value ?? ""));
}
