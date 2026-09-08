// Tekel bayilerinde alkollü ürünler vitrinde gösterilmez ve online sipariş
// edilemez (yasal gereklilik). Bu dosya "bu ürün büyük ihtimalle alkollü"
// kararını tek yerde toplar: katalog/stok içe aktarmaları (otomatik
// işaretleme) ve 0114 migration'ındaki geri doldurma aynı listeyi kullanır
// — listeyi değiştirirsen SQL'deki regex'i de güncelle.

/** ASCII'ye indirgenmiş (ş→s, ı→i ...) anahtar kelimeler; tam kelime eşleşir. */
export const ALCOHOL_KEYWORDS = [
  "bira",
  "sarap",
  "raki",
  "votka",
  "viski",
  "cin",
  "likor",
  "tekila",
  "rom",
  "alkol",
  "alkollu",
  "wine",
  "beer",
  "whisky",
  "whiskey",
  "vodka",
  "gin",
  "konyak",
  "cognac",
  "sampanya",
  "champagne",
  "tequila",
  "rum",
  "brandy",
  "vermut",
  "vermouth",
  "prosecco",
] as const;

const ALCOHOL_KEYWORD_SET = new Set<string>(ALCOHOL_KEYWORDS);

// "Çin" (ülke) ASCII'ye inince "cin" olur ("Çin lahanası" → cin). Bu kelime
// yalnız ham (katlanmamış) hâli de "cin" ise eşleşsin.
const RAW_ONLY_KEYWORDS = new Set(["cin"]);

const TURKISH_FOLD: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  i̇: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

function foldTurkish(value: string) {
  return value.replace(/[çğıi̇öşü]/g, (char) => TURKISH_FOLD[char] ?? char);
}

function tokenize(value: string): Array<{ raw: string; folded: string }> {
  const lowered = value.toLocaleLowerCase("tr-TR");
  return lowered
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((raw) => ({ raw, folded: foldTurkish(raw) }));
}

function containsAlcoholKeyword(value: string | null | undefined) {
  if (!value) return false;
  for (const token of tokenize(value)) {
    if (!ALCOHOL_KEYWORD_SET.has(token.folded)) continue;
    if (RAW_ONLY_KEYWORDS.has(token.folded) && token.raw !== token.folded) continue;
    return true;
  }
  return false;
}

/**
 * Ürün adı ya da kategori adı (varsa üst kategori adı da verilebilir)
 * alkol anahtar kelimesi içeriyorsa true. Kelime bazında eşleşir; "cinnamon"
 * / "romantik" gibi alt dize eşleşmeleri sayılmaz.
 */
export function isLikelyAlcohol(
  productName: string | null | undefined,
  categoryName?: string | null,
  parentCategoryName?: string | null,
): boolean {
  return (
    containsAlcoholKeyword(productName) ||
    containsAlcoholKeyword(categoryName) ||
    containsAlcoholKeyword(parentCategoryName)
  );
}

export const ALCOHOL_ONLINE_ORDER_ERROR =
  "Alkollü ürünler online sipariş edilemez, mağazadan alınır.";
