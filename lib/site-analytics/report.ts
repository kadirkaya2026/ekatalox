// Süper admin ziyaretçi raporu — 0112 migration'ındaki RPC'leri çağırır.
// Tüm sorgular service role ile (admin client); anon erişim yok.
import type { SupabaseClient } from "@supabase/supabase-js";
import { diffDays, enumerateBuckets, shiftIsoDate } from "@/lib/dates/istanbul";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  SiteAnalyticsBreakdownRow,
  SiteAnalyticsBucket,
  SiteAnalyticsClickRow,
  SiteAnalyticsPageRow,
  SiteAnalyticsRange,
  SiteAnalyticsReferrerRow,
  SiteAnalyticsReport,
  SiteAnalyticsSeriesPoint,
  SiteAnalyticsSummary,
  SiteAnalyticsVisitorPage,
  SiteAnalyticsVisitorRow,
  SiteSessionDetail,
  SiteSessionEvent,
  SiteVisitorDetail,
} from "@/lib/site-analytics/types";

/** İstanbul günü → [from 00:00, to+1 00:00) timestamptz sınırları (TR sabit UTC+3). */
export function rangeBounds(from: string, to: string) {
  return {
    fromTs: `${from}T00:00:00+03:00`,
    toTs: `${shiftIsoDate(to, 1)}T00:00:00+03:00`,
  };
}

export function autoSiteBucket(from: string, to: string): SiteAnalyticsBucket {
  const days = diffDays(from, to) + 1;
  if (days <= 62) return "day";
  if (days <= 366) return "week";
  return "month";
}

const EMPTY_SUMMARY: SiteAnalyticsSummary = {
  visitors: 0,
  newVisitors: 0,
  sessions: 0,
  pageviews: 0,
  clicks: 0,
  avgDurationMs: 0,
  bounceRatePct: null,
  pagesPerSession: 0,
};

function emptyReport(range: SiteAnalyticsRange): SiteAnalyticsReport {
  return {
    range,
    summary: EMPTY_SUMMARY,
    series: enumerateBuckets(range.from, range.to, range.bucket).map((bucketStart) => ({
      bucketStart,
      visitors: 0,
      sessions: 0,
      pageviews: 0,
      avgDurationMs: 0,
    })),
    pages: [],
    referrers: [],
    clicks: [],
    devices: [],
    countries: [],
    cities: [],
    browsers: [],
    visitors: { rows: [], total: 0, limit: 50, offset: 0 },
  };
}

type Rpc = SupabaseClient["rpc"];

async function rpcRows<T>(rpc: Rpc, fn: string, args: Record<string, unknown>): Promise<T[]> {
  const { data, error } = await rpc(fn, args);
  if (error) {
    console.error(`[site-analytics] ${fn} hata:`, error.message);
    return [];
  }
  return (data ?? []) as T[];
}

function mapBreakdown(rows: Array<{ label: string; sessions: number; visitors: number }>): SiteAnalyticsBreakdownRow[] {
  return rows.map((r) => ({ label: r.label, sessions: r.sessions, visitors: r.visitors }));
}

function mapVisitorRows(rows: Array<Record<string, unknown>>): SiteAnalyticsVisitorRow[] {
  return rows.map((r) => ({
    visitorId: String(r.visitor_id),
    visitorKey: String(r.visitor_key),
    firstSeenAt: String(r.first_seen_at),
    lastSeenAt: String(r.last_seen_at),
    sessions: Number(r.sessions ?? 0),
    pageviews: Number(r.pageviews ?? 0),
    clicks: Number(r.clicks ?? 0),
    totalDurationMs: Number(r.total_duration_ms ?? 0),
    lastEntryPath: (r.last_entry_path as string | null) ?? null,
    lastExitPath: (r.last_exit_path as string | null) ?? null,
    lastSource: (r.last_source as string | null) ?? null,
    country: (r.country as string | null) ?? null,
    city: (r.city as string | null) ?? null,
    device: (r.device as string | null) ?? null,
    browser: (r.browser as string | null) ?? null,
    os: (r.os as string | null) ?? null,
    note: (r.note as string | null) ?? null,
  }));
}

export async function getSiteAnalyticsVisitors(
  range: Pick<SiteAnalyticsRange, "from" | "to">,
  limit = 50,
  offset = 0,
): Promise<SiteAnalyticsVisitorPage> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { rows: [], total: 0, limit, offset };

  const { fromTs, toTs } = rangeBounds(range.from, range.to);
  const rows = await rpcRows<Record<string, unknown>>(supabase.rpc.bind(supabase), "site_analytics_visitors", {
    p_from: fromTs,
    p_to: toTs,
    p_limit: limit,
    p_offset: offset,
  });

  return {
    rows: mapVisitorRows(rows),
    total: rows.length ? Number(rows[0].total_count ?? 0) : 0,
    limit,
    offset,
  };
}

export async function getSiteAnalyticsReport(range: SiteAnalyticsRange): Promise<SiteAnalyticsReport> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return emptyReport(range);

  const { fromTs, toTs } = rangeBounds(range.from, range.to);
  const rpc = supabase.rpc.bind(supabase);
  const base = { p_from: fromTs, p_to: toTs };

  const [summaryRes, seriesRows, pageRows, referrerRows, clickRows, devices, countries, cities, browsers, visitors] =
    await Promise.all([
      rpc("site_analytics_summary", base),
      rpcRows<{ bucket_start: string; visitors: number; sessions: number; pageviews: number; avg_duration_ms: number }>(
        rpc,
        "site_analytics_timeseries",
        { ...base, p_bucket: range.bucket },
      ),
      rpcRows<{
        path: string;
        pageviews: number;
        visitors: number;
        avg_time_ms: number;
        avg_scroll_pct: number;
        entries: number;
        exits: number;
        clicks: number;
      }>(rpc, "site_analytics_pages", base),
      rpcRows<{ source: string; sessions: number; visitors: number }>(rpc, "site_analytics_referrers", base),
      rpcRows<{ path: string; target_text: string; target_href: string | null; clicks: number; visitors: number }>(
        rpc,
        "site_analytics_clicks",
        base,
      ),
      rpcRows<{ label: string; sessions: number; visitors: number }>(rpc, "site_analytics_breakdown", { ...base, p_dimension: "device" }),
      rpcRows<{ label: string; sessions: number; visitors: number }>(rpc, "site_analytics_breakdown", { ...base, p_dimension: "country" }),
      rpcRows<{ label: string; sessions: number; visitors: number }>(rpc, "site_analytics_breakdown", { ...base, p_dimension: "city" }),
      rpcRows<{ label: string; sessions: number; visitors: number }>(rpc, "site_analytics_breakdown", { ...base, p_dimension: "browser" }),
      getSiteAnalyticsVisitors(range, 50, 0),
    ]);

  const summaryData = (summaryRes.data ?? null) as Partial<SiteAnalyticsSummary> | null;
  if (summaryRes.error) {
    console.error("[site-analytics] site_analytics_summary hata:", summaryRes.error.message);
  }
  const summary: SiteAnalyticsSummary = {
    ...EMPTY_SUMMARY,
    ...(summaryData ?? {}),
    bounceRatePct:
      summaryData?.bounceRatePct === null || summaryData?.bounceRatePct === undefined
        ? null
        : Number(summaryData.bounceRatePct),
    pagesPerSession: Number(summaryData?.pagesPerSession ?? 0),
  };

  // Boş dönemler de grafikte görünsün diye bucket'ları doldur.
  const byBucket = new Map(seriesRows.map((r) => [r.bucket_start, r]));
  const series: SiteAnalyticsSeriesPoint[] = enumerateBuckets(range.from, range.to, range.bucket).map((bucketStart) => {
    const r = byBucket.get(bucketStart);
    return {
      bucketStart,
      visitors: r?.visitors ?? 0,
      sessions: r?.sessions ?? 0,
      pageviews: r?.pageviews ?? 0,
      avgDurationMs: r?.avg_duration_ms ?? 0,
    };
  });

  const pages: SiteAnalyticsPageRow[] = pageRows.map((r) => ({
    path: r.path,
    pageviews: r.pageviews,
    visitors: r.visitors,
    avgTimeMs: r.avg_time_ms,
    avgScrollPct: r.avg_scroll_pct,
    entries: r.entries,
    exits: r.exits,
    clicks: r.clicks,
    exitRatePct: r.pageviews > 0 ? Math.round((r.exits / r.pageviews) * 1000) / 10 : 0,
  }));

  const referrers: SiteAnalyticsReferrerRow[] = referrerRows.map((r) => ({
    source: r.source,
    sessions: r.sessions,
    visitors: r.visitors,
  }));

  const clicks: SiteAnalyticsClickRow[] = clickRows.map((r) => ({
    path: r.path,
    targetText: r.target_text,
    targetHref: r.target_href,
    clicks: r.clicks,
    visitors: r.visitors,
  }));

  return {
    range,
    summary,
    series,
    pages,
    referrers,
    clicks,
    devices: mapBreakdown(devices),
    countries: mapBreakdown(countries),
    cities: mapBreakdown(cities),
    browsers: mapBreakdown(browsers),
    visitors,
  };
}

export async function getSiteVisitorDetail(visitorId: string): Promise<SiteVisitorDetail | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data: visitor, error } = await supabase
    .from("site_visitors")
    .select(
      "id, visitor_key, first_seen_at, last_seen_at, session_count, pageview_count, first_landing_path, first_referrer_host, last_country, last_city, last_device, last_browser, last_os, note",
    )
    .eq("id", visitorId)
    .maybeSingle();

  if (error || !visitor) return null;

  const { data: sessions } = await supabase
    .from("site_sessions")
    .select(
      "id, started_at, last_seen_at, duration_ms, pageview_count, click_count, entry_path, exit_path, referrer, referrer_host, utm_source, utm_medium, utm_campaign, device, browser, os, screen, country, city",
    )
    .eq("visitor_id", visitorId)
    .order("started_at", { ascending: false })
    .limit(50);

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: events } = sessionIds.length
    ? await supabase
        .from("site_events")
        .select("id, session_id, event_type, path, page_title, target_text, target_href, target_tag, scroll_pct, time_on_page_ms, created_at")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: true })
        .limit(2000)
    : { data: [] as Array<Record<string, unknown>> };

  const eventsBySession = new Map<string, SiteSessionEvent[]>();
  for (const e of (events ?? []) as Array<Record<string, unknown>>) {
    const list = eventsBySession.get(String(e.session_id)) ?? [];
    list.push({
      id: Number(e.id),
      eventType: e.event_type as SiteSessionEvent["eventType"],
      path: String(e.path),
      pageTitle: (e.page_title as string | null) ?? null,
      targetText: (e.target_text as string | null) ?? null,
      targetHref: (e.target_href as string | null) ?? null,
      targetTag: (e.target_tag as string | null) ?? null,
      scrollPct: e.scroll_pct === null || e.scroll_pct === undefined ? null : Number(e.scroll_pct),
      timeOnPageMs: e.time_on_page_ms === null || e.time_on_page_ms === undefined ? null : Number(e.time_on_page_ms),
      createdAt: String(e.created_at),
    });
    eventsBySession.set(String(e.session_id), list);
  }

  const sessionDetails: SiteSessionDetail[] = (sessions ?? []).map((s) => ({
    id: s.id,
    startedAt: s.started_at,
    lastSeenAt: s.last_seen_at,
    durationMs: s.duration_ms,
    pageviewCount: s.pageview_count,
    clickCount: s.click_count,
    entryPath: s.entry_path,
    exitPath: s.exit_path,
    referrer: s.referrer,
    referrerHost: s.referrer_host,
    utmSource: s.utm_source,
    utmMedium: s.utm_medium,
    utmCampaign: s.utm_campaign,
    device: s.device,
    browser: s.browser,
    os: s.os,
    screen: s.screen,
    country: s.country,
    city: s.city,
    events: eventsBySession.get(s.id) ?? [],
  }));

  return {
    id: visitor.id,
    visitorKey: visitor.visitor_key,
    firstSeenAt: visitor.first_seen_at,
    lastSeenAt: visitor.last_seen_at,
    sessionCount: visitor.session_count,
    pageviewCount: visitor.pageview_count,
    firstLandingPath: visitor.first_landing_path,
    firstReferrerHost: visitor.first_referrer_host,
    lastCountry: visitor.last_country,
    lastCity: visitor.last_city,
    lastDevice: visitor.last_device,
    lastBrowser: visitor.last_browser,
    lastOs: visitor.last_os,
    note: visitor.note,
    sessions: sessionDetails,
  };
}
