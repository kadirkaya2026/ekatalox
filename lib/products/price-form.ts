import { getProductPriceForList } from "@/lib/price-lists/records";
import { buildProductPricesFormPayload } from "@/lib/products/form-prices";
import { sanitizePrice } from "@/lib/products/parse-price-input";
import type { PriceList, Product } from "@/lib/types";

export function buildListPriceFormState(
  priceLists: PriceList[],
  product?: Product,
): Record<string, string> {
  const pricedLists = priceLists.filter((list) => !list.is_catalog_only);

  return Object.fromEntries(
    pricedLists.map((list) => [
      list.id,
      String(getProductPriceForList(product?.prices, list.id)),
    ]),
  );
}

export function appendProductPricesToFormData(
  formData: FormData,
  listPrices: Record<string, string>,
) {
  formData.set(
    "prices",
    buildProductPricesFormPayload(
      Object.entries(listPrices).map(([price_list_id, price]) => ({
        price_list_id,
        price,
      })),
    ),
  );
}

export function getMinPriceFromFormState(listPrices: Record<string, string>) {
  const values = Object.values(listPrices).map((value) => sanitizePrice(value || 0));
  return values.length ? Math.min(...values) : 0;
}
