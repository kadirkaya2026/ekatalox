"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableWrapper } from "@/components/ui/table";
import type { TenantAnalyticsReport } from "@/lib/analytics/queries";
import type { AnalyticsPeriod } from "@/lib/validators/analytics";
import { cn } from "@/lib/utils";

const periodOptions: { value: AnalyticsPeriod; label: string }[] = [
  { value: "daily", label: "Günlük" },
  { value: "weekly", label: "Haftalık" },
  { value: "monthly", label: "Aylık" },
];

function ProductRankingTable({
  title,
  emptyMessage,
  rows,
  countLabel,
}: {
  title: string;
  emptyMessage: string;
  rows: TenantAnalyticsReport["topViewedProducts"];
  countLabel: string;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <>
          <TableWrapper className="mt-4 block">
            <Table>
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Ürün</th>
                  <th className="px-4 py-3 font-medium text-right">{countLabel}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.productId} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.productName}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>

          <div className="mt-4 space-y-3 md:hidden">
            {rows.map((row, index) => (
              <div
                key={row.productId}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
              >
                <div>
                  <p className="text-xs text-slate-500">#{index + 1}</p>
                  <p className="font-medium text-slate-900">{row.productName}</p>
                </div>
                <p className="text-sm font-semibold text-slate-700">{row.count}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export function ReportsPanel({
  initialReport,
}: {
  initialReport: TenantAnalyticsReport;
}) {
  const [period, setPeriod] = useState<AnalyticsPeriod>(initialReport.period);
  const [report, setReport] = useState(initialReport);
  const [loading, setLoading] = useState(false);

  const loadReport = useCallback(async (nextPeriod: AnalyticsPeriod) => {
    setLoading(true);

    try {
      const response = await fetch(`/api/tenant/reports?period=${nextPeriod}`);
      const result = await response.json();

      if (response.ok && result.report) {
        setReport(result.report as TenantAnalyticsReport);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function handlePeriodChange(nextPeriod: AnalyticsPeriod) {
    setPeriod(nextPeriod);
    void loadReport(nextPeriod);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {periodOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={loading}
            onClick={() => handlePeriodChange(option.value)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition",
              period === option.value
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              loading && "opacity-70",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Card className="p-5">
        <p className="text-sm text-slate-500">Siteye giren tekil ziyaretçi</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">
          {report.uniqueVisitors}
          <span className="ml-2 text-base font-medium text-slate-500">
            Tekil Ziyaretçi (cihaz)
          </span>
        </p>
        <p className="mt-2 text-xs text-slate-500">Her cihaz ve tarayıcı ayrı sayılır.</p>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <ProductRankingTable
          title="En Çok Tıklanan 5 Ürün"
          emptyMessage="Bu dönemde ürün tıklaması kaydedilmedi."
          rows={report.topViewedProducts}
          countLabel="Tıklama"
        />
        <ProductRankingTable
          title="En Çok Sepete Eklenen 5 Ürün"
          emptyMessage="Bu dönemde sepete ekleme kaydedilmedi."
          rows={report.topCartProducts}
          countLabel="Ekleme"
        />
      </div>
    </div>
  );
}
