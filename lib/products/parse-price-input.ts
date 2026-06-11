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
    if (/,\d{1,2}$/.test(raw)) {
      raw = raw.replace(",", ".");
    } else {
      raw = raw.replace(/,/g, "");
    }
  } else if (hasDot && !hasComma) {
    if (/\.\d{3}$/.test(raw)) {
      raw = raw.replace(/\./g, "");
    }
  }

  const result = parseFloat(raw);
  return Number.isFinite(result) ? result : 0;
}
