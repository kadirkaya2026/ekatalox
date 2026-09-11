import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDateRange } from "@/lib/analytics/queries";
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
    unavailable,
  };
}

export async function getTenantVisitorProvinceReport(
  tenantId: string,
  period: AnalyticsPeriod,
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
    unavailable: false,
  };
}

export { UNKNOWN_PROVINCE_LABEL };
