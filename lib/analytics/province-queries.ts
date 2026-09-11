import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDateRange } from "@/lib/analytics/queries";
import { normalizePriceListName } from "@/lib/price-lists/constants";
import {
  isForeignCode,
  provinceLabel,
  TR_PROVINCES,
  UNKNOWN_PROVINCE_LABEL,
} from "@/lib/analytics/provinces";
import type { AnalyticsPeriod } from "@/lib/validators/analytics";

export interface VisitorProvinceRow {
  code: string;
  label: string;
  visitors: number;
  sharePct: number;
}

export interface VisitorAccessRow {
  key: string;
  passwordCode: string;
  priceListName: string;
  visitors: number;
  sharePct: number;
}

export interface VisitorEntryRow {
  visitorKey: string;
  seenAt: string;
  statDate: string;
  /** false → saat geri doldurmadan geliyor, yalnız tarih göster. */
  timeKnown: boolean;
  provinceLabel: string;
  passwordCode: string;
  priceListName: string;
}

const NO_PASSWORD_LABEL = "Şifresiz giriş";
// Şifre kapısı açık ve magnet girişi kapalıysa kodsuz satır ancak eski
// (0117 öncesi) oturum çerezinden gelebilir; "şifresiz" demek yanıltır.
const PASSWORD_NOT_RECORDED_LABEL = "Şifre kaydedilmedi";
const UNKNOWN_LIST_LABEL = "Bilinmiyor";

export interface VisitorReportTenantFlags {
  isPasswordProtected: boolean;
  magnetLoginEnabled: boolean;
}

export interface VisitorProvinceReport {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  totalVisitors: number;
  knownVisitors: number;
  foreignVisitors: number;
  unknownVisitors: number;
  provinces: VisitorProvinceRow[];
  foreign: VisitorProvinceRow[];
  /** Şifre + liste bazında benzersiz ziyaretçi (0117). */
  accessBreakdown: VisitorAccessRow[];
  /** Son girişler, en yeni üstte (0117). */
  entries: VisitorEntryRow[];
  /** RPC henüz yoksa (migration uygulanmamış) true. */
  unavailable: boolean;
}

function emptyReport(period: AnalyticsPeriod, unavailable = false): VisitorProvinceReport {
  const { startDate, endDate } = getDateRange(period);
  return {
    period,
    startDate,
    endDate,
    totalVisitors: 0,
    knownVisitors: 0,
    foreignVisitors: 0,
    unknownVisitors: 0,
    provinces: [],
    foreign: [],
    accessBreakdown: [],
    entries: [],
    unavailable,
  };
}

type Supabase = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

/** Şifre/liste kimliklerini ada çevirir; silinmişler için etiket üretir. */
async function resolveAccessNames(
  supabase: Supabase,
  tenantId: string,
  priceListIds: string[],
  accessCodeIds: string[],
  flags: VisitorReportTenantFlags,
) {
  const missingCodeLabel =
    flags.isPasswordProtected && !flags.magnetLoginEnabled
      ? PASSWORD_NOT_RECORDED_LABEL
      : NO_PASSWORD_LABEL;
  const [{ data: priceLists }, { data: accessCodes }] = await Promise.all([
    priceListIds.length
      ? supabase.from("price_lists").select("id, name").eq("tenant_id", tenantId).in("id", priceListIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    accessCodeIds.length
      ? supabase.from("access_codes").select("id, password_code").eq("tenant_id", tenantId).in("id", accessCodeIds)
      : Promise.resolve({ data: [] as Array<{ id: string; password_code: string }> }),
  ]);

  const listNames = new Map(
    (priceLists ?? []).map((row) => [row.id as string, normalizePriceListName(row.name as string)]),
  );
  const codeNames = new Map(
    (accessCodes ?? []).map((row) => [row.id as string, row.password_code as string]),
  );

  return {
    listName: (id: string | null) =>
      id ? (listNames.get(id) ?? "Silinmiş liste") : UNKNOWN_LIST_LABEL,
    // Liste de yoksa giriş bilgisi hiç kaydedilmemiştir (0117 öncesi satır).
    codeName: (id: string | null, priceListId: string | null) =>
      id
        ? (codeNames.get(id) ?? "Silinmiş şifre")
        : priceListId
          ? missingCodeLabel
          : UNKNOWN_LIST_LABEL,
  };
}

/** 0117 RPC'leri; migration yoksa boş döner, sayfa yine çalışır. */
async function fetchAccessDetails(
  supabase: Supabase,
  tenantId: string,
  startDate: string,
  endDate: string,
  totalVisitors: number,
  flags: VisitorReportTenantFlags,
): Promise<Pick<VisitorProvinceReport, "accessBreakdown" | "entries">> {
  const [breakdownRes, entriesRes] = await Promise.all([
    supabase.rpc("storefront_visitor_access_breakdown", {
      p_tenant_id: tenantId,
      p_start_date: startDate,
      p_end_date: endDate,
    }),
    supabase.rpc("storefront_visitor_entries", {
      p_tenant_id: tenantId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_limit: 300,
    }),
  ]);

  if (breakdownRes.error || entriesRes.error) {
    const message = breakdownRes.error?.message ?? entriesRes.error?.message;
    console.error("[reports/iller] şifre/liste RPC hata:", message);
    return { accessBreakdown: [], entries: [] };
  }

  const breakdownRows = (breakdownRes.data ?? []) as Array<{
    price_list_id: string | null;
    access_code_id: string | null;
    visitor_count: number;
  }>;
  const entryRows = (entriesRes.data ?? []) as Array<{
    visitor_key: string;
    stat_date: string;
    first_seen_at: string;
    province_code: string | null;
    price_list_id: string | null;
    access_code_id: string | null;
  }>;

  const priceListIds = new Set<string>();
  const accessCodeIds = new Set<string>();
  for (const row of [...breakdownRows, ...entryRows]) {
    if (row.price_list_id) priceListIds.add(row.price_list_id);
    if (row.access_code_id) accessCodeIds.add(row.access_code_id);
  }

  const names = await resolveAccessNames(
    supabase,
    tenantId,
    [...priceListIds],
    [...accessCodeIds],
    flags,
  );

  // 0117 geri doldurması: eski satırların first_seen_at değeri migration anı,
  // hepsi aynı mikrosaniye. Gerçek ziyaretler pratikte çakışmaz; 3+ satırın
  // paylaştığı zaman damgası sahte sayılır ve saat gösterilmez.
  const seenAtCounts = new Map<string, number>();
  for (const row of entryRows) {
    seenAtCounts.set(row.first_seen_at, (seenAtCounts.get(row.first_seen_at) ?? 0) + 1);
  }
  const pct = (n: number) => (totalVisitors > 0 ? Math.round((n / totalVisitors) * 1000) / 10 : 0);

  const accessBreakdown: VisitorAccessRow[] = breakdownRows
    .map((row) => ({
      key: `${row.price_list_id ?? "-"}:${row.access_code_id ?? "-"}`,
      passwordCode: names.codeName(row.access_code_id, row.price_list_id),
      priceListName: names.listName(row.price_list_id),
      visitors: row.visitor_count ?? 0,
      sharePct: pct(row.visitor_count ?? 0),
    }))
    .sort((a, b) => b.visitors - a.visitors || a.priceListName.localeCompare(b.priceListName, "tr"));

  const entries: VisitorEntryRow[] = entryRows.map((row) => ({
    visitorKey: row.visitor_key,
    seenAt: row.first_seen_at,
    statDate: row.stat_date,
    timeKnown: (seenAtCounts.get(row.first_seen_at) ?? 0) < 3,
    provinceLabel: provinceLabel(row.province_code),
    passwordCode: names.codeName(row.access_code_id, row.price_list_id),
    priceListName: names.listName(row.price_list_id),
  }));

  return { accessBreakdown, entries };
}

export async function getTenantVisitorProvinceReport(
  tenantId: string,
  period: AnalyticsPeriod,
  flags: VisitorReportTenantFlags = { isPasswordProtected: true, magnetLoginEnabled: false },
): Promise<VisitorProvinceReport> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return emptyReport(period, true);
  }

  const { startDate, endDate } = getDateRange(period);
  const { data, error } = await supabase.rpc("storefront_visitor_provinces", {
    p_tenant_id: tenantId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error("[reports/iller] storefront_visitor_provinces hata:", error.message);
    return emptyReport(period, true);
  }

  const rows = (data ?? []) as Array<{ province_code: string | null; visitor_count: number }>;
  const totalVisitors = rows.reduce((sum, row) => sum + (row.visitor_count ?? 0), 0);
  const pct = (n: number) => (totalVisitors > 0 ? Math.round((n / totalVisitors) * 1000) / 10 : 0);

  const provinces: VisitorProvinceRow[] = [];
  const foreign: VisitorProvinceRow[] = [];
  let unknownVisitors = 0;

  for (const row of rows) {
    const code = row.province_code ?? "";
    const visitors = row.visitor_count ?? 0;

    if (TR_PROVINCES[code]) {
      provinces.push({ code, label: provinceLabel(code), visitors, sharePct: pct(visitors) });
    } else if (code && isForeignCode(code)) {
      foreign.push({ code, label: provinceLabel(code), visitors, sharePct: pct(visitors) });
    } else {
      unknownVisitors += visitors;
    }
  }

  const byVisitors = (a: VisitorProvinceRow, b: VisitorProvinceRow) =>
    b.visitors - a.visitors || a.label.localeCompare(b.label, "tr");
  provinces.sort(byVisitors);
  foreign.sort(byVisitors);

  const knownVisitors = provinces.reduce((sum, row) => sum + row.visitors, 0);
  const foreignVisitors = foreign.reduce((sum, row) => sum + row.visitors, 0);

  const { accessBreakdown, entries } = await fetchAccessDetails(
    supabase,
    tenantId,
    startDate,
    endDate,
    totalVisitors,
    flags,
  );

  return {
    period,
    startDate,
    endDate,
    totalVisitors,
    knownVisitors,
    foreignVisitors,
    unknownVisitors,
    provinces,
    foreign,
    accessBreakdown,
    entries,
    unavailable: false,
  };
}

export { UNKNOWN_PROVINCE_LABEL };
