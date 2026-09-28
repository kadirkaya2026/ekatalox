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

// "1. Liste" (kayıtta açılan ad) ile "1.Liste" (Excel şablonu) aynı listedir:
// boşluk ve büyük/küçük harf farkı eşleşmeyi bozmasın. 28 Eyl 2026 (qoop):
// eşleşmeyen fiyatlar sessizce atlanıyor, 195 ürün fiyatsız kalmıştı.
function compactListKey(name: string) {
  return name.replace(/\s+/g, "").toLocaleLowerCase("tr-TR");
}

function buildPriceListImportLookup(priceLists: PriceList[]) {
  const pricedLists = getPricedLists(priceLists);
  const listNameMap = new Map<string, string>();

  for (const list of pricedLists) {
    const canonical = normalizePriceListName(list.name);

    // Her liste yalnızca KENDİSİNE çözülen anahtarları sahiplenmeli:
    // kendi adı, normalize adı ve hedefi bu listenin normalize adı olan
    // eski (legacy) alias'lar. Aksi halde tüm default adlar son listeye
    // çöker ve içe aktarmada aynı price_list_id birden çok kez üretilir
    // (upsert'te "ON CONFLICT ... cannot affect row a second time").
    const keys = new Set<string>([list.name, canonical]);

    for (const [aliasName, canonicalTarget] of Object.entries(
      LEGACY_PRICE_LIST_NAME_ALIASES,
    )) {
      if (canonicalTarget === canonical) {
        keys.add(aliasName);
      }
    }

    for (const key of keys) {
      listNameMap.set(key.toLocaleLowerCase("tr-TR"), list.id);
      const compact = compactListKey(key);
      if (!listNameMap.has(compact)) listNameMap.set(compact, list.id);
    }
  }

  return listNameMap;
}

export function resolveImportPricesForTenant(
  prices: ImportListPrice[],
  priceLists: PriceList[],
) {
  const listNameMap = buildPriceListImportLookup(priceLists);

  // price_list_id bazında tekilleştir: aynı listeye çözülen birden çok girdi
  // (ör. yinelenen fiyat sütunu) upsert'i tek satıra indirir, son değer kazanır.
  const byPriceListId = new Map<string, { price_list_id: string; price: number }>();

  for (const entry of prices) {
    const normalizedName = normalizePriceListName(entry.list_name);
    const priceListId =
      listNameMap.get(normalizedName.toLocaleLowerCase("tr-TR")) ??
      listNameMap.get(entry.list_name.toLocaleLowerCase("tr-TR")) ??
      listNameMap.get(compactListKey(normalizedName)) ??
      listNameMap.get(compactListKey(entry.list_name));

    if (!priceListId) {
      continue;
    }

    byPriceListId.set(priceListId, { price_list_id: priceListId, price: entry.price });
  }

  return [...byPriceListId.values()];
}
