// ZIP'teki görsel dosya adını ürünün Model No'suna eşler (28 Eyl 2026 denetimi).
// Eskiden birebir eşitlik aranıyordu: "sal1333-antrasit.JPG", "SAL1333 ANTRASİT",
// macOS'un NFD adları ve "SAL1333-BEJ (2).jpg" hiç eşleşmiyordu.

/** Karşılaştırma anahtarı: NFC, Türkçe büyük harf, İ/ı → I, boşluk/_/- tek ayraç. */
export function skuMatchKey(value: string) {
  return value
    .normalize("NFC")
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replace(/[İI]/g, "I")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type ImageSlot = 1 | 2 | 3;

export interface ImageFileMatch {
  skuCode: string;
  slot: ImageSlot;
}

export function buildSkuMatcher(skuCodes: string[]) {
  const byKey = new Map<string, string>();
  for (const sku of skuCodes) {
    const key = skuMatchKey(sku);
    if (key && !byKey.has(key)) byKey.set(key, sku);
  }

  return (fileBaseName: string): ImageFileMatch | null => {
    const direct = byKey.get(skuMatchKey(fileBaseName));
    if (direct) return { skuCode: direct, slot: 1 };

    // "KOD (2)", "KOD_2", "KOD-2", "KOD 3" → aynı ürünün 2./3. görseli.
    // Yalnız ek atılınca gerçek bir Model No'ya denk geliyorsa (KOD-2 diye
    // ayrı bir ürün varsa yukarıda birebir eşleşmiş olur).
    const suffix = /^(.*?)[\s_-]*\(?([1-3])\)?$/.exec(fileBaseName.normalize("NFC").trim());
    if (suffix && suffix[1]) {
      const base = byKey.get(skuMatchKey(suffix[1]));
      if (base) return { skuCode: base, slot: Number(suffix[2]) as ImageSlot };
    }
    return null;
  };
}

// Windows'un Türkçe "Sıkıştırılmış klasör"ü dosya adlarını UTF-8 bayrağı
// olmadan CP857 ile yazar; JSZip bunları bozuk okuyordu.
const CP857_HIGH: Record<number, string> = {
  0x80: "Ç", 0x81: "ü", 0x82: "é", 0x83: "â", 0x84: "ä", 0x85: "à", 0x86: "å", 0x87: "ç",
  0x88: "ê", 0x89: "ë", 0x8a: "è", 0x8b: "ï", 0x8c: "î", 0x8d: "ı", 0x8e: "Ä", 0x8f: "Å",
  0x90: "É", 0x91: "æ", 0x92: "Æ", 0x93: "ô", 0x94: "ö", 0x95: "ò", 0x96: "û", 0x97: "ù",
  0x98: "İ", 0x99: "Ö", 0x9a: "Ü", 0x9b: "ø", 0x9c: "£", 0x9d: "Ø", 0x9e: "Ş", 0x9f: "ş",
  0xa0: "á", 0xa1: "í", 0xa2: "ó", 0xa3: "ú", 0xa4: "ñ", 0xa5: "Ñ", 0xa6: "Ğ", 0xa7: "ğ",
};

export function decodeZipFileName(bytes: string[] | Uint8Array | Buffer): string {
  const array = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes as string[], (b) => Number(b));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(array);
  } catch {
    return Array.from(array, (byte) => (byte < 0x80 ? String.fromCharCode(byte) : CP857_HIGH[byte] ?? "_")).join("");
  }
}
