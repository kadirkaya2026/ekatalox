import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizePriceListName } from "@/lib/price-lists/constants";
import type { CurrencyCode } from "@/lib/products/constants";
import type { AnalyticsPeriod } from "@/lib/validators/analytics";

export interface AnalyticsProductRow {
  productId: string;
  productName: string;
  count: number;
}

export interface OrderSummaryReport {
  totalOrders: number;
  catalogOrders: number;
  totalsByCurrency: Record<CurrencyCode, number>;
}

export interface SearchQueryReportRow {
  query: string;
  searchCount: number;
  zeroResultCount: number;
}

export interface PriceListUsageRow {
  priceListId: string;
  priceListName: string;
  loginCount: number;
}

export interface AccessCodeUsageRow {
  accessCodeId: string;
  passwordCode: string;
  priceListName: string;
  loginCount: number;
}

export interface HourlyTrafficRow {
  hour: number;
  count: number;
}

export interface DayOfWeekTrafficRow {
  dayIndex: number;
  label: string;
  count: number;
}

export interface TenantAnalyticsReport {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  uniqueVisitors: number;
  topViewedProducts: AnalyticsProductRow[];
  topCartProducts: AnalyticsProductRow[];
  orderSummary: OrderSummaryReport;
  topSearchQueries: SearchQueryReportRow[];
  priceListUsage: PriceListUsageRow[];
  accessCodeUsage: AccessCodeUsageRow[];
  hourlyTraffic: HourlyTrafficRow[];
  dayOfWeekTraffic: DayOfWeekTrafficRow[];
}

const DAY_OF_WEEK_LABELS = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
] as const;

const EMPTY_ORDER_SUMMARY: OrderSummaryReport = {
  totalOrders: 0,
  catalogOrders: 0,
  totalsByCurrency: {
    TRY: 0,
    USD: 0,
    EUR: 0,
  },
};

function createEmptyHourlyTraffic(): HourlyTrafficRow[] {
  return Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
}

function createEmptyDayOfWeekTraffic(): DayOfWeekTrafficRow[] {
  return DAY_OF_WEEK_LABELS.map((label, dayIndex) => ({
    dayIndex,
    label,
    count: 0,
  }));
}

function formatIstanbulDate(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}

export function formatReportDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatReportDateRange(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return formatReportDate(startDate);
  }

  return `${formatReportDate(startDate)} – ${formatReportDate(endDate)}`;
}

function getIstanbulToday() {
  return formatIstanbulDate(new Date());
}

function shiftIstanbulDate(daysBack: number) {
  const date = new Date(Date.now() - daysBack * 86_400_000);
  return formatIstanbulDate(date);
}

export function getDateRange(period: AnalyticsPeriod) {
  const endDate = getIstanbulToday();

  if (period === "daily") {
    return { startDate: endDate, endDate };
  }

  if (period === "weekly") {
    return { startDate: shiftIstanbulDate(6), endDate };
  }

  return { startDate: shiftIstanbulDate(29), endDate };
}

function getDayOfWeekIndex(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function buildEmptyReport(period: AnalyticsPeriod): TenantAnalyticsReport {
  const { startDate, endDate } = getDateRange(period);

  return {
    period,
    startDate,
    endDate,
    uniqueVisitors: 0,
    topViewedProducts: [],
    topCartProducts: [],
    orderSummary: EMPTY_ORDER_SUMMARY,
    topSearchQueries: [],
    priceListUsage: [],
    accessCodeUsage: [],
    hourlyTraffic: createEmptyHourlyTraffic(),
    dayOfWeekTraffic: createEmptyDayOfWeekTraffic(),
  };
}

async function fetchOrderSummary(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  tenantId: string,
  startDate: string,
  endDate: string,
): Promise<OrderSummaryReport> {
  const { data } = await supabase
    .from("storefront_analytics_orders_daily")
    .select("currency, order_count, total_amount")
    .eq("tenant_id", tenantId)
    .gte("stat_date", startDate)
    .lte("stat_date", endDate);

  const summary: OrderSummaryReport = {
    totalOrders: 0,
    catalogOrders: 0,
    totalsByCurrency: { TRY: 0, USD: 0, EUR: 0 },
  };

  for (const row of data ?? []) {
    const orderCount = row.order_count ?? 0;

    if (row.currency === "CATALOG") {
      summary.catalogOrders += orderCount;
      summary.totalOrders += orderCount;
      continue;
    }

    if (row.currency === "TRY" || row.currency === "USD" || row.currency === "EUR") {
      summary.totalOrders += orderCount;
      summary.totalsByCurrency[row.currency] += Number(row.total_amount ?? 0);
    }
  }

  return summary;
}

async function fetchTopSearchQueries(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  tenantId: string,
  startDate: string,
  endDate: string,
): Promise<SearchQueryReportRow[]> {
  const { data } = await supabase
    .from("storefront_analytics_search_daily")
    .select("query_normalized, search_count, zero_result_count")
    .eq("tenant_id", tenantId)
    .gte("stat_date", startDate)
    .lte("stat_date", endDate);

  const aggregated = new Map<string, { searchCount: number; zeroResultCount: number }>();

  for (const row of data ?? []) {
    const current = aggregated.get(row.query_normalized) ?? {
      searchCount: 0,
      zeroResultCount: 0,
    };

    aggregated.set(row.query_normalized, {
      searchCount: current.searchCount + (row.search_count ?? 0),
      zeroResultCount: current.zeroResultCount + (row.zero_result_count ?? 0),
    });
  }

  return [...aggregated.entries()]
    .map(([query, stats]) => ({
      query,
      searchCount: stats.searchCount,
      zeroResultCount: stats.zeroResultCount,
    }))
    .sort((left, right) => right.searchCount - left.searchCount)
    .slice(0, 10);
}

async function fetchPriceListUsage(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  tenantId: string,
  startDate: string,
  endDate: string,
): Promise<{
  priceListUsage: PriceListUsageRow[];
  accessCodeUsage: AccessCodeUsageRow[];
}> {
  const { data } = await supabase
    .from("storefront_analytics_price_list_logins_daily")
    .select("price_list_id, access_code_id, login_count")
    .eq("tenant_id", tenantId)
    .gte("stat_date", startDate)
    .lte("stat_date", endDate);

  if (!data?.length) {
    return { priceListUsage: [], accessCodeUsage: [] };
  }

  const priceListCounts = new Map<string, number>();
  const accessCodeCounts = new Map<string, { priceListId: string; loginCount: number }>();

  for (const row of data) {
    priceListCounts.set(
      row.price_list_id,
      (priceListCounts.get(row.price_list_id) ?? 0) + (row.login_count ?? 0),
    );

    const current = accessCodeCounts.get(row.access_code_id) ?? {
      priceListId: row.price_list_id,
      loginCount: 0,
    };

    accessCodeCounts.set(row.access_code_id, {
      priceListId: row.price_list_id,
      loginCount: current.loginCount + (row.login_count ?? 0),
    });
  }

  const priceListIds = [...priceListCounts.keys()];
  const accessCodeIds = [...accessCodeCounts.keys()];

  const [{ data: priceLists }, { data: accessCodes }] = await Promise.all([
    supabase
      .from("price_lists")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .in("id", priceListIds),
    supabase
      .from("access_codes")
      .select("id, password_code, price_list_id")
      .eq("tenant_id", tenantId)
      .in("id", accessCodeIds),
  ]);

  const priceListNames = new Map(
    (priceLists ?? []).map((list) => [
      list.id as string,
      normalizePriceListName(list.name as string),
    ]),
  );
  const accessCodeRecords = new Map(
    (accessCodes ?? []).map((code) => [
      code.id as string,
      {
        passwordCode: code.password_code as string,
        priceListId: code.price_list_id as string,
      },
    ]),
  );

  const priceListUsage = [...priceListCounts.entries()]
    .map(([priceListId, loginCount]) => ({
      priceListId,
      priceListName: priceListNames.get(priceListId) ?? "Silinmiş liste",
      loginCount,
    }))
    .sort((left, right) => right.loginCount - left.loginCount);

  const accessCodeUsage = [...accessCodeCounts.entries()]
    .map(([accessCodeId, stats]) => {
      const accessCode = accessCodeRecords.get(accessCodeId);

      return {
        accessCodeId,
        passwordCode: accessCode?.passwordCode ?? "Silinmiş şifre",
        priceListName:
          priceListNames.get(accessCode?.priceListId ?? stats.priceListId) ??
          priceListNames.get(stats.priceListId) ??
          "Silinmiş liste",
        loginCount: stats.loginCount,
      };
    })
    .sort((left, right) => right.loginCount - left.loginCount);

  return { priceListUsage, accessCodeUsage };
}

async function fetchHourlyTraffic(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  tenantId: string,
  startDate: string,
  endDate: string,
): Promise<HourlyTrafficRow[]> {
  const hourly = createEmptyHourlyTraffic();

  const { data } = await supabase
    .from("storefront_analytics_traffic_hourly")
    .select("stat_hour, visit_count")
    .eq("tenant_id", tenantId)
    .gte("stat_date", startDate)
    .lte("stat_date", endDate);

  for (const row of data ?? []) {
    const hour = row.stat_hour;
    if (hour >= 0 && hour <= 23) {
      hourly[hour].count += row.visit_count ?? 0;
    }
  }

  return hourly;
}

async function fetchDayOfWeekTraffic(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  tenantId: string,
  startDate: string,
  endDate: string,
): Promise<DayOfWeekTrafficRow[]> {
  const dayOfWeek = createEmptyDayOfWeekTraffic();

  const { data } = await supabase
    .from("storefront_analytics_visitors")
    .select("stat_date")
    .eq("tenant_id", tenantId)
    .gte("stat_date", startDate)
    .lte("stat_date", endDate);

  for (const row of data ?? []) {
    const dayIndex = getDayOfWeekIndex(row.stat_date as string);
    dayOfWeek[dayIndex].count += 1;
  }

  return dayOfWeek;
}

export async function getTenantAnalyticsReport(
  tenantId: string,
  period: AnalyticsPeriod,
): Promise<TenantAnalyticsReport> {
  const { startDate, endDate } = getDateRange(period);
  const emptyReport = buildEmptyReport(period);

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return emptyReport;
  }

  const [
    visitorsResult,
    productStatsResult,
    orderSummary,
    topSearchQueries,
    loginUsage,
    hourlyTraffic,
    dayOfWeekTraffic,
  ] = await Promise.all([
    supabase
      .from("storefront_analytics_visitors")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("stat_date", startDate)
      .lte("stat_date", endDate),
    supabase
      .from("storefront_analytics_product_daily")
      .select("product_id, view_count, cart_add_count")
      .eq("tenant_id", tenantId)
      .gte("stat_date", startDate)
      .lte("stat_date", endDate),
    fetchOrderSummary(supabase, tenantId, startDate, endDate),
    fetchTopSearchQueries(supabase, tenantId, startDate, endDate),
    fetchPriceListUsage(supabase, tenantId, startDate, endDate),
    fetchHourlyTraffic(supabase, tenantId, startDate, endDate),
    fetchDayOfWeekTraffic(supabase, tenantId, startDate, endDate),
  ]);

  if (visitorsResult.error) {
    return emptyReport;
  }

  const uniqueVisitors = visitorsResult.count ?? 0;

  if (productStatsResult.error || !productStatsResult.data?.length) {
    return {
      ...emptyReport,
      uniqueVisitors,
      orderSummary,
      topSearchQueries,
      priceListUsage: loginUsage.priceListUsage,
      accessCodeUsage: loginUsage.accessCodeUsage,
      hourlyTraffic,
      dayOfWeekTraffic,
    };
  }

  const aggregated = new Map<
    string,
    { viewCount: number; cartAddCount: number }
  >();

  for (const row of productStatsResult.data) {
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
    startDate,
    endDate,
    uniqueVisitors,
    topViewedProducts,
    topCartProducts,
    orderSummary,
    topSearchQueries,
    priceListUsage: loginUsage.priceListUsage,
    accessCodeUsage: loginUsage.accessCodeUsage,
    hourlyTraffic,
    dayOfWeekTraffic,
  };
}
