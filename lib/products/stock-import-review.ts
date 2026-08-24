/**
 * Stok listesi inceleme adiminin saf yardimcilari.
 *
 * Bilesenin (stock-import-panel.tsx) icinde durduklari surece test
 * edilemiyorlardi; kategori gruplamasi ve toplu atla/geri al mantigi
 * burada, React'tan bagimsiz duruyor.
 */

export type SkippableAction =
  | "approved"
  | "reassigned"
  | "skipped"
  | "pending"
  | "suggested"
  | "create"
  | "created";

export interface ReviewDecisionLike {
  action: SkippableAction;
  productId: string | null;
  masterCatalogSkuCode: string | null;
}

export interface ReviewResultLike {
  rowNumber: number;
  matchedProductId: string | null;
  masterCatalogMatch: { categoryName: string } | null;
}

export const UNCATEGORIZED_LABEL = "Kategorisiz";

/**
 * Satirin kategorisi: once Master Katalog eslesmesinden, yoksa tenant'ta
 * eslesen urunun kategorisinden. Ikisi de yoksa "Kategorisiz".
 */
export function resolveRowCategory(
  result: ReviewResultLike,
  decision: ReviewDecisionLike | undefined,
  categoryIdOfProduct: (productId: string) => string | null | undefined,
  categoryNameById: (categoryId: string) => string | undefined,
): string {
  const masterCategory = result.masterCatalogMatch?.categoryName?.trim();
  if (masterCategory) return masterCategory;

  const productId = decision?.productId ?? result.matchedProductId;
  if (!productId) return UNCATEGORIZED_LABEL;

  const categoryId = categoryIdOfProduct(productId);
  if (!categoryId) return UNCATEGORIZED_LABEL;

  return categoryNameById(categoryId) ?? UNCATEGORIZED_LABEL;
}

export interface CategoryGroup {
  name: string;
  rowNumbers: number[];
  skipped: number;
}

/** Satirlari kategoriye gore gruplar, cok satirli kategori basta olacak sekilde siralar. */
export function groupRowsByCategory<TResult extends ReviewResultLike>(
  results: TResult[],
  decisions: Map<number, ReviewDecisionLike>,
  categoryOf: (result: TResult) => string,
): CategoryGroup[] {
  const groups = new Map<string, number[]>();

  for (const result of results) {
    const name = categoryOf(result);
    const list = groups.get(name);
    if (list) list.push(result.rowNumber);
    else groups.set(name, [result.rowNumber]);
  }

  return [...groups.entries()]
    .map(([name, rowNumbers]) => ({
      name,
      rowNumbers,
      skipped: rowNumbers.filter((rowNumber) => decisions.get(rowNumber)?.action === "skipped").length,
    }))
    .sort((a, b) => b.rowNumbers.length - a.rowNumbers.length || a.name.localeCompare(b.name, "tr"));
}

/**
 * Toplu atla / atlamayi geri al.
 *
 * Atlarken eslesme bilgisi KORUNUR — "skipped" satirlar zaten yalnizca
 * action'a bakilarak eleniyor. Geri alinca satir, eslesmesi varsa dogrudan
 * "approved"a doner; yoksa "pending" kalir.
 */
export function applySkip<T extends ReviewDecisionLike>(
  decisions: Map<number, T>,
  rowNumbers: Iterable<number>,
  skip: boolean,
): Map<number, T> {
  const next = new Map(decisions);

  for (const rowNumber of rowNumbers) {
    const decision = next.get(rowNumber);
    if (!decision) continue;

    if (skip) {
      if (decision.action === "skipped") continue;
      next.set(rowNumber, { ...decision, action: "skipped" });
    } else {
      if (decision.action !== "skipped") continue;
      next.set(rowNumber, {
        ...decision,
        action: decision.productId || decision.masterCatalogSkuCode ? "approved" : "pending",
      });
    }
  }

  return next;
}
