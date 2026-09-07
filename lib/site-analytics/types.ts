// Pazarlama sitesi ziyaretçi analitiği — paylaşılan tipler (sunucu + istemci).

export type SiteAnalyticsBucket = "day" | "week" | "month";

export interface SiteAnalyticsRange {
  /** İstanbul günü, ISO "YYYY-MM-DD" (dahil). */
  from: string;
  /** İstanbul günü, ISO "YYYY-MM-DD" (dahil). */
  to: string;
  bucket: SiteAnalyticsBucket;
}

export interface SiteAnalyticsSummary {
  visitors: number;
  newVisitors: number;
  sessions: number;
  pageviews: number;
  clicks: number;
  avgDurationMs: number;
  bounceRatePct: number | null;
  pagesPerSession: number;
}

export interface SiteAnalyticsSeriesPoint {
  bucketStart: string;
  visitors: number;
  sessions: number;
  pageviews: number;
  avgDurationMs: number;
}

export interface SiteAnalyticsPageRow {
  path: string;
  pageviews: number;
  visitors: number;
  avgTimeMs: number;
  avgScrollPct: number;
  entries: number;
  exits: number;
  clicks: number;
  /** exits / pageviews */
  exitRatePct: number;
}

export interface SiteAnalyticsReferrerRow {
  source: string;
  sessions: number;
  visitors: number;
}

export interface SiteAnalyticsClickRow {
  path: string;
  targetText: string;
  targetHref: string | null;
  clicks: number;
  visitors: number;
}

export interface SiteAnalyticsBreakdownRow {
  label: string;
  sessions: number;
  visitors: number;
}

export interface SiteAnalyticsVisitorRow {
  visitorId: string;
  visitorKey: string;
  firstSeenAt: string;
  lastSeenAt: string;
  sessions: number;
  pageviews: number;
  clicks: number;
  totalDurationMs: number;
  lastEntryPath: string | null;
  lastExitPath: string | null;
  lastSource: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  note: string | null;
}

export interface SiteAnalyticsVisitorPage {
  rows: SiteAnalyticsVisitorRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface SiteAnalyticsReport {
  range: SiteAnalyticsRange;
  summary: SiteAnalyticsSummary;
  series: SiteAnalyticsSeriesPoint[];
  pages: SiteAnalyticsPageRow[];
  referrers: SiteAnalyticsReferrerRow[];
  clicks: SiteAnalyticsClickRow[];
  devices: SiteAnalyticsBreakdownRow[];
  countries: SiteAnalyticsBreakdownRow[];
  cities: SiteAnalyticsBreakdownRow[];
  browsers: SiteAnalyticsBreakdownRow[];
  visitors: SiteAnalyticsVisitorPage;
}

export interface SiteSessionEvent {
  id: number;
  eventType: "pageview" | "click" | "leave";
  path: string;
  pageTitle: string | null;
  targetText: string | null;
  targetHref: string | null;
  targetTag: string | null;
  scrollPct: number | null;
  timeOnPageMs: number | null;
  createdAt: string;
}

export interface SiteSessionDetail {
  id: string;
  startedAt: string;
  lastSeenAt: string;
  durationMs: number;
  pageviewCount: number;
  clickCount: number;
  entryPath: string | null;
  exitPath: string | null;
  referrer: string | null;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  screen: string | null;
  country: string | null;
  city: string | null;
  events: SiteSessionEvent[];
}

export interface SiteVisitorDetail {
  id: string;
  visitorKey: string;
  firstSeenAt: string;
  lastSeenAt: string;
  sessionCount: number;
  pageviewCount: number;
  firstLandingPath: string | null;
  firstReferrerHost: string | null;
  lastCountry: string | null;
  lastCity: string | null;
  lastDevice: string | null;
  lastBrowser: string | null;
  lastOs: string | null;
  note: string | null;
  sessions: SiteSessionDetail[];
}
