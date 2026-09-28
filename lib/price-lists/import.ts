import {
  DEFAULT_PRICED_LIST_NAMES,
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

// İçe aktarmadaki liste adını mağazanın fiyat listesine çözer (28 Eyl 2026
// denetimi). Sıra: (1) birebir ad, (2) boşluk/harf duyarsız ad ("1. Liste" ↔
// "1.Liste", "1.LİSTE"), (3) şablon adı "N.Liste" → mağazanın N'inci fiyatlı
// listesi (sort_order). Eşleşmeyen girdiler sessizce atlanmaz; raporlanır.
function compactListKey(name: string) {
  return name.normalize("NFC").replace(/\s+/g, "").toLocaleLowerCase("tr-TR").replace(/ı/g, "i");
}

function buildPriceListResolver(priceLists: PriceList[]) {
  const pricedLists = [...getPricedLists(priceLists)].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const exact = new Map<string, string>();
  const compact = new Map<string, string>();
  for (const list of pricedLists) {
    if (!exact.has(list.name)) exact.set(list.name, list.id);
    const key = compactListKey(list.name);
    // Aynı anahtara iki liste düşerse ilk (sort_order küçük) kazanır.
    if (!compact.has(key)) compact.set(key, list.id);
  }

  return (rawName: string): string | null => {
    const name = rawName.trim();
    const byExact = exact.get(name) ?? compact.get(compactListKey(name));
    if (byExact) return byExact;
    const canonical = normalizePriceListName(name);
    const byCanonical = exact.get(canonical) ?? compact.get(compactListKey(canonical));
    if (byCanonical) return byCanonical;
    const position = /^(\d+)\.?liste$/.exec(compactListKey(canonical));
    if (position) {
      return pricedLists[Number(position[1]) - 1]?.id ?? null;
    }
    return null;
  };
}

export interface ResolvedImportPrices {
  prices: Array<{ price_list_id: string; price: number }>;
  unmatched: string[];
}

export function resolveImportPricesWithReport(
  prices: ImportListPrice[],
  priceLists: PriceList[],
  resolver = buildPriceListResolver(priceLists),
): ResolvedImportPrices {
  // price_list_id bazında tekilleştir: aynı listeye çözülen birden çok girdi
  // upsert'i tek satıra indirir, son değer kazanır.
  const byPriceListId = new Map<string, { price_list_id: string; price: number }>();
  const unmatched: string[] = [];

  for (const entry of prices) {
    const priceListId = resolver(entry.list_name);
    if (!priceListId) {
      unmatched.push(entry.list_name);
      continue;
    }
    byPriceListId.set(priceListId, { price_list_id: priceListId, price: entry.price });
  }

  return { prices: [...byPriceListId.values()], unmatched };
}

export function createPriceListResolver(priceLists: PriceList[]) {
  return buildPriceListResolver(priceLists);
}

export function resolveImportPricesForTenant(
  prices: ImportListPrice[],
  priceLists: PriceList[],
) {
  return resolveImportPricesWithReport(prices, priceLists).prices;
}
