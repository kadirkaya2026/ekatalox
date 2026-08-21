import { getProductPriceForList } from "@/lib/price-lists/records";
import { buildProductPricesFormPayload } from "@/lib/products/form-prices";
import { sanitizePrice } from "@/lib/products/parse-price-input";
import type { PriceList, Product, ProductVariant } from "@/lib/types";

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

export function buildVariantListPriceFormState(
  priceLists: PriceList[],
  variant?: Pick<ProductVariant, "prices">,
): Record<string, string> {
  const pricedLists = priceLists.filter((list) => !list.is_catalog_only);

  return Object.fromEntries(
    pricedLists.map((list) => {
      const variantPrice = variant?.prices?.find((entry) => entry.price_list_id === list.id);

      return [list.id, typeof variantPrice?.price === "number" ? String(variantPrice.price) : ""];
    }),
  );
}

// Her fiyat listesinin kendi indirimli fiyatı gönderilir; boş bırakılan
// listede indirim yoktur (kullanıcı isteği, 21 Ağu 2026).
export function appendProductPricesToFormData(
  formData: FormData,
  listPrices: Record<string, string>,
  listDiscounts?: Record<string, string>,
  discountsEnabled = true,
) {
  formData.set(
    "prices",
    buildProductPricesFormPayload(
      Object.entries(listPrices).map(([price_list_id, price]) => ({
        price_list_id,
        price,
        discount_price: discountsEnabled ? (listDiscounts?.[price_list_id] ?? null) : null,
      })),
    ),
  );
}

// Düzenleme formunu açarken mevcut liste indirimlerini doldurur.
export function buildListDiscountFormState(
  priceLists: Array<{ id: string; is_catalog_only?: boolean }>,
  product?: { prices?: Array<{ price_list_id: string; discount_price?: number | null }> },
): Record<string, string> {
  return Object.fromEntries(
    priceLists.map((list) => {
      const entry = product?.prices?.find((price) => price.price_list_id === list.id);
      return [
        list.id,
        typeof entry?.discount_price === "number" ? String(entry.discount_price) : "",
      ];
    }),
  );
}

export function getMinPriceFromFormState(listPrices: Record<string, string>) {
  const values = Object.values(listPrices).map((value) => sanitizePrice(value || 0));
  return values.length ? Math.min(...values) : 0;
}
