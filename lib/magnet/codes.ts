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

// Saf yardımcılar proxy uyumluluğu için code-format.ts'e taşındı (bkz. oradaki not).
export { formatMagnetCodeForPrint, normalizeMagnetCode } from "@/lib/magnet/code-format";
