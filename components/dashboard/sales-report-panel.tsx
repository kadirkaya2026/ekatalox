"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SettingsTabs } from "@/components/dashboard/settings-tabs";
import { cn, formatCurrency } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/products/constants";
import { formatBucketLabel } from "@/lib/dates/istanbul";
import {
  SALES_PRESET_LABELS,
  autoBucket,
  resolvePreset,
  type SalesBucket,
  type SalesPreset,
} from "@/lib/sales/presets";
import type { SalesCurrencyReport, SalesReport } from "@/lib/sales/types";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";

const PRESETS = Object.keys(SALES_PRESET_LABELS) as Array<Exclude<SalesPreset, "custom">>;
const BUCKET_LABELS: Record<SalesBucket, string> = { day: "Gün", week: "Hafta", month: "Ay" };

const money = (v: number, c: string) => formatCurrency(v, c as CurrencyCode);
const pct = (v: number | null) => (v === null ? "—" : `%${v.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`);

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "good" | "warn" | "bad" }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-bold tracking-tight",
          tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-rose-700" : tone === "warn" ? "text-amber-700" : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  );
}

// Grafik kütüphanesi yok (repo geleneği): elle CSS sütun grafiği.
function TrendChart({ report, bucket }: { report: SalesCurrencyReport; bucket: SalesBucket }) {
  const series = report.series;
  const max = Math.max(...series.map((p) => Math.max(p.revenue, p.profit, 0)), 1);
  const labelEvery = Math.max(1, Math.ceil(series.length / 12));
  const hasData = series.some((p) => p.revenue > 0 || p.orderCount > 0);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">Ciro ve kâr</h2>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><i className="inline-block size-2.5 rounded-sm bg-slate-900" /> Ciro</span>
          <span className="inline-flex items-center gap-1"><i className="inline-block size-2.5 rounded-sm bg-emerald-500" /> Kâr</span>
        </div>
      </div>
      {!hasData ? (
        <p className="mt-4 text-sm text-slate-500">Bu dönemde teslim edilmiş sipariş yok.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <div className="flex h-48 items-end gap-1" style={{ minWidth: `${series.length * 14}px` }}>
            {series.map((p, i) => {
              const rh = Math.round((Math.max(p.revenue, 0) / max) * 100);
              const ph = Math.round((Math.max(p.profit, 0) / max) * 100);
              const title = `${formatBucketLabel(p.bucketStart, bucket)} · Ciro ${money(p.revenue, report.currency)} · Kâr ${money(p.profit, report.currency)} · ${p.deliveredCount} teslim`;
              return (
                <div key={p.bucketStart} className="flex h-full min-w-[12px] flex-1 flex-col justify-end" title={title}>
                  <div className="flex h-full items-end justify-center gap-px">
                    <div className="w-1/2 rounded-t bg-slate-900" style={{ height: `${rh}%` }} />
                    <div className={cn("w-1/2 rounded-t", p.profit < 0 ? "bg-rose-500" : "bg-emerald-500")} style={{ height: `${p.profit < 0 ? 2 : ph}%` }} />
                  </div>
                  <span className="mt-1 h-4 truncate text-center text-[10px] text-slate-500">
                    {i % labelEvery === 0 ? formatBucketLabel(p.bucketStart, bucket) : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function BucketTable({ report, bucket }: { report: SalesCurrencyReport; bucket: SalesBucket }) {
  const rows = report.series.filter((p) => p.orderCount > 0);
  const c = report.currency;
  return (
    <Card className="overflow-hidden p-0">
      <div className="px-5 pt-5">
        <h2 className="text-lg font-semibold text-foreground">Dönem dökümü</h2>
      </div>
      {rows.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">Bu dönemde sipariş yok.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Dönem</th>
                <th className="px-4 py-2 text-right">Sipariş</th>
                <th className="px-4 py-2 text-right">Teslim</th>
                <th className="px-4 py-2 text-right">İptal</th>
                <th className="px-4 py-2 text-right">Ciro</th>
                <th className="px-4 py-2 text-right">Maliyet</th>
                <th className="px-4 py-2 text-right">Kâr</th>
                <th className="px-4 py-2 text-right">Ort. sepet</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((p) => (
                <tr key={p.bucketStart}>
                  <td className="px-4 py-2 font-medium text-slate-900">{formatBucketLabel(p.bucketStart, bucket)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{p.orderCount}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{p.deliveredCount}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{p.cancelledCount}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{money(p.revenue, c)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{money(p.cost, c)}</td>
                  <td className={cn("px-4 py-2 text-right tabular-nums font-semibold", p.profit < 0 ? "text-rose-700" : "text-emerald-700")}>
                    {money(p.profit, c)}
                    {p.costMissingOrders > 0 ? <span title={`${p.costMissingOrders} siparişte maliyet eksik`} className="ml-1 text-amber-600">*</span> : null}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{money(p.avgBasket, c)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td className="px-4 py-2">Toplam</td>
                <td className="px-4 py-2 text-right tabular-nums">{report.totalCount}</td>
                <td className="px-4 py-2 text-right tabular-nums">{report.deliveredCount}</td>
                <td className="px-4 py-2 text-right tabular-nums">{report.cancelledCount}</td>
                <td className="px-4 py-2 text-right tabular-nums">{money(report.revenue, c)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{money(report.cost, c)}</td>
                <td className={cn("px-4 py-2 text-right tabular-nums", report.profit < 0 ? "text-rose-700" : "text-emerald-700")}>{money(report.profit, c)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{money(report.avgBasket, c)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function TopProducts({ report }: { report: SalesCurrencyReport }) {
  const c = report.currency;
  return (
    <Card className="overflow-hidden p-0">
      <div className="px-5 pt-5">
        <h2 className="text-lg font-semibold text-foreground">En çok satan ürünler</h2>
        <p className="text-xs text-slate-500">Yalnızca teslim edilen siparişler</p>
      </div>
      {report.topProducts.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">Henüz veri yok.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Ürün</th>
                <th className="px-4 py-2 text-right">Adet</th>
                <th className="px-4 py-2 text-right">Ciro</th>
                <th className="px-4 py-2 text-right">Kâr</th>
                <th className="px-4 py-2 text-right">Sipariş</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.topProducts.map((p) => (
                <tr key={p.productKey}>
                  <td className="px-4 py-2">
                    <p className="font-medium text-slate-900">{p.productName}</p>
                    {p.skuCode ? <p className="text-xs text-slate-400">{p.skuCode}</p> : null}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{p.quantity}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{money(p.revenue, c)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {p.profit === null ? (
                      <span className="inline-flex items-center gap-1 text-amber-700" title="Alış fiyatı girilmemiş">
                        <AlertTriangle className="size-3.5" /> —
                      </span>
                    ) : (
                      <span className={p.profit < 0 ? "text-rose-700" : "text-emerald-700"}>{money(p.profit, c)}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{p.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function PaymentBreakdown({ report }: { report: SalesCurrencyReport }) {
  const rows = [
    { label: "Nakit", ...report.payment.cash },
    { label: "Kart", ...report.payment.card },
    ...(report.payment.unknown.count ? [{ label: "Belirtilmemiş", ...report.payment.unknown }] : []),
  ];
  const max = Math.max(...rows.map((r) => r.amount), 1);
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-foreground">Ödeme yöntemi</h2>
      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[5rem_1fr_auto] items-center gap-3">
            <span className="text-xs font-medium text-slate-600">{r.label}</span>
            <div className="h-2.5 rounded-full bg-slate-100">
              <div className="h-2.5 rounded-full bg-slate-900" style={{ width: `${Math.round((r.amount / max) * 100)}%` }} />
            </div>
            <span className="text-xs tabular-nums text-slate-600">
              {money(r.amount, report.currency)} · {r.count}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

async function exportReport(report: SalesReport, cur: SalesCurrencyReport, format: "xlsx" | "csv") {
  const XLSX = await import("xlsx");
  const b = report.range.bucket;
  const ozet = [
    ["Dönem", `${report.range.from} – ${report.range.to}`],
    ["Para birimi", cur.currency],
    ["Ciro (teslim)", cur.revenue],
    ["Maliyet", cur.cost],
    ["Kâr", cur.profit],
    ["Kâr marjı %", cur.marginPct ?? ""],
    ["Teslim edilen sipariş", cur.deliveredCount],
    ["Bekleyen sipariş", cur.pendingCount],
    ["Bekleyen tutar", cur.pendingAmount],
    ["İptal", cur.cancelledCount],
    ["İptal oranı %", cur.cancelRatePct ?? ""],
    ["Ortalama sepet", cur.avgBasket],
    ["Maliyeti eksik sipariş", cur.costMissingOrders],
  ];
  const donem = [
    ["Dönem", "Sipariş", "Teslim", "İptal", "Bekleyen", "Ciro", "Maliyet", "Kâr", "Ort. sepet", "Maliyeti eksik"],
    ...cur.series.map((p) => [formatBucketLabel(p.bucketStart, b), p.orderCount, p.deliveredCount, p.cancelledCount, p.pendingCount, p.revenue, p.cost, p.profit, p.avgBasket, p.costMissingOrders]),
  ];
  const urunler = [
    ["Ürün", "SKU", "Adet", "Ciro", "Maliyet", "Kâr", "Sipariş"],
    ...cur.topProducts.map((p) => [p.productName, p.skuCode ?? "", p.quantity, p.revenue, p.cost ?? "", p.profit ?? "", p.orderCount]),
  ];
  const name = `satis-raporu-${cur.currency}-${report.range.from}_${report.range.to}`;
  if (format === "csv") {
    const csv = [XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(ozet), { FS: ";" }), "", XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(donem), { FS: ";" }), "", XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(urunler), { FS: ";" })].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    return;
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ozet), "Özet");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(donem), "Dönem");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(urunler), "Ürünler");
  XLSX.writeFile(wb, `${name}.xlsx`);
}

export function SalesReportPanel({ initialReport }: { initialReport: SalesReport }) {
  const [report, setReport] = useState(initialReport);
  const [preset, setPreset] = useState<SalesPreset>(initialReport.range.preset ?? "this_month");
  const [from, setFrom] = useState(initialReport.range.from);
  const [to, setTo] = useState(initialReport.range.to);
  const [bucket, setBucket] = useState<SalesBucket>(initialReport.range.bucket);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);

  const active = useMemo(() => {
    const list = report.currencies;
    if (!list.length) return null;
    return list.find((c) => c.currency === currency) ?? list[0];
  }, [report, currency]);

  async function load(next: { from: string; to: string; bucket: SalesBucket; preset: SalesPreset }) {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ from: next.from, to: next.to, bucket: next.bucket });
    const response = await fetch(`/api/tenant/sales/report?${params.toString()}`);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error ?? "Rapor yüklenemedi.");
    } else {
      setReport({ ...(result.report as SalesReport), range: { ...result.report.range, preset: next.preset } });
    }
    setLoading(false);
  }

  function choosePreset(p: Exclude<SalesPreset, "custom">) {
    const r = resolvePreset(p);
    setPreset(p);
    setFrom(r.from);
    setTo(r.to);
    setBucket(r.bucket);
    void load({ ...r, preset: p });
  }

  function applyCustom() {
    if (!from || !to || from > to) {
      setError("Başlangıç bitişten sonra olamaz.");
      return;
    }
    const b = bucket;
    setPreset("custom");
    void load({ from, to, bucket: b, preset: "custom" });
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => choosePreset(p)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold",
                preset === p ? "bg-foreground text-background" : "border text-muted-foreground",
              )}
            >
              {SALES_PRESET_LABELS[p]}
            </button>
          ))}
          {loading ? <Loader2 className="size-4 animate-spin text-slate-400" /> : null}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setBucket(autoBucket(e.target.value, to)); }} className="w-40" />
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setBucket(autoBucket(from, e.target.value)); }} className="w-40" />
          <Select value={bucket} onChange={(e) => setBucket(e.target.value as SalesBucket)} className="w-32">
            {(Object.keys(BUCKET_LABELS) as SalesBucket[]).map((b) => (
              <option key={b} value={b}>{BUCKET_LABELS[b]}</option>
            ))}
          </Select>
          <Button variant="secondary" onClick={applyCustom} disabled={loading}>Uygula</Button>
          {active ? (
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" onClick={() => void exportReport(report, active, "xlsx")}>
                <Download className="size-4" /> Excel
              </Button>
              <Button variant="ghost" onClick={() => void exportReport(report, active, "csv")}>
                <Download className="size-4" /> CSV
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      <InlineAlert tone="error" message={error} />

      {report.costMissingProductCount > 0 ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong>{report.costMissingProductCount} üründe alış fiyatı yok</strong> — bu ürünleri içeren siparişler kâr
            hesabına giremiyor. Ürün Düzenle veya Stok Listesi Yükle (&quot;Alış fiyatı&quot; sütunu) ile tamamlayın.
          </p>
        </div>
      ) : null}

      {report.currencies.length > 1 && active ? (
        <SettingsTabs
          tabs={report.currencies.map((c) => ({ key: c.currency, label: c.currency }))}
          activeTab={active.currency}
          onChange={(key) => setCurrency(key)}
          layoutId="sales-currency-tabs"
        />
      ) : null}

      {!active ? (
        <Card className="p-6 text-sm text-slate-600">
          Bu dönemde fiyatlı sipariş yok.
          {report.catalogOrderCount > 0 ? ` (${report.catalogOrderCount} fiyatsız katalog siparişi rapora girmez.)` : ""}
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Ciro (teslim edilen)" value={money(active.revenue, active.currency)} hint={`${active.deliveredCount} sipariş`} />
            <Kpi label="Kâr" value={money(active.profit, active.currency)} tone={active.profit < 0 ? "bad" : "good"} hint={active.costMissingOrders ? `${active.costMissingOrders} sipariş maliyetsiz, hariç` : "maliyeti tam siparişlerden"} />
            <Kpi label="Kâr marjı" value={pct(active.marginPct)} />
            <Kpi label="Ortalama sepet" value={money(active.avgBasket, active.currency)} />
            <Kpi label="Bekleyen" value={money(active.pendingAmount, active.currency)} hint={`${active.pendingCount} sipariş henüz teslim edilmedi`} tone="warn" />
            <Kpi label="İptal oranı" value={pct(active.cancelRatePct)} hint={`${active.cancelledCount} / ${active.totalCount}`} tone={active.cancelRatePct !== null && active.cancelRatePct > 15 ? "bad" : undefined} />
            <Kpi
              label="Durum dağılımı"
              value={`${active.byStatus.new} yeni`}
              hint={(["confirmed", "preparing", "shipped"] as const).map((s) => `${active.byStatus[s]} ${ORDER_STATUS_LABELS[s].toLowerCase()}`).join(" · ")}
            />
            <Kpi label="Fiyatsız katalog siparişi" value={String(report.catalogOrderCount)} hint="rapora girmez" />
          </div>

          <TrendChart report={active} bucket={report.range.bucket} />
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <BucketTable report={active} bucket={report.range.bucket} />
            <PaymentBreakdown report={active} />
          </div>
          <TopProducts report={active} />
        </>
      )}
    </div>
  );
}
