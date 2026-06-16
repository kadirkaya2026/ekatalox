import type { PriceList, ProductPrice, ProductVariantPrice } from "@/lib/types";

type RawPriceListRecord = Record<string, unknown>;
type RawProductPriceRecord = Record<string, unknown>;

export function normalizePriceListRecord(record: RawPriceListRecord): PriceList {
  return {
    id: String(record.id ?? ""),
    tenant_id: String(record.tenant_id ?? ""),
    name: String(record.name ?? "").trim(),
    is_catalog_only: Boolean(record.is_catalog_only),
    sort_order: Number(record.sort_order ?? 0),
    created_at: String(record.created_at ?? ""),
  };
}

export function normalizeProductPriceRecord(record: RawProductPriceRecord): ProductPrice {
  return {
    product_id: String(record.product_id ?? ""),
    price_list_id: String(record.price_list_id ?? ""),
    price: Number(record.price ?? 0),
  };
}

export function normalizeProductVariantPriceRecord(
  record: RawProductPriceRecord,
): ProductVariantPrice {
  return {
    variant_id: String(record.variant_id ?? ""),
    price_list_id: String(record.price_list_id ?? ""),
    price: Number(record.price ?? 0),
  };
}

export function sortPriceLists(left: PriceList, right: PriceList) {
  if (left.is_catalog_only !== right.is_catalog_only) {
    return left.is_catalog_only ? -1 : 1;
  }

  if (left.sort_order !== right.sort_order) {
    return left.sort_order - right.sort_order;
  }

  return left.name.localeCompare(right.name, "tr-TR");
}

export function getPricedLists(priceLists: PriceList[]) {
  return priceLists.filter((list) => !list.is_catalog_only).sort(sortPriceLists);
}

export function getProductPriceForList(
  prices: ProductPrice[] | undefined,
  priceListId: string,
) {
  return prices?.find((entry) => entry.price_list_id === priceListId)?.price ?? 0;
}
