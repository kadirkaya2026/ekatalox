import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizePriceListName } from "@/lib/price-lists/constants";

/** A visitor counts as "online" if active within this window. */
export const ONLINE_WINDOW_MS = 2 * 60 * 1000;

export interface OnlinePriceListRow {
  priceListId: string;
  priceListName: string;
  onlineCount: number;
}

export interface TenantPresenceReport {
  total: number;
  rows: OnlinePriceListRow[];
  generatedAt: string;
}

function emptyPresenceReport(): TenantPresenceReport {
  return { total: 0, rows: [], generatedAt: new Date().toISOString() };
}

export async function getTenantOnlinePresence(
  tenantId: string,
): Promise<TenantPresenceReport> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return emptyPresenceReport();
  }

  const threshold = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();

  // Each (tenant, visitor) is one row, so a visitor is counted at most once.
  // Only logged-in visitors are tracked (price_list_id not null).
  const { data: presence } = await supabase
    .from("storefront_presence")
    .select("price_list_id")
    .eq("tenant_id", tenantId)
    .gte("last_seen_at", threshold)
    .not("price_list_id", "is", null);

  const counts = new Map<string, number>();
  for (const row of presence ?? []) {
    const priceListId = row.price_list_id as string;
    counts.set(priceListId, (counts.get(priceListId) ?? 0) + 1);
  }

  // List every price list (even with 0 online) so the tenant sees each row.
  const { data: priceLists } = await supabase
    .from("price_lists")
    .select("id, name, sort_order")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });

  const rows: OnlinePriceListRow[] = (priceLists ?? []).map((list) => ({
    priceListId: list.id as string,
    priceListName: normalizePriceListName(list.name as string),
    onlineCount: counts.get(list.id as string) ?? 0,
  }));

  const total = rows.reduce((sum, row) => sum + row.onlineCount, 0);

  return {
    total,
    rows,
    generatedAt: new Date().toISOString(),
  };
}
