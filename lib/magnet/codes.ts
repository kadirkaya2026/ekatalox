import { randomInt } from "node:crypto";

// Magnet kodu alfabesi.
//
// Karıştırılan karakterler bilerek YOK: 0/O, 1/l/I, 5/S, 2/Z. Kod
// magnetin üzerinde okunaklı metin olarak da basılıyor ve müşteri
// telefonda okuyup elle yazabiliyor; "k7m2xq" ile "k7mzxq" karışırsa
// yanlış mağazaya düşer.
const ALPHABET = "abcdefghjkmnpqrtuvwxy34679";

const CODE_LENGTH = 6;

/**
 * 6 karakterlik rastgele magnet kodu.
 *
 * Neden rastgele: sıralı kod (magaza1, magaza2) basılsaydı /t/magaza2
 * yazan biri başka bir bayinin vitrinine düşerdi. 26^6 ≈ 300 milyon
 * kombinasyon var, birkaç bin magnet için çakışma ihmal edilebilir —
 * yine de lower(code) üzerindeki benzersiz indeks son savunma olarak duruyor.
 *
 * Math.random yerine crypto.randomInt: tahmin edilebilirlik burada güvenlik
 * meselesi olmasa da, aynı anda üretilen toplu kodların öngörülebilir
 * olmaması iyi.
 */
export function generateMagnetCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

/** Magnet üzerine basılacak okunaklı biçim: K7M 2XQ */
export function formatMagnetCodeForPrint(code: string): string {
  const upper = code.toUpperCase();
  return `${upper.slice(0, 3)} ${upper.slice(3)}`;
}

/**
 * Elle girilen kodu doğrular ve normalize eder.
 *
 * NEDEN ELLE GİRİŞ VAR: basılmış bir magnetin kodu yanlışlıkla silinirse
 * o magnetler çöp olur. Aynı kodu yeniden yazabilmek tek kurtarma yolu.
 *
 * Bu yüzden doğrulama, ÜRETİM alfabesinden daha geniş: magnette ne
 * yazıyorsa o girilebilmeli (eski bir partide 0/O geçiyor olabilir).
 * Boşluk ve tire temizleniyor ("K7M 2XQ" -> "k7m2xq"), büyük harf
 * küçültülüyor — benzersiz indeks de lower(code) üzerinde.
 */
export function normalizeMagnetCode(input: string): { code: string } | { error: string } {
  const temiz = input.trim().toLowerCase().replace(/[\s-]/g, "");

  if (!temiz) {
    return { error: "Kod boş olamaz." };
  }

  if (!/^[a-z0-9]+$/.test(temiz)) {
    return { error: "Kod yalnızca harf ve rakam içerebilir." };
  }

  if (temiz.length < 4 || temiz.length > 16) {
    return { error: "Kod 4 ile 16 karakter arasında olmalıdır." };
  }

  return { code: temiz };
}
