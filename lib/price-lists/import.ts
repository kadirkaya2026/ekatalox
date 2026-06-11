import {
  DEFAULT_PRICED_LIST_NAMES,
  LEGACY_PRICE_LIST_NAME_ALIASES,
  normalizePriceListName,
} from "@/lib/price-lists/constants";
import { getPricedLists } from "@/lib/price-lists/records";
import type { PriceList } from "@/lib/types";

export interface ImportListPrice {
  list_name: string;
  price: number;
}

export function buildImportPricesFromLegacyTiers(row: {
  price_tier_1?: number;
  price_tier_2?: number;
  price_tier_3?: number;
}): ImportListPrice[] {
  return DEFAULT_PRICED_LIST_NAMES.map((listName, index) => ({
    list_name: listName,
    price: Number(
      index === 0
        ? row.price_tier_1
        : index === 1
          ? row.price_tier_2
          : row.price_tier_3,
    ),
  }));
}

function buildPriceListImportLookup(priceLists: PriceList[]) {
  const pricedLists = getPricedLists(priceLists);
  const listNameMap = new Map<string, string>();

  for (const list of pricedLists) {
    const keys = new Set<string>([
      list.name,
      normalizePriceListName(list.name),
      ...DEFAULT_PRICED_LIST_NAMES,
      ...Object.keys(LEGACY_PRICE_LIST_NAME_ALIASES),
      ...Object.values(LEGACY_PRICE_LIST_NAME_ALIASES),
    ]);

    for (const key of keys) {
      listNameMap.set(key.toLocaleLowerCase("tr-TR"), list.id);
    }
  }

  return listNameMap;
}

export function resolveImportPricesForTenant(
  prices: ImportListPrice[],
  priceLists: PriceList[],
) {
  const listNameMap = buildPriceListImportLookup(priceLists);

  return prices
    .map((entry) => {
      const normalizedName = normalizePriceListName(entry.list_name);
      const priceListId =
        listNameMap.get(normalizedName.toLocaleLowerCase("tr-TR")) ??
        listNameMap.get(entry.list_name.toLocaleLowerCase("tr-TR"));

      if (!priceListId) {
        return null;
      }

      return {
        price_list_id: priceListId,
        price: entry.price,
      };
    })
    .filter((entry): entry is { price_list_id: string; price: number } => Boolean(entry));
}
