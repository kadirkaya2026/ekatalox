import { randomUUID } from "node:crypto";
import {
  CATALOG_ONLY_PRICE_LIST_NAME,
  DEFAULT_PRICED_LIST_NAMES,
} from "@/lib/price-lists/constants";
import {
  getPricedLists,
  normalizePriceListRecord,
  sortPriceLists,
} from "@/lib/price-lists/records";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PriceList } from "@/lib/types";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export async function fetchTenantPriceLists(
  supabase: AdminClient,
  tenantId: string,
): Promise<PriceList[]> {
  const { data, error } = await supabase
    .from("price_lists")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as Array<Record<string, unknown>>)
    .map(normalizePriceListRecord)
    .sort(sortPriceLists);
}

export async function ensureDefaultPriceListsForTenant(
  supabase: AdminClient,
  tenantId: string,
): Promise<PriceList[]> {
  const existing = await fetchTenantPriceLists(supabase, tenantId);

  if (existing.length > 0) {
    return existing;
  }

  const rows = [
    {
      id: randomUUID(),
      tenant_id: tenantId,
      name: CATALOG_ONLY_PRICE_LIST_NAME,
      is_catalog_only: true,
      sort_order: 0,
    },
    ...DEFAULT_PRICED_LIST_NAMES.map((name, index) => ({
      id: randomUUID(),
      tenant_id: tenantId,
      name,
      is_catalog_only: false,
      sort_order: index + 1,
    })),
  ];

  const { data, error } = await supabase.from("price_lists").insert(rows).select("*");

  if (error || !data) {
    return [];
  }

  return (data as Array<Record<string, unknown>>)
    .map(normalizePriceListRecord)
    .sort(sortPriceLists);
}

export function countPricedLists(priceLists: PriceList[]) {
  return getPricedLists(priceLists).length;
}

export async function upsertProductPrices(
  supabase: AdminClient,
  productId: string,
  prices: Array<{ price_list_id: string; price: number }>,
) {
  if (!prices.length) {
    return;
  }

  await supabase.from("product_prices").upsert(
    prices.map((entry) => ({
      product_id: productId,
      price_list_id: entry.price_list_id,
      price: entry.price,
    })),
    { onConflict: "product_id,price_list_id" },
  );
}

export async function deleteProductPricesForLists(
  supabase: AdminClient,
  productId: string,
  priceListIds: string[],
) {
  if (!priceListIds.length) {
    return;
  }

  await supabase
    .from("product_prices")
    .delete()
    .eq("product_id", productId)
    .in("price_list_id", priceListIds);
}
