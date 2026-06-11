import { sanitizePrice } from "@/lib/products/parse-price-input";
import type { ProductPrice } from "@/lib/types";

export function parseProductPricesFromFormData(formData: FormData): ProductPrice[] {
  const raw = formData.get("prices");

  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as Array<{ price_list_id?: string; price?: number | string }>;

      return parsed
        .filter((entry) => typeof entry.price_list_id === "string")
        .map((entry) => ({
          product_id: "",
          price_list_id: entry.price_list_id!,
          price: sanitizePrice(entry.price ?? 0),
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
  prices: Array<{ price_list_id: string; price: number | string }>,
) {
  return JSON.stringify(
    prices.map((entry) => ({
      price_list_id: entry.price_list_id,
      price: sanitizePrice(entry.price ?? 0),
    })),
  );
}
