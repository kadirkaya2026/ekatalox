// Müşteriler yabancı marka/ürün isimlerini genelde Türkçe okunuşlarıyla
// yazıyor (örn. "cola" yerine "kola", "chivas" yerine "şivas") — bunlar
// yazım hatası değil gerçek fonetik farklılıklar olduğu için ürün araması
// (Postgres ILIKE, substring eşleşmesi) onları yakalayamıyor. Bilinen
// gruplardan biriyle eşleşen kelimeler için, arama terimine diğer olası
// yazımları da ek OR koşulu olarak ekliyoruz.
const PHONETIC_ALIAS_GROUPS: string[][] = [
  ["kola", "cola"],
  ["kok", "coke"],
  ["çips", "cips", "chips"],
  ["şivas", "sivas", "chivas"],
  ["vişki", "viski", "whisky", "whiskey"],
  ["votka", "vodka"],
  ["cin", "gin"],
  ["şampanya", "sampanya", "champagne"],
];

const ALIAS_LOOKUP = new Map<string, string[]>();
for (const group of PHONETIC_ALIAS_GROUPS) {
  const normalizedGroup = group.map((word) => word.toLocaleLowerCase("tr-TR"));
  for (const word of normalizedGroup) {
    ALIAS_LOOKUP.set(
      word,
      normalizedGroup.filter((candidate) => candidate !== word),
    );
  }
}

/**
 * Verilen arama terimindeki kelimelerden biri bilinen bir fonetik grupla
 * eşleşiyorsa, o grubun diğer yazımlarıyla genişletilmiş terim listesini
 * döndürür. İlk eleman her zaman orijinal (trim edilmiş) terimin kendisidir;
 * eşleşme yoksa tek elemanlı dizi döner.
 */
export function expandSearchTermWithPhoneticAliases(term: string): string[] {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const terms = new Set<string>([trimmed]);
  const lowerTrimmed = trimmed.toLocaleLowerCase("tr-TR");
  const words = lowerTrimmed.split(/\s+/).filter(Boolean);

  for (const word of words) {
    const aliases = ALIAS_LOOKUP.get(word);
    if (!aliases?.length) continue;

    for (const alias of aliases) {
      terms.add(words.length === 1 ? alias : lowerTrimmed.replace(word, alias));
    }
  }

  return [...terms];
}
