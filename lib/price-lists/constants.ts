export const CATALOG_ONLY_PRICE_LIST_NAME = "Fiyatsız Katalog";

export const DEFAULT_PRICED_LIST_NAMES = ["Perakende", "Bayi 1", "Bayi 2"] as const;

const ACCESS_CODE_PRICE_LIST_LABELS: Record<(typeof DEFAULT_PRICED_LIST_NAMES)[number], string> = {
  Perakende: "Perakende : 1.Liste",
  "Bayi 1": "Bayi 1 : Liste 2",
  "Bayi 2": "Bayi 2 : Liste 3",
};

export function getAccessCodePriceListLabel(list: {
  name: string;
  is_catalog_only: boolean;
  sort_order?: number;
}) {
  if (list.is_catalog_only) {
    return `${list.name} • Fiyatsız`;
  }

  const byName = ACCESS_CODE_PRICE_LIST_LABELS[list.name as keyof typeof ACCESS_CODE_PRICE_LIST_LABELS];
  if (byName) {
    return byName;
  }

  const bySortOrder =
    list.sort_order === 1
      ? ACCESS_CODE_PRICE_LIST_LABELS.Perakende
      : list.sort_order === 2
        ? ACCESS_CODE_PRICE_LIST_LABELS["Bayi 1"]
        : list.sort_order === 3
          ? ACCESS_CODE_PRICE_LIST_LABELS["Bayi 2"]
          : null;

  return bySortOrder ?? list.name;
}

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
