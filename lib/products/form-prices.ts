import { sanitizePrice } from "@/lib/products/parse-price-input";
import type { ProductPrice } from "@/lib/types";

export function parseProductPricesFromFormData(formData: FormData): ProductPrice[] {
  const raw = formData.get("prices");

  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as Array<{
        price_list_id?: string;
        price?: number | string;
        discount_price?: number | string | null;
      }>;

      return parsed
        .filter((entry) => typeof entry.price_list_id === "string")
        .map((entry) => ({
          product_id: "",
          price_list_id: entry.price_list_id!,
          price: sanitizePrice(entry.price ?? 0),
          // Boş bırakılan indirim alanı "bu listede indirim yok" demek —
          // 0 ile karıştırılmamalı, o yüzden null'a çevriliyor.
          discount_price:
            entry.discount_price === null ||
            entry.discount_price === undefined ||
            String(entry.discount_price).trim() === ""
              ? null
              : sanitizePrice(entry.discount_price),
        }));
    } catch {
      return [];
    }
  }

  const prices: ProductPrice[] = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("price_")) {
      continue;
    }

    const priceListId = key.slice("price_".length);

    if (!priceListId) {
      continue;
    }

    prices.push({
      product_id: "",
      price_list_id: priceListId,
      price: sanitizePrice(String(value).trim() || 0),
    });
  }

  return prices;
}

export function buildProductPricesFormPayload(
  prices: Array<{
    price_list_id: string;
    price: number | string;
    discount_price?: number | string | null;
  }>,
) {
  return JSON.stringify(
    prices.map((entry) => ({
      price_list_id: entry.price_list_id,
      price: sanitizePrice(entry.price ?? 0),
      discount_price:
        entry.discount_price === null ||
        entry.discount_price === undefined ||
        String(entry.discount_price).trim() === ""
          ? null
          : sanitizePrice(entry.discount_price),
    })),
  );
}
