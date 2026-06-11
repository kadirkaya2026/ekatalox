import type { SupabaseClient } from "@supabase/supabase-js";
import type { CurrencyCode } from "@/lib/products/constants";

export async function recordStorefrontOrderStat(
  supabase: SupabaseClient,
  tenantId: string,
  params:
    | { catalogMode: true }
    | { catalogMode: false; currency: CurrencyCode; totalAmount: number },
) {
  await supabase.rpc("record_storefront_order_stat", {
    p_tenant_id: tenantId,
    p_currency: params.catalogMode ? "CATALOG" : params.currency,
    p_total_amount: params.catalogMode ? 0 : params.totalAmount,
    p_is_catalog: params.catalogMode,
  });
}

export async function recordStorefrontPriceListLogin(
  supabase: SupabaseClient,
  tenantId: string,
  priceListId: string,
  accessCodeId: string,
) {
  await supabase.rpc("record_storefront_price_list_login", {
    p_tenant_id: tenantId,
    p_price_list_id: priceListId,
    p_access_code_id: accessCodeId,
  });
}

export async function recordStorefrontPresence(
  supabase: SupabaseClient,
  tenantId: string,
  visitorKey: string,
  priceListId: string,
) {
  return supabase.rpc("record_storefront_presence", {
    p_tenant_id: tenantId,
    p_visitor_key: visitorKey,
    p_price_list_id: priceListId,
  });
}

export async function recordStorefrontSearchStat(
  supabase: SupabaseClient,
  tenantId: string,
  query: string,
  zeroResults: boolean,
) {
  return supabase.rpc("record_storefront_search_stat", {
    p_tenant_id: tenantId,
    p_query: query,
    p_zero_results: zeroResults,
  });
}
