// Müşteriler yabancı marka/ürün isimlerini genelde Türkçe okunuşlarıyla
// yazıyor (örn. "cola" yerine "kola", "chivas" yerine "şivas") — bunlar
// yazım hatası değil gerçek fonetik farklılıklar olduğu için ürün araması
// (Postgres ILIKE, substring eşleşmesi) onları yakalayamıyor. Bilinen
// gruplardan biriyle eşleşen kelimeler için, arama terimine diğer olası
// yazımları da ek OR koşulu olarak ekliyoruz. Bu grup çift yönlüdür: her
// yazım diğerlerini de tetikler (aynı şeyin farklı yazımları).
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

// Tek yönlü: müşterinin yazdığı genel/kategori terimi ya da argo bir isim,
// ürün adında hiç geçmeyen belirli marka(lar)a karşılık geliyor (örn. "kola"
// yazan biri sadece Coca-Cola değil Pepsi de görmek ister; "sarı kola"
// tabiri doğrudan Fanta'yı işaret eder). TERS YÖNDE uygulanmaz — "pepsi"
// yazan biri Coca-Cola görmek istemez, bu yüzden bunlar simetrik değildir.
// Anahtarlar tek kelime veya tam bir öbek olabilir ("sarı kola" gibi).
const GENERIC_TERM_EXPANSIONS: Record<string, string[]> = {
  kola: ["pepsi", "cola turca"],
  "sarı kola": ["fanta"],
  "beyaz kola": ["sprite"],
  pampers: ["prima"],
  // "bira" ürün adında genelde geçmez (ör. "Efes Extra 50 CL" içinde "bira"
  // kelimesi yok) — kategori terimini yazan müşteri markaları görmeli.
  bira: ["efes", "tuborg", "carlsberg", "heineken", "becks", "bomonti"],
  // "viski"/"whisky" fonetik grubuyla zaten eşleşiyor, ama marka isimlerinin
  // hiçbiri bu kelimeyi içermiyor — ayrıca marka listesine genişletilmeli.
  viski: ["chivas", "jack daniel", "johnnie walker", "ballantine", "jim beam", "grant"],
  vişki: ["chivas", "jack daniel", "johnnie walker", "ballantine", "jim beam", "grant"],
  whisky: ["chivas", "jack daniel", "johnnie walker", "ballantine", "jim beam", "grant"],
  votka: ["absolut", "smirnoff", "finlandia"],
  vodka: ["absolut", "smirnoff", "finlandia"],
  cin: ["gordon", "bombay sapphire", "beefeater"],
  gin: ["gordon", "bombay sapphire", "beefeater"],
  rom: ["bacardi", "captain morgan"],
  "enerji içeceği": ["redbull", "hell"],
  // Cips markalarının çoğu (Lay's, Doritos vb.) adında "cips"/"chips"
  // kelimesi geçmiyor — "çips"/"cips" fonetik grubuyla zaten eşleşiyor,
  // burada ayrıca marka listesine genişletiliyor.
  çips: ["lays", "ruffles", "doritos", "cheetos", "pringles"],
  cips: ["lays", "ruffles", "doritos", "cheetos", "pringles"],
  chips: ["lays", "ruffles", "doritos", "cheetos", "pringles"],
  çikolata: ["milka", "toblerone", "kinder", "nutella"],
  bisküvi: ["oreo"],
  // Türkçe temizlik ürünü adları genelde kategori kelimesini zaten içeriyor
  // (ör. "Persil ... Çamaşır Deterjanı"), ama marka-adı-önce yazılmış
  // ürünlerde bu kelime hiç geçmeyebilir — ek güvenlik için markalar da
  // arama terimine dahil ediliyor.
  deterjan: ["omo", "ariel", "persil", "bingo"],
  "çamaşır suyu": ["domestos", "ace"],
  yumuşatıcı: ["vernel", "yumoş", "comfort"],
  "bulaşık deterjanı": ["fairy", "pril"],
};

/**
 * Verilen arama terimini, bilinen fonetik yazım gruplarıyla ve genel/argo
 * terim karşılıklarıyla genişletilmiş bir terim listesi olarak döndürür.
 * İlk eleman her zaman orijinal (trim edilmiş) terimin kendisidir; hiçbir
 * eşleşme yoksa tek elemanlı dizi döner.
 */
export function expandSearchTerms(term: string): string[] {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const terms = new Set<string>([trimmed]);
  const lowerTrimmed = trimmed.toLocaleLowerCase("tr-TR");

  for (const extra of GENERIC_TERM_EXPANSIONS[lowerTrimmed] ?? []) {
    terms.add(extra);
  }

  const words = lowerTrimmed.split(/\s+/).filter(Boolean);

  for (const word of words) {
    const aliases = ALIAS_LOOKUP.get(word);
    for (const alias of aliases ?? []) {
      terms.add(words.length === 1 ? alias : lowerTrimmed.replace(word, alias));
    }

    for (const extra of GENERIC_TERM_EXPANSIONS[word] ?? []) {
      terms.add(extra);
    }
  }

  return [...terms];
}
