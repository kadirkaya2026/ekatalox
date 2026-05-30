import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AnalyticsPeriod } from "@/lib/validators/analytics";

export interface AnalyticsProductRow {
  productId: string;
  productName: string;
  count: number;
}

export interface TenantAnalyticsReport {
  period: AnalyticsPeriod;
  uniqueVisitors: number;
  topViewedProducts: AnalyticsProductRow[];
  topCartProducts: AnalyticsProductRow[];
}

function formatIstanbulDate(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}

function getIstanbulToday() {
  return formatIstanbulDate(new Date());
}

function shiftIstanbulDate(daysBack: number) {
  const date = new Date(Date.now() - daysBack * 86_400_000);
  return formatIstanbulDate(date);
}

function getDateRange(period: AnalyticsPeriod) {
  const endDate = getIstanbulToday();

  if (period === "daily") {
    return { startDate: endDate, endDate };
  }

  if (period === "weekly") {
    return { startDate: shiftIstanbulDate(6), endDate };
  }

  return { startDate: shiftIstanbulDate(29), endDate };
}

export async function getTenantAnalyticsReport(
  tenantId: string,
  period: AnalyticsPeriod,
): Promise<TenantAnalyticsReport> {
  const emptyReport: TenantAnalyticsReport = {
    period,
    uniqueVisitors: 0,
    topViewedProducts: [],
    topCartProducts: [],
  };

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return emptyReport;
  }

  const { startDate, endDate } = getDateRange(period);

  const { count: uniqueVisitors, error: visitorsError } = await supabase
    .from("storefront_analytics_visitors")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("stat_date", startDate)
    .lte("stat_date", endDate);

  if (visitorsError) {
    return emptyReport;
  }

  const { data: productStats, error: productStatsError } = await supabase
    .from("storefront_analytics_product_daily")
    .select("product_id, view_count, cart_add_count")
    .eq("tenant_id", tenantId)
    .gte("stat_date", startDate)
    .lte("stat_date", endDate);

  if (productStatsError || !productStats?.length) {
    return {
      ...emptyReport,
      uniqueVisitors: uniqueVisitors ?? 0,
    };
  }

  const aggregated = new Map<
    string,
    { viewCount: number; cartAddCount: number }
  >();

  for (const row of productStats) {
    const current = aggregated.get(row.product_id) ?? {
      viewCount: 0,
      cartAddCount: 0,
    };

    aggregated.set(row.product_id, {
      viewCount: current.viewCount + (row.view_count ?? 0),
      cartAddCount: current.cartAddCount + (row.cart_add_count ?? 0),
    });
  }

  const productIds = [...aggregated.keys()];

  const { data: products } = await supabase
    .from("products")
    .select("id, product_name")
    .eq("tenant_id", tenantId)
    .in("id", productIds);

  const productNames = new Map(
    (products ?? []).map((product) => [
      product.id as string,
      product.product_name as string,
    ]),
  );

  const topViewedProducts = [...aggregated.entries()]
    .map(([productId, stats]) => ({
      productId,
      productName: productNames.get(productId) ?? "Silinmiş ürün",
      count: stats.viewCount,
    }))
    .filter((row) => row.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);

  const topCartProducts = [...aggregated.entries()]
    .map(([productId, stats]) => ({
      productId,
      productName: productNames.get(productId) ?? "Silinmiş ürün",
      count: stats.cartAddCount,
    }))
    .filter((row) => row.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);

  return {
    period,
    uniqueVisitors: uniqueVisitors ?? 0,
    topViewedProducts,
    topCartProducts,
  };
}
