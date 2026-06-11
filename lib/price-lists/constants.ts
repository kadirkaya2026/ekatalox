export const CATALOG_ONLY_PRICE_LIST_NAME = "Fiyatsız Katalog";

export const DEFAULT_PRICED_LIST_NAMES = ["1.Liste", "2.Liste", "3.Liste"] as const;

export const LEGACY_PRICE_LIST_NAME_ALIASES = {
  Perakende: "1.Liste",
  "Bayi 1": "2.Liste",
  "Bayi 2": "3.Liste",
} as const satisfies Record<string, (typeof DEFAULT_PRICED_LIST_NAMES)[number]>;

const SORT_ORDER_PRICE_LIST_LABELS: Record<number, (typeof DEFAULT_PRICED_LIST_NAMES)[number]> = {
  1: "1.Liste",
  2: "2.Liste",
  3: "3.Liste",
};

export function normalizePriceListName(name: string) {
  return (
    LEGACY_PRICE_LIST_NAME_ALIASES[name as keyof typeof LEGACY_PRICE_LIST_NAME_ALIASES] ?? name
  );
}

export function getPriceListDisplayName(list: {
  name: string;
  is_catalog_only: boolean;
  sort_order?: number;
}) {
  if (list.is_catalog_only) {
    return CATALOG_ONLY_PRICE_LIST_NAME;
  }

  const normalizedName = normalizePriceListName(list.name);
  if (normalizedName !== list.name) {
    return normalizedName;
  }

  if (
    DEFAULT_PRICED_LIST_NAMES.includes(
      list.name as (typeof DEFAULT_PRICED_LIST_NAMES)[number],
    )
  ) {
    return list.name;
  }

  const bySortOrder =
    typeof list.sort_order === "number"
      ? SORT_ORDER_PRICE_LIST_LABELS[list.sort_order]
      : null;

  return bySortOrder ?? list.name;
}

/** @deprecated Use getPriceListDisplayName */
export const getAccessCodePriceListLabel = getPriceListDisplayName;

export function buildPriceListCsvHeader(listName: string) {
  return `Fiyat: ${normalizePriceListName(listName)}`;
}

export function parsePriceListCsvHeader(header: string) {
  const trimmed = header.trim();
  const prefix = "Fiyat:";

  if (!trimmed.toLocaleLowerCase("tr-TR").startsWith(prefix.toLocaleLowerCase("tr-TR"))) {
    return null;
  }

  const name = trimmed.slice(prefix.length).trim();
  return name ? normalizePriceListName(name) : null;
}
