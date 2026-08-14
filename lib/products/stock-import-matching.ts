import type { StockImportSourceRow } from "@/lib/csv/parse-stock-import";

export interface TenantProductForMatching {
  id: string;
  sku_code: string;
  product_name: string;
}

export type StockImportMatchStatus =
  | "matched_exact"
  | "matched_fuzzy_high"
  | "needs_review"
  | "no_match";

export interface StockImportCandidate {
  productId: string;
  sku_code: string;
  product_name: string;
  score: number;
}

export type StockImportRowWarning = "price_missing" | "duplicate_barcode_in_file";

export interface StockImportMatchResult {
  rowNumber: number;
  status: StockImportMatchStatus;
  matchedProductId: string | null;
  candidates: StockImportCandidate[];
  warnings: StockImportRowWarning[];
}

export const FUZZY_HIGH_SCORE_THRESHOLD = 0.9;
export const FUZZY_HIGH_MARGIN = 0.08;
export const FUZZY_REVIEW_SCORE_THRESHOLD = 0.55;
export const MAX_CANDIDATES = 3;

// "g", "ml", "süt" gibi binlerce üründe geçen kelimeler token-index'te dev
// bucket'lar oluşturup satır başına aday havuzunu patlatıyordu (10k+
// ürünlü bir kataloğa karşı 10k+ satırlık dosyada dakikalarca sürüp zaman
// aşımına yol açıyordu). İki katmanlı sınırlama uyguluyoruz:
//   1) aday havuzu kurulurken en nadir (ayırt edici) kelimelerden başlanır,
//      toplam CANDIDATE_POOL_CAP'e ulaşınca durulur.
//   2) pahalı Levenshtein hesabı sadece ucuz Jaccard'a göre en iyi
//      LEVENSHTEIN_STAGE_CAP adaya uygulanır, tüm havuza değil.
const CANDIDATE_POOL_CAP = 300;
const LEVENSHTEIN_STAGE_CAP = 25;

function normalizeText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function tokenize(value: string): string[] {
  return normalizeText(value).split(" ").filter(Boolean);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) {
    return 0;
  }

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Klasik Levenshtein mesafesi (O(n*m) DP) — bu kapsam için ekstra bir
// bağımlılık (fuse.js vb.) eklemeye değmeyecek kadar küçük bir fonksiyon.
function levenshteinDistance(a: string, b: string): number {
  const lenA = a.length;
  const lenB = b.length;

  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  let previousRow = Array.from({ length: lenB + 1 }, (_, i) => i);

  for (let i = 1; i <= lenA; i += 1) {
    const currentRow = [i];
    for (let j = 1; j <= lenB; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow.push(
        Math.min(
          previousRow[j]! + 1,
          currentRow[j - 1]! + 1,
          previousRow[j - 1]! + cost,
        ),
      );
    }
    previousRow = currentRow;
  }

  return previousRow[lenB]!;
}

function levenshteinRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length, 1);
  return 1 - levenshteinDistance(a, b) / maxLen;
}

// Barkod okuyucu/POS sistemlerinin stok listelerinde ürün adı genelde
// kısaltılmış tek-iki kelimedir (ör. "CRAX"), katalogdaki karşılığı ise
// uzun ve betimleyicidir (ör. "Eti Crax Çubuk Kraker 40 G"). Bu durumda
// tam string benzerliği (Levenshtein) uzunluk farkı yüzünden haksız
// yere düşük çıkıyor — satırın kelimelerinin TAMAMI adayda geçiyorsa
// bunu ayrı bir sinyal olarak değerlendiriyoruz.
//
// Ucuz (sadece Set.has, yazım hatası toleranssız) sürüm — büyük aday
// havuzunu (CANDIDATE_POOL_CAP) daraltan 1. aşamada kullanılır.
function exactContainmentScore(rowTokens: Set<string>, candidateTokens: Set<string>): number {
  if (rowTokens.size < 2) return 0;

  let found = 0;
  for (const token of rowTokens) {
    if (candidateTokens.has(token)) found += 1;
  }
  return found / rowTokens.size;
}

// Pahalı (yazım hatası toleranslı, token-Levenshtein) sürüm — sadece
// zaten daraltılmış LEVENSHTEIN_STAGE_CAP büyüklüğündeki kısa listede
// kullanılır.
function tokenContainmentScore(rowTokens: Set<string>, candidateTokens: Set<string>): number {
  if (rowTokens.size < 2) return 0;

  let found = 0;
  for (const token of rowTokens) {
    if (candidateTokens.has(token)) {
      found += 1;
      continue;
    }
    for (const candidateToken of candidateTokens) {
      if (levenshteinRatio(token, candidateToken) >= 0.85) {
        found += 1;
        break;
      }
    }
  }
  return found / rowTokens.size;
}

function scoreNameMatch(rowName: string, candidateName: string, rowTokens: Set<string>, candidateTokens: Set<string>) {
  const baseScore = 0.5 * jaccard(rowTokens, candidateTokens) + 0.5 * levenshteinRatio(rowName, candidateName);
  // 0.75 ile sınırlanıyor: containment tek başına hiçbir zaman otomatik
  // onay eşiğini (0.9) geçemez, sadece satırı "gözden geçir"e taşıyabilir
  // — kısa isimlerin yanlışlıkla otomatik onaylanmasını engellemek için.
  const containmentScore = tokenContainmentScore(rowTokens, candidateTokens) * 0.75;
  return Math.max(baseScore, containmentScore);
}

export function matchStockImportRows(
  rows: StockImportSourceRow[],
  products: TenantProductForMatching[],
): StockImportMatchResult[] {
  const productBySkuCode = new Map<string, TenantProductForMatching>();
  for (const product of products) {
    if (product.sku_code) {
      productBySkuCode.set(normalizeCode(product.sku_code), product);
    }
  }

  // Ürün adlarından bir kez token-inverted-index kuruyoruz; her satır için
  // tüm kataloğu (satır × ürün tam çarpımı) taramak yerine sadece ortak
  // kelimesi olan ürünleri aday havuzuna alıyoruz.
  const tokenIndex = new Map<string, Set<string>>();
  const normalizedNameById = new Map<string, string>();
  const tokensById = new Map<string, Set<string>>();

  for (const product of products) {
    const normalizedName = normalizeText(product.product_name);
    normalizedNameById.set(product.id, normalizedName);
    const tokens = new Set(tokenize(product.product_name));
    tokensById.set(product.id, tokens);

    for (const token of tokens) {
      const bucket = tokenIndex.get(token);
      if (bucket) {
        bucket.add(product.id);
      } else {
        tokenIndex.set(token, new Set([product.id]));
      }
    }
  }

  const seenBarcodes = new Set<string>();
  const duplicateBarcodes = new Set<string>();
  for (const row of rows) {
    if (!row.barcode) continue;
    const normalized = normalizeCode(row.barcode);
    if (seenBarcodes.has(normalized)) {
      duplicateBarcodes.add(normalized);
    }
    seenBarcodes.add(normalized);
  }

  // Satır sayısı × ürün sayısı kadar tekrar kurulmasın diye döngü dışında
  // bir kez oluşturuluyor (büyük katalog + büyük dosyada eskiden burası
  // eşleştirmenin kendisinden çok daha yavaştı).
  const productById = new Map(products.map((product) => [product.id, product]));

  return rows.map((row): StockImportMatchResult => {
    const warnings: StockImportRowWarning[] = [];
    if (row.price === null) {
      warnings.push("price_missing");
    }
    if (row.barcode && duplicateBarcodes.has(normalizeCode(row.barcode))) {
      warnings.push("duplicate_barcode_in_file");
    }

    if (row.barcode) {
      const exactMatch = productBySkuCode.get(normalizeCode(row.barcode));
      if (exactMatch) {
        return {
          rowNumber: row.rowNumber,
          status: "matched_exact",
          matchedProductId: exactMatch.id,
          candidates: [
            {
              productId: exactMatch.id,
              sku_code: exactMatch.sku_code,
              product_name: exactMatch.product_name,
              score: 1,
            },
          ],
          warnings,
        };
      }
    }

    if (!row.productName) {
      return {
        rowNumber: row.rowNumber,
        status: "no_match",
        matchedProductId: null,
        candidates: [],
        warnings,
      };
    }

    const rowNormalizedName = normalizeText(row.productName);
    const rowTokens = new Set(tokenize(row.productName));

    // En nadir kelimeden başlayarak aday ekle; havuz dolunca dur. Böylece
    // yaygın kelimeler (bucket'ı büyük olanlar) tek başına havuzu
    // doldurmuyor, asıl ayırt edici (nadir) kelimeler önceliklendiriliyor.
    const tokenBuckets = [...rowTokens]
      .map((token) => tokenIndex.get(token))
      .filter((bucket): bucket is Set<string> => Boolean(bucket))
      .sort((a, b) => a.size - b.size);

    const candidateIds = new Set<string>();
    for (const bucket of tokenBuckets) {
      if (candidateIds.size >= CANDIDATE_POOL_CAP) break;
      for (const productId of bucket) {
        candidateIds.add(productId);
        if (candidateIds.size >= CANDIDATE_POOL_CAP) break;
      }
    }

    // 1. aşama: ucuz Jaccard + tam-eşleşme içerme skoruna göre havuzu
    // daralt (exactContainmentScore — yazım hatası toleranssız, sadece
    // Set.has). Sadece Jaccard kullanılsaydı, kısa stok isimlerinin doğru
    // (ama uzun) karşılığı bu aşamada elenip 2. aşamaya hiç girmeyebilirdi;
    // yazım hatası toleransı gerektiren (tokenContainmentScore) daha pahalı
    // kontrol zaten daraltılmış 2. aşamada yapılıyor, burada değil —
    // CANDIDATE_POOL_CAP büyüklüğünde bir havuzda satır başına token×token
    // Levenshtein çok pahalıya çıkıyordu.
    const jaccardRanked = [...candidateIds]
      .map((productId) => {
        const candidateTokens = tokensById.get(productId)!;
        const preScore = Math.max(
          jaccard(rowTokens, candidateTokens),
          exactContainmentScore(rowTokens, candidateTokens),
        );
        return { productId, preScore };
      })
      .sort((a, b) => b.preScore - a.preScore)
      .slice(0, LEVENSHTEIN_STAGE_CAP);

    // 2. aşama: sadece daralmış havuzda pahalı Levenshtein hesabı yapılır.
    const scored = jaccardRanked
      .map(({ productId }) => {
        const product = productById.get(productId)!;
        const score = scoreNameMatch(
          rowNormalizedName,
          normalizedNameById.get(productId)!,
          rowTokens,
          tokensById.get(productId)!,
        );
        return { product, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_CANDIDATES);

    const candidates: StockImportCandidate[] = scored.map(({ product, score }) => ({
      productId: product.id,
      sku_code: product.sku_code,
      product_name: product.product_name,
      score,
    }));

    const top = scored[0];
    const second = scored[1];

    if (
      top &&
      top.score >= FUZZY_HIGH_SCORE_THRESHOLD &&
      (!second || top.score - second.score >= FUZZY_HIGH_MARGIN)
    ) {
      return {
        rowNumber: row.rowNumber,
        status: "matched_fuzzy_high",
        matchedProductId: top.product.id,
        candidates,
        warnings,
      };
    }

    if (top && top.score >= FUZZY_REVIEW_SCORE_THRESHOLD) {
      return {
        rowNumber: row.rowNumber,
        status: "needs_review",
        matchedProductId: null,
        candidates,
        warnings,
      };
    }

    return {
      rowNumber: row.rowNumber,
      status: "no_match",
      matchedProductId: null,
      candidates,
      warnings,
    };
  });
}
