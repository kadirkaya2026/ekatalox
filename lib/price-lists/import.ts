import { DEFAULT_PRICED_LIST_NAMES } from "@/lib/price-lists/constants";
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

export function resolveImportPricesForTenant(
  prices: ImportListPrice[],
  priceLists: PriceList[],
) {
  const pricedLists = getPricedLists(priceLists);
  const listNameMap = new Map(
    pricedLists.map((list) => [list.name.toLocaleLowerCase("tr-TR"), list.id]),
  );

  return prices
    .map((entry) => {
      const priceListId = listNameMap.get(entry.list_name.toLocaleLowerCase("tr-TR"));

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
