// Ayrı modül: proxy.ts da import ediyor. lib/magnet/codes.ts node:crypto
// çektiği için proxy'den kullanılamaz; kod biçimlendirme/doğrulama gibi saf
// fonksiyonlar buraya alındı, codes.ts geriye dönük re-export ediyor.

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
