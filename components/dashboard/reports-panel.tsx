"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableWrapper } from "@/components/ui/table";
import {
  formatReportDateRange,
  type TenantAnalyticsReport,
} from "@/lib/analytics/queries";
import type { CurrencyCode } from "@/lib/products/constants";
import type { AnalyticsPeriod } from "@/lib/validators/analytics";
import { cn, formatCurrency } from "@/lib/utils";

const periodOptions: { value: AnalyticsPeriod; label: string }[] = [
  { value: "daily", label: "Bugün" },
  { value: "weekly", label: "Son 7 Gün" },
  { value: "monthly", label: "Son 30 Gün" },
];

type ReportsTab = "overview" | "products" | "search" | "usage" | "traffic";

const REPORTS_TABS: Array<{ key: ReportsTab; label: string }> = [
  { key: "overview", label: "Genel Bakış" },
  { key: "products", label: "Ürünler" },
  { key: "search", label: "Arama" },
  { key: "usage", label: "Fiyat Listesi & Şifre Kullanımı" },
  { key: "traffic", label: "Trafik Dağılımı" },
];

const ORDER_CURRENCIES: CurrencyCode[] = ["TRY", "USD", "EUR"];

function getVisitorCardTitle(report: TenantAnalyticsReport) {
  const dateLabel = formatReportDateRange(report.startDate, report.endDate);

  if (report.period === "daily") {
    return `${dateLabel} tarihinde siteye giren tekil ziyaretçi`;
  }

  return `${dateLabel} arasında siteye giren tekil ziyaretçi (toplam)`;
}

function getOrderCardTitle(report: TenantAnalyticsReport) {
  const dateLabel = formatReportDateRange(report.startDate, report.endDate);

  if (report.period === "daily") {
    return `${dateLabel} tarihinde oluşturulan sipariş PDF'leri`;
  }

  return `${dateLabel} arasında oluşturulan sipariş PDF'leri`;
}

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
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>

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
                    <td className="px-4 py-3 font-medium text-foreground">{row.productName}</td>
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
                  <p className="font-medium text-foreground">{row.productName}</p>
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

function TrafficBarChart({
  title,
  emptyMessage,
  rows,
  valueLabel,
  formatLabel,
}: {
  title: string;
  emptyMessage: string;
  rows: Array<{ label: string; count: number }>;
  valueLabel: string;
  formatLabel?: (label: string) => string;
}) {
  const maxCount = Math.max(...rows.map((row) => row.count), 0);
  const hasData = rows.some((row) => row.count > 0);

  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>

      {!hasData ? (
        <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="mt-4 space-y-2">
          {rows.map((row) => {
            const widthPercent = maxCount > 0 ? Math.round((row.count / maxCount) * 100) : 0;
            const label = formatLabel ? formatLabel(row.label) : row.label;

            return (
              <div key={row.label} className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-3">
                <span className="text-xs font-medium text-slate-600">{label}</span>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-slate-900 transition-all"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
                <span className="text-right text-xs font-semibold text-slate-700">
                  {row.count}
                </span>
              </div>
            );
          })}
          <p className="pt-2 text-xs text-slate-500">{valueLabel}</p>
        </div>
      )}
    </Card>
  );
}

function SimpleUsageTable({
  title,
  emptyMessage,
  headers,
  rows,
  showSecondary = true,
}: {
  title: string;
  emptyMessage: string;
  headers: [string, string, string];
  rows: Array<{ key: string; primary: string; secondary: string; count: number }>;
  showSecondary?: boolean;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <TableWrapper className="mt-4 block">
          <Table>
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">{headers[0]}</th>
                {showSecondary ? (
                  <th className="px-4 py-3 font-medium">{headers[1]}</th>
                ) : null}
                <th className="px-4 py-3 font-medium text-right">{headers[2]}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.key} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{row.primary}</td>
                  {showSecondary ? (
                    <td className="px-4 py-3 text-slate-600">{row.secondary}</td>
                  ) : null}
                  <td className="px-4 py-3 text-right text-slate-700">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      )}
    </Card>
  );
}

export function ReportsPanel({
  initialReport,
  endpoint = "/api/tenant/reports",
}: {
  initialReport: TenantAnalyticsReport;
  endpoint?: string;
}) {
  const [activeTab, setActiveTab] = useState<ReportsTab>("overview");
  const [period, setPeriod] = useState<AnalyticsPeriod>(initialReport.period);
  const [report, setReport] = useState(initialReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async (nextPeriod: AnalyticsPeriod) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${endpoint}?period=${nextPeriod}`);
      const result = await response.json().catch(() => null);

      if (response.ok && result?.report) {
        setReport(result.report as TenantAnalyticsReport);
      } else {
        setError("Rapor yüklenemedi. Lütfen tekrar deneyin.");
      }
    } catch {
      setError("Rapor yüklenemedi. İnternet bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  function handlePeriodChange(nextPeriod: AnalyticsPeriod) {
    setPeriod(nextPeriod);
    void loadReport(nextPeriod);
  }

  const currencyTotals = ORDER_CURRENCIES.filter(
    (currency) => report.orderSummary.totalsByCurrency[currency] > 0,
  );

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
                : "border border-border bg-card text-foreground hover:bg-muted",
              loading && "opacity-70",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap border-b border-slate-100">
          {REPORTS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition sm:px-5",
                activeTab === tab.key
                  ? "border-emerald-500 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-6 p-5">
        {activeTab === "overview" ? (
        <>
      <Card className="p-5">
        <p className="text-sm text-slate-500">{getVisitorCardTitle(report)}</p>
        <p className="mt-2 text-3xl font-bold text-foreground">
          {report.uniqueVisitors}
          <span className="ml-2 text-base font-medium text-slate-500">
            Tekil Ziyaretçi (cihaz)
          </span>
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Türkiye saatiyle; tüm konumlardan girişler dahildir. Her cihaz ve tarayıcı ayrı
          sayılır.
          {report.period !== "daily" &&
            " 7 ve 30 günlük dönemde aynı cihaz farklı günlerde tekrar sayılır."}
        </p>
      </Card>

      <Card className="p-5">
        <p className="text-sm text-slate-500">{getOrderCardTitle(report)}</p>
        <p className="mt-2 text-3xl font-bold text-foreground">
          {report.orderSummary.totalOrders}
          <span className="ml-2 text-base font-medium text-slate-500">Sipariş PDF</span>
        </p>

        {report.orderSummary.totalOrders === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Bu dönemde sipariş PDF&apos;i oluşturulmadı.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {currencyTotals.map((currency) => (
              <div
                key={currency}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-700">{currency} Toplam</span>
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(report.orderSummary.totalsByCurrency[currency], currency)}
                </span>
              </div>
            ))}
            {report.orderSummary.catalogOrders > 0 ? (
              <p className="text-sm text-slate-600">
                Fiyatsız katalog: {report.orderSummary.catalogOrders} sipariş
              </p>
            ) : null}
          </div>
        )}
      </Card>
        </>
        ) : null}

        {activeTab === "products" ? (
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
        ) : null}

        {activeTab === "search" ? (
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-foreground">En Çok Aranan Terimler</h2>

        {report.topSearchQueries.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Bu dönemde arama kaydedilmedi.</p>
        ) : (
          <TableWrapper className="mt-4 block">
            <Table>
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Terim</th>
                  <th className="px-4 py-3 font-medium text-right">Arama</th>
                  <th className="px-4 py-3 font-medium text-right">Sonuçsuz</th>
                </tr>
              </thead>
              <tbody>
                {report.topSearchQueries.map((row, index) => (
                  <tr key={row.query} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{row.query}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{row.searchCount}</td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {row.zeroResultCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Card>
        ) : null}

        {activeTab === "usage" ? (
      <div className="grid gap-4 xl:grid-cols-2">
        <SimpleUsageTable
          title="Fiyat Listesi Kullanımı"
          emptyMessage="Bu dönemde fiyat listesi girişi kaydedilmedi."
          headers={["Fiyat Listesi", "", "Giriş"]}
          showSecondary={false}
          rows={report.priceListUsage.map((row) => ({
            key: row.priceListId,
            primary: row.priceListName,
            secondary: "",
            count: row.loginCount,
          }))}
        />
        <SimpleUsageTable
          title="Şifre Kullanımı"
          emptyMessage="Bu dönemde şifre girişi kaydedilmedi."
          headers={["Şifre", "Fiyat Listesi", "Giriş"]}
          rows={report.accessCodeUsage.map((row) => ({
            key: row.accessCodeId,
            primary: row.passwordCode,
            secondary: row.priceListName,
            count: row.loginCount,
          }))}
        />
      </div>
        ) : null}

        {activeTab === "traffic" ? (
      <div className="grid gap-4 xl:grid-cols-2">
        <TrafficBarChart
          title="Saat Dağılımı"
          emptyMessage="Bu dönemde saatlik ziyaret kaydedilmedi."
          rows={report.hourlyTraffic.map((row) => ({
            label: String(row.hour),
            count: row.count,
          }))}
          valueLabel="Ziyaret sayısı (Türkiye saati)"
          formatLabel={(label) => `${label.padStart(2, "0")}:00`}
        />
        {report.period !== "daily" ? (
          <TrafficBarChart
            title="Haftanın Günü Dağılımı"
            emptyMessage="Bu dönemde günlük ziyaret kaydedilmedi."
            rows={report.dayOfWeekTraffic.map((row) => ({
              label: String(row.dayIndex),
              count: row.count,
            }))}
            valueLabel="Ziyaret sayısı (Türkiye saati)"
            formatLabel={(label) =>
              report.dayOfWeekTraffic[Number(label)]?.label ?? label
            }
          />
        ) : null}
      </div>
        ) : null}
        </div>
      </Card>
    </div>
  );
}
