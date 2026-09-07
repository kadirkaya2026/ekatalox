"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatBucketLabel, getIstanbulToday, shiftIsoDate } from "@/lib/dates/istanbul";
import { SALES_PRESET_LABELS, resolvePreset, type SalesPreset } from "@/lib/sales/presets";
import type {
  SiteAnalyticsBreakdownRow,
  SiteAnalyticsBucket,
  SiteAnalyticsReport,
  SiteAnalyticsVisitorPage,
} from "@/lib/site-analytics/types";

type PresetKey = Exclude<SalesPreset, "custom"> | "last_7";

const PRESET_LABELS: Record<PresetKey, string> = {
  today: "Bugün",
  yesterday: "Dün",
  last_7: "Son 7 gün",
  this_week: SALES_PRESET_LABELS.this_week,
  last_week: SALES_PRESET_LABELS.last_week,
  this_month: SALES_PRESET_LABELS.this_month,
  last_month: SALES_PRESET_LABELS.last_month,
  last_30: SALES_PRESET_LABELS.last_30,
  this_year: SALES_PRESET_LABELS.this_year,
};
const PRESETS = Object.keys(PRESET_LABELS) as PresetKey[];
const BUCKET_LABELS: Record<SiteAnalyticsBucket, string> = { day: "Günlük", week: "Haftalık", month: "Aylık" };

function resolveRange(preset: PresetKey) {
  const today = getIstanbulToday();
  if (preset === "last_7") return { from: shiftIsoDate(today, -6), to: today };
  const r = resolvePreset(preset, today);
  return { from: r.from, to: r.to };
}

export function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} sn`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m < 60) return rest ? `${m} dk ${rest} sn` : `${m} dk`;
  const h = Math.floor(m / 60);
  return `${h} sa ${m % 60} dk`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

const num = (v: number) => v.toLocaleString("tr-TR");
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
function TrendChart({ report }: { report: SiteAnalyticsReport }) {
  const { series, range } = report;
  const max = Math.max(...series.map((p) => Math.max(p.visitors, p.pageviews)), 1);
  const labelEvery = Math.max(1, Math.ceil(series.length / 12));
  const hasData = series.some((p) => p.sessions > 0);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">Ziyaretçi ve sayfa görüntüleme ({BUCKET_LABELS[range.bucket].toLowerCase()})</h2>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><i className="inline-block size-2.5 rounded-sm bg-emerald-500" /> Ziyaretçi</span>
          <span className="inline-flex items-center gap-1"><i className="inline-block size-2.5 rounded-sm bg-slate-900 dark:bg-slate-300" /> Sayfa görüntüleme</span>
        </div>
      </div>
      {!hasData ? (
        <p className="mt-4 text-sm text-slate-500">Bu dönemde kayıtlı ziyaret yok.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <div className="flex h-48 items-end gap-1" style={{ minWidth: `${series.length * 14}px` }}>
            {series.map((p, i) => {
              const vh = Math.round((p.visitors / max) * 100);
              const ph = Math.round((p.pageviews / max) * 100);
              const title = `${formatBucketLabel(p.bucketStart, range.bucket)} · ${p.visitors} ziyaretçi · ${p.sessions} oturum · ${p.pageviews} görüntüleme · ort. ${formatDuration(p.avgDurationMs)}`;
              return (
                <div key={p.bucketStart} className="flex h-full min-w-[12px] flex-1 flex-col justify-end" title={title}>
                  <div className="flex h-full items-end justify-center gap-px">
                    <div className="w-1/2 rounded-t bg-emerald-500" style={{ height: `${vh}%` }} />
                    <div className="w-1/2 rounded-t bg-slate-900 dark:bg-slate-300" style={{ height: `${ph}%` }} />
                  </div>
                  <span className="mt-1 h-4 truncate text-center text-[10px] text-slate-500">
                    {i % labelEvery === 0 ? formatBucketLabel(p.bucketStart, range.bucket) : ""}
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

function BucketTable({ report }: { report: SiteAnalyticsReport }) {
  const rows = report.series.filter((p) => p.sessions > 0);
  if (!rows.length) return null;
  return (
    <Card className="overflow-hidden p-0">
      <div className="px-5 pt-5">
        <h2 className="text-lg font-semibold text-foreground">Dönem dökümü</h2>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-2 text-left">Dönem</th>
              <th className="px-4 py-2 text-right">Ziyaretçi</th>
              <th className="px-4 py-2 text-right">Oturum</th>
              <th className="px-4 py-2 text-right">Görüntüleme</th>
              <th className="px-4 py-2 text-right">Ort. süre</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((p) => (
              <tr key={p.bucketStart}>
                <td className="px-4 py-2 font-medium">{formatBucketLabel(p.bucketStart, report.range.bucket)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{num(p.visitors)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{num(p.sessions)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{num(p.pageviews)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatDuration(p.avgDurationMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PagesTable({ report }: { report: SiteAnalyticsReport }) {
  const rows = report.pages;
  return (
    <Card className="overflow-hidden p-0">
      <div className="px-5 pt-5">
        <h2 className="text-lg font-semibold text-foreground">Sayfalar</h2>
        <p className="mt-1 text-xs text-slate-500">
          Çıkış oranı yüksek ve süresi kısa sayfalar aksiyon adayı. Kaydırma: ziyaretçilerin sayfanın ne kadarını gördüğü.
        </p>
      </div>
      {!rows.length ? (
        <p className="p-5 text-sm text-slate-500">Bu dönemde sayfa görüntülemesi yok.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-2 text-left">Sayfa</th>
                <th className="px-4 py-2 text-right">Görüntüleme</th>
                <th className="px-4 py-2 text-right">Ziyaretçi</th>
                <th className="px-4 py-2 text-right">Ort. süre</th>
                <th className="px-4 py-2 text-right">Kaydırma</th>
                <th className="px-4 py-2 text-right">Giriş</th>
                <th className="px-4 py-2 text-right">Çıkış</th>
                <th className="px-4 py-2 text-right">Çıkış oranı</th>
                <th className="px-4 py-2 text-right">Tıklama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r) => (
                <tr key={r.path}>
                  <td className="max-w-[280px] truncate px-4 py-2 font-medium" title={r.path}>{r.path}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.pageviews)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.visitors)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatDuration(r.avgTimeMs)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">%{r.avgScrollPct}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.entries)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.exits)}</td>
                  <td className={cn("px-4 py-2 text-right tabular-nums", r.exitRatePct >= 60 && r.pageviews >= 5 ? "font-semibold text-rose-700" : "")}>
                    {pct(r.exitRatePct)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.clicks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function BarList({ title, rows, emptyText }: { title: string; rows: SiteAnalyticsBreakdownRow[]; emptyText: string }) {
  const max = Math.max(...rows.map((r) => r.sessions), 1);
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {!rows.length ? (
        <p className="mt-3 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.slice(0, 10).map((r) => (
            <li key={r.label}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate" title={r.label}>{r.label}</span>
                <span className="shrink-0 tabular-nums text-slate-500">
                  {num(r.sessions)} oturum · {num(r.visitors)} kişi
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.round((r.sessions / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ClicksTable({ report }: { report: SiteAnalyticsReport }) {
  const rows = report.clicks;
  return (
    <Card className="overflow-hidden p-0">
      <div className="px-5 pt-5">
        <h2 className="text-lg font-semibold text-foreground">En çok tıklananlar</h2>
        <p className="mt-1 text-xs text-slate-500">Hangi sayfada hangi düğme/bağlantıya basıldığı.</p>
      </div>
      {!rows.length ? (
        <p className="p-5 text-sm text-slate-500">Bu dönemde tıklama kaydı yok.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-2 text-left">Sayfa</th>
                <th className="px-4 py-2 text-left">Tıklanan</th>
                <th className="px-4 py-2 text-left">Hedef</th>
                <th className="px-4 py-2 text-right">Tıklama</th>
                <th className="px-4 py-2 text-right">Kişi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.slice(0, 40).map((r, i) => (
                <tr key={`${r.path}-${r.targetText}-${r.targetHref}-${i}`}>
                  <td className="max-w-[200px] truncate px-4 py-2" title={r.path}>{r.path}</td>
                  <td className="max-w-[260px] truncate px-4 py-2 font-medium" title={r.targetText}>{r.targetText}</td>
                  <td className="max-w-[240px] truncate px-4 py-2 text-slate-500" title={r.targetHref ?? ""}>{r.targetHref ?? "—"}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.clicks)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.visitors)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function VisitorsTable({
  page,
  range,
  onLoadMore,
  loadingMore,
}: {
  page: SiteAnalyticsVisitorPage;
  range: { from: string; to: string };
  onLoadMore: () => void;
  loadingMore: boolean;
}) {
  const rows = page.rows;
  const hasMore = rows.length < page.total;
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Ziyaretçiler (kişi kişi)</h2>
          <p className="mt-1 text-xs text-slate-500">Son oturumu en yeni olan en üstte. Satıra tıklayınca gezinti akışı açılır.</p>
        </div>
        <p className="text-xs text-slate-500">{num(page.total)} ziyaretçi</p>
      </div>
      {!rows.length ? (
        <p className="p-5 text-sm text-slate-500">Bu dönemde ziyaretçi yok.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-2 text-left">Ziyaretçi</th>
                <th className="px-4 py-2 text-left">Son görülme</th>
                <th className="px-4 py-2 text-right">Oturum</th>
                <th className="px-4 py-2 text-right">Sayfa</th>
                <th className="px-4 py-2 text-right">Tıklama</th>
                <th className="px-4 py-2 text-right">Toplam süre</th>
                <th className="px-4 py-2 text-left">Giriş → Çıkış</th>
                <th className="px-4 py-2 text-left">Kaynak</th>
                <th className="px-4 py-2 text-left">Konum / cihaz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r) => (
                <tr key={r.visitorId} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/ziyaretciler/${r.visitorId}?from=${range.from}&to=${range.to}`}
                      className="font-mono text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      {r.visitorKey.slice(0, 8)}
                    </Link>
                    {r.note ? <p className="mt-0.5 max-w-[160px] truncate text-xs text-slate-500" title={r.note}>{r.note}</p> : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-600 dark:text-slate-300">{formatDateTime(r.lastSeenAt)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.sessions)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.pageviews)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.clicks)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatDuration(r.totalDurationMs)}</td>
                  <td className="max-w-[220px] truncate px-4 py-2 text-slate-600 dark:text-slate-300" title={`${r.lastEntryPath ?? ""} → ${r.lastExitPath ?? ""}`}>
                    {r.lastEntryPath ?? "—"} <span className="text-slate-400">→</span> {r.lastExitPath ?? "—"}
                  </td>
                  <td className="max-w-[140px] truncate px-4 py-2 text-slate-600 dark:text-slate-300" title={r.lastSource ?? ""}>{r.lastSource ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-600 dark:text-slate-300">
                    {[r.city, r.country].filter(Boolean).join(", ") || "—"} · {r.device ?? "?"} · {r.browser ?? "?"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hasMore ? (
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <Button variant="secondary" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Daha fazla göster ({num(page.total - rows.length)} kaldı)
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

export function SiteAnalyticsPanel({
  initialReport,
  initialPreset,
}: {
  initialReport: SiteAnalyticsReport;
  initialPreset: PresetKey | "custom";
}) {
  const router = useRouter();
  const [report, setReport] = useState(initialReport);
  const [preset, setPreset] = useState<PresetKey | "custom">(initialPreset);
  const [customFrom, setCustomFrom] = useState(initialReport.range.from);
  const [customTo, setCustomTo] = useState(initialReport.range.to);
  const [bucket, setBucket] = useState<SiteAnalyticsBucket | "auto">(initialPreset === "custom" ? initialReport.range.bucket : "auto");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(next: { preset: PresetKey | "custom"; from: string; to: string; bucket: SiteAnalyticsBucket | "auto" }) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from: next.from, to: next.to });
      if (next.bucket !== "auto") params.set("bucket", next.bucket);
      const res = await fetch(`/api/admin/site-analytics/report?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Rapor alınamadı.");
      const json = (await res.json()) as { report: SiteAnalyticsReport };
      setReport(json.report);

      const url = new URLSearchParams();
      url.set("preset", next.preset);
      if (next.preset === "custom") {
        url.set("from", next.from);
        url.set("to", next.to);
      }
      if (next.bucket !== "auto") url.set("bucket", next.bucket);
      router.replace(`/admin/ziyaretciler?${url}`, { scroll: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rapor alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  function choosePreset(next: PresetKey) {
    setPreset(next);
    const r = resolveRange(next);
    setCustomFrom(r.from);
    setCustomTo(r.to);
    void load({ preset: next, from: r.from, to: r.to, bucket });
  }

  function applyCustom() {
    if (!customFrom || !customTo || customFrom > customTo) {
      setError("Başlangıç bitişten sonra olamaz.");
      return;
    }
    setPreset("custom");
    void load({ preset: "custom", from: customFrom, to: customTo, bucket });
  }

  function chooseBucket(next: SiteAnalyticsBucket | "auto") {
    setBucket(next);
    void load({ preset, from: report.range.from, to: report.range.to, bucket: next });
  }

  async function loadMoreVisitors() {
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        from: report.range.from,
        to: report.range.to,
        limit: "50",
        offset: String(report.visitors.rows.length),
      });
      const res = await fetch(`/api/admin/site-analytics/visitors?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Ziyaretçiler alınamadı.");
      const json = (await res.json()) as { visitors: SiteAnalyticsVisitorPage };
      setReport((prev) => ({
        ...prev,
        visitors: {
          ...json.visitors,
          rows: [...prev.visitors.rows, ...json.visitors.rows],
          offset: 0,
        },
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ziyaretçiler alınamadı.");
    } finally {
      setLoadingMore(false);
    }
  }

  const s = report.summary;

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button key={p} variant={preset === p ? "primary" : "secondary"} onClick={() => choosePreset(p)} disabled={loading}>
              {PRESET_LABELS[p]}
            </Button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-slate-500">
            Başlangıç
            <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="mt-1 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium text-slate-500">
            Bitiş
            <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="mt-1 py-2 text-sm" />
          </label>
          <Button variant={preset === "custom" ? "primary" : "secondary"} onClick={applyCustom} disabled={loading}>
            Özel aralığı uygula
          </Button>
          <label className="text-xs font-medium text-slate-500">
            Kırılım
            <Select value={bucket} onChange={(e) => chooseBucket(e.target.value as SiteAnalyticsBucket | "auto")} className="mt-1 py-2 text-sm" disabled={loading}>
              <option value="auto">Otomatik</option>
              <option value="day">Günlük</option>
              <option value="week">Haftalık</option>
              <option value="month">Aylık</option>
            </Select>
          </label>
          {loading ? <Loader2 className="size-5 animate-spin text-slate-400" /> : null}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Gösterilen aralık: {report.range.from} – {report.range.to} · {BUCKET_LABELS[report.range.bucket]}
        </p>
        {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Ziyaretçi" value={num(s.visitors)} hint={`${num(s.newVisitors)} yeni, ${num(Math.max(0, s.visitors - s.newVisitors))} geri dönen`} />
        <Kpi label="Oturum" value={num(s.sessions)} hint={`oturum başına ${s.pagesPerSession.toLocaleString("tr-TR")} sayfa`} />
        <Kpi label="Sayfa görüntüleme" value={num(s.pageviews)} hint={`${num(s.clicks)} tıklama`} />
        <Kpi label="Ortalama oturum süresi" value={formatDuration(s.avgDurationMs)} />
        <Kpi
          label="Hemen çıkma"
          value={pct(s.bounceRatePct)}
          hint="tek sayfa görüp ayrılan oturumlar"
          tone={s.bounceRatePct !== null && s.bounceRatePct > 70 ? "bad" : s.bounceRatePct !== null && s.bounceRatePct > 50 ? "warn" : undefined}
        />
        <Kpi label="Yeni ziyaretçi" value={num(s.newVisitors)} tone="good" />
        <Kpi label="Tıklama" value={num(s.clicks)} />
        <Kpi label="En çok kullanılan cihaz" value={report.devices[0]?.label ?? "—"} hint={report.devices[0] ? `${num(report.devices[0].sessions)} oturum` : undefined} />
      </div>

      <TrendChart report={report} />
      <BucketTable report={report} />
      <PagesTable report={report} />

      <div className="grid gap-6 lg:grid-cols-2">
        <BarList title="Nereden geldiler?" rows={report.referrers.map((r) => ({ label: r.source, sessions: r.sessions, visitors: r.visitors }))} emptyText="Kaynak kaydı yok." />
        <BarList title="Cihaz" rows={report.devices} emptyText="Cihaz kaydı yok." />
        <BarList title="Şehir" rows={report.cities} emptyText="Konum bilgisi yok." />
        <BarList title="Tarayıcı" rows={report.browsers} emptyText="Tarayıcı kaydı yok." />
      </div>

      <ClicksTable report={report} />

      <VisitorsTable page={report.visitors} range={report.range} onLoadMore={loadMoreVisitors} loadingMore={loadingMore} />
    </div>
  );
}
