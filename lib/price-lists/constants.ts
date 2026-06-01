export const CATALOG_ONLY_PRICE_LIST_NAME = "Fiyatsız Katalog";

export const DEFAULT_PRICED_LIST_NAMES = ["Perakende", "Bayi 1", "Bayi 2"] as const;

export function buildPriceListCsvHeader(listName: string) {
  return `Fiyat: ${listName}`;
}

export function parsePriceListCsvHeader(header: string) {
  const trimmed = header.trim();
  const prefix = "Fiyat:";

  if (!trimmed.toLocaleLowerCase("tr-TR").startsWith(prefix.toLocaleLowerCase("tr-TR"))) {
    return null;
  }

  const name = trimmed.slice(prefix.length).trim();
  return name || null;
}
