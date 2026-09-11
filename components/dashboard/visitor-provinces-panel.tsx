"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableWrapper } from "@/components/ui/table";
import { formatReportDateRange } from "@/lib/analytics/queries";
import type { VisitorProvinceReport, VisitorProvinceRow } from "@/lib/analytics/province-queries";
import type { AnalyticsPeriod } from "@/lib/validators/analytics";
import { cn } from "@/lib/utils";

// Canlı yenileme: biri vitrine girdiği anda ziyaret kaydı RPC ile anında
// yazılır; panel bu aralıkla sessizce yeniden çeker (sekme görünürken).
const LIVE_REFRESH_MS = 10_000;

const periodOptions: { value: AnalyticsPeriod; label: string }[] = [
  { value: "daily", label: "Bugün" },
  { value: "weekly", label: "Son 7 Gün" },
  { value: "monthly", label: "Son 30 Gün" },
];

function StatCard({ title, value, hint }: { title: string; value: number; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value.toLocaleString("tr-TR")}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  );
}

function ProvinceTable({
  title,
  emptyMessage,
  rows,
  nameHeader,
}: {
  title: string;
  emptyMessage: string;
  rows: VisitorProvinceRow[];
  nameHeader: string;
}) {
  const maxVisitors = Math.max(...rows.map((row) => row.visitors), 0);

  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <>
          <TableWrapper className="mt-4 hidden md:block">
            <Table>
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">{nameHeader}</th>
                  <th className="px-4 py-3 font-medium">Dağılım</th>
                  <th className="px-4 py-3 font-medium text-right">Kişi</th>
                  <th className="px-4 py-3 font-medium text-right">Pay</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const widthPercent =
                    maxVisitors > 0 ? Math.max(2, Math.round((row.visitors / maxVisitors) * 100)) : 0;
                  return (
                    <tr key={row.code} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{row.label}</td>
                      <td className="w-1/2 px-4 py-3">
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-emerald-600 transition-all"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">
                        {row.visitors.toLocaleString("tr-TR")}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">%{row.sharePct}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrapper>

          <div className="mt-4 space-y-3 md:hidden">
            {rows.map((row, index) => {
              const widthPercent =
                maxVisitors > 0 ? Math.max(2, Math.round((row.visitors / maxVisitors) * 100)) : 0;
              return (
                <div key={row.code} className="rounded-lg border border-slate-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">#{index + 1}</p>
                      <p className="font-medium text-foreground">{row.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-700">
                        {row.visitors.toLocaleString("tr-TR")} kişi
                      </p>
                      <p className="text-xs text-slate-500">%{row.sharePct}</p>
                    </div>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-600"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

export function VisitorProvincesPanel({
  initialReport,
  endpoint = "/api/tenant/reports/iller",
}: {
  initialReport: VisitorProvinceReport;
  endpoint?: string;
}) {
  const [period, setPeriod] = useState<AnalyticsPeriod>(initialReport.period);
  const [report, setReport] = useState(initialReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [stale, setStale] = useState(false);
  const periodRef = useRef(period);
  const isFetching = useRef(false);

  const loadReport = useCallback(
    async (nextPeriod: AnalyticsPeriod, options?: { silent?: boolean }) => {
      if (isFetching.current) return;
      isFetching.current = true;

      if (!options?.silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await fetch(`${endpoint}?period=${nextPeriod}`, { cache: "no-store" });
        const result = await response.json().catch(() => null);

        if (response.ok && result?.report) {
          // Kullanıcı bu arada dönemi değiştirdiyse eski cevabı uygulama.
          if (periodRef.current === nextPeriod) {
            setReport(result.report as VisitorProvinceReport);
            setLastUpdatedAt(new Date());
            setStale(false);
          }
        } else if (options?.silent) {
          setStale(true);
        } else {
          setError("Rapor yüklenemedi. Lütfen tekrar deneyin.");
        }
      } catch {
        if (options?.silent) {
          setStale(true);
        } else {
          setError("Rapor yüklenemedi. Lütfen tekrar deneyin.");
        }
      } finally {
        isFetching.current = false;
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [endpoint],
  );

  useEffect(() => {
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void loadReport(periodRef.current, { silent: true });
    };

    const intervalId = window.setInterval(tick, LIVE_REFRESH_MS);
    document.addEventListener("visibilitychange", tick);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [loadReport]);

  const handlePeriodChange = (nextPeriod: AnalyticsPeriod) => {
    if (nextPeriod === period) return;
    periodRef.current = nextPeriod;
    setPeriod(nextPeriod);
    void loadReport(nextPeriod);
  };

  const dateLabel = formatReportDateRange(report.startDate, report.endDate);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full rounded-full opacity-75",
                    stale ? "bg-amber-400" : "animate-ping bg-emerald-400",
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex size-2.5 rounded-full",
                    stale ? "bg-amber-500" : "bg-emerald-500",
                  )}
                />
              </span>
              <p className="text-sm font-medium text-foreground">
                Canlı · {stale ? "bağlantı bekleniyor" : "her 10 saniyede yenilenir"}
              </p>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {dateLabel}
              {lastUpdatedAt
                ? ` · son güncelleme ${lastUpdatedAt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePeriodChange(option.value)}
                disabled={loading}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                  period === option.value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                  loading && "opacity-60",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </Card>

      {report.unavailable ? (
        <Card className="p-5 text-sm text-slate-600">
          İl raporu henüz hazır değil. Veri toplama başladıktan sonra bu sayfada ziyaretçiler il il listelenecek.
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Toplam tekil ziyaretçi" value={report.totalVisitors} hint={dateLabel} />
        <StatCard
          title="İli tespit edilen"
          value={report.knownVisitors}
          hint={`${report.provinces.length} farklı il`}
        />
        <StatCard
          title="Yurt dışı / bilinmiyor"
          value={report.foreignVisitors + report.unknownVisitors}
          hint={`${report.foreignVisitors} yurt dışı, ${report.unknownVisitors} tespit edilemedi`}
        />
      </div>

      <ProvinceTable
        title="İllere göre ziyaretçi"
        nameHeader="İl"
        emptyMessage="Bu dönemde ili tespit edilen ziyaretçi yok. Yeni ziyaretler geldikçe burada il il listelenir."
        rows={report.provinces}
      />

      {report.foreign.length > 0 ? (
        <ProvinceTable
          title="Yurt dışından gelenler"
          nameHeader="Ülke"
          emptyMessage=""
          rows={report.foreign}
        />
      ) : null}
    </div>
  );
}
