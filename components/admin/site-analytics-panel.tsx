"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarRange,
  ChevronDown,
  Clock,
  Globe2,
  Info,
  Loader2,
  LogOut,
  MapPin,
  MonitorSmartphone,
  MousePointerClick,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FUNNEL_EVENTS, FUNNEL_LABELS } from "@/lib/site-analytics/funnel";
import { CHANNEL_INFO, classifySiteSource, groupByChannel, prettySourceName } from "@/lib/site-analytics/channels";
import { formatDateTime, formatDuration } from "@/lib/site-analytics/format";
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
const UNKNOWN = "Bilinmiyor";

function resolveRange(preset: PresetKey) {
  const today = getIstanbulToday();
  if (preset === "last_7") return { from: shiftIsoDate(today, -6), to: today };
  const r = resolvePreset(preset, today);
  return { from: r.from, to: r.to };
}

function formatDay(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

const num = (v: number) => v.toLocaleString("tr-TR");
const pct = (v: number | null) => (v === null ? "—" : `%${v.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`);
const share = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

const countryNames =
  typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["tr"], { type: "region" }) : null;

function countryLabel(code: string) {
  if (!code || code === UNKNOWN) return UNKNOWN;
  try {
    return countryNames?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function SectionTitle({ icon: Icon, title, hint, right }: { icon?: typeof Users; title: string; hint?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          {Icon ? <Icon className="size-4 text-slate-400" /> : null}
          {title}
        </h2>
        {hint ? <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
      </div>
      {right}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "warn" | "bad";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className="grid size-7 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Icon className="size-3.5" />
        </span>
        {label}
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tracking-tight tabular-nums",
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
  const labelEvery = Math.max(1, Math.ceil(series.length / 10));
  const hasData = series.some((p) => p.sessions > 0);

  return (
    <Card className="p-5">
      <SectionTitle
        title={`Ziyaretçi ve sayfa görüntüleme (${BUCKET_LABELS[range.bucket].toLowerCase()})`}
        hint="Çubuğun üzerine gelince o dönemin ayrıntısı görünür."
        right={
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><i className="inline-block size-2.5 rounded-sm bg-emerald-500" /> Ziyaretçi</span>
            <span className="inline-flex items-center gap-1"><i className="inline-block size-2.5 rounded-sm bg-slate-300 dark:bg-slate-600" /> Sayfa görüntüleme</span>
          </div>
        }
      />
      {!hasData ? (
        <p className="mt-4 text-sm text-slate-500">Bu dönemde kayıtlı ziyaret yok.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <div className="flex h-44 items-end gap-1" style={{ minWidth: `${series.length * 14}px` }}>
            {series.map((p, i) => {
              const vh = Math.round((p.visitors / max) * 100);
              const ph = Math.round((p.pageviews / max) * 100);
              const title = `${formatBucketLabel(p.bucketStart, range.bucket)} · ${p.visitors} ziyaretçi · ${p.sessions} oturum · ${p.pageviews} görüntüleme · ort. ${formatDuration(p.avgDurationMs)}`;
              return (
                <div key={p.bucketStart} className="group flex h-full min-w-[12px] flex-1 flex-col justify-end" title={title}>
                  <div className="flex h-full items-end justify-center gap-px rounded-t group-hover:bg-slate-50 dark:group-hover:bg-slate-900">
                    <div className="w-1/2 rounded-t bg-emerald-500" style={{ height: `${vh}%` }} />
                    <div className="w-1/2 rounded-t bg-slate-300 dark:bg-slate-600" style={{ height: `${ph}%` }} />
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

function SourcesCard({ report }: { report: SiteAnalyticsReport }) {
  const groups = useMemo(() => groupByChannel(report.referrers), [report.referrers]);
  const total = groups.reduce((sum, g) => sum + g.sessions, 0);
  const externalSessions = groups.filter((g) => CHANNEL_INFO[g.channel].external).reduce((sum, g) => sum + g.sessions, 0);
  const max = Math.max(...groups.map((g) => g.sessions), 1);
  const firstInternal = groups.findIndex((g) => !CHANNEL_INFO[g.channel].external);

  return (
    <Card className="p-5">
      <SectionTitle
        icon={Globe2}
        title="Nereden geldiler?"
        hint="Ziyaretçinin siteye hangi bağlantıdan girdiği. Satıra tıklayınca ne anlama geldiği ve alt kaynaklar açılır."
      />
      {!groups.length ? (
        <p className="mt-3 text-sm text-slate-500">Kaynak kaydı yok.</p>
      ) : (
        <>
          <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            <b className="tabular-nums">{num(externalSessions)}</b> oturum dışarıdan geldi (%{share(externalSessions, total)}).
            {total - externalSessions > 0 ? (
              <span className="text-emerald-800/80 dark:text-emerald-300/80">
                {" "}Kalan {num(total - externalSessions)} oturum mevcut müşteri girişi, site içi geçiş ya da senin denemen.
              </span>
            ) : null}
          </div>
          <ul className="mt-3">
            {groups.map((g, i) => {
              const info = CHANNEL_INFO[g.channel];
              return (
                <li key={g.channel} className={cn("border-b border-slate-100 last:border-0 dark:border-slate-800", i === firstInternal && i > 0 ? "mt-3" : "")}>
                  {i === firstInternal ? (
                    <p className="pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Yeni ziyaretçi sayılmaz</p>
                  ) : null}
                  <details className="group py-2.5">
                    <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
                      <span className={cn("size-2.5 shrink-0 rounded-full", info.color)} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-3 text-sm">
                          <span className={cn("truncate font-medium", info.external ? "text-foreground" : "text-slate-500")}>{info.label}</span>
                          <span className="shrink-0 tabular-nums text-slate-500">
                            <b className="font-semibold text-foreground">{num(g.sessions)}</b> oturum · {num(g.visitors)} kişi
                          </span>
                        </span>
                        <span className="mt-1.5 block h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                          <span className={cn("block h-1.5 rounded-full", info.color)} style={{ width: `${Math.max(2, Math.round((g.sessions / max) * 100))}%` }} />
                        </span>
                      </span>
                      <ChevronDown className="size-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
                    </summary>
                    <div className="ml-5 mt-2 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-900">
                      <p className="flex gap-1.5 leading-relaxed text-slate-600 dark:text-slate-300">
                        <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                        {info.description}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {g.sources.map((src) => (
                          <li key={src.name} className="flex justify-between gap-3 text-slate-600 dark:text-slate-300">
                            <span className="truncate" title={src.name}>{src.name}</span>
                            <span className="shrink-0 tabular-nums">{num(src.sessions)} oturum · {num(src.visitors)} kişi</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}

function MiniBars({ rows, labelOf, color = "bg-emerald-500", limit = 8 }: {
  rows: SiteAnalyticsBreakdownRow[];
  labelOf?: (label: string) => string;
  color?: string;
  limit?: number;
}) {
  const max = Math.max(...rows.map((r) => r.sessions), 1);
  return (
    <ul className="space-y-2">
      {rows.slice(0, limit).map((r) => {
        const label = labelOf ? labelOf(r.label) : r.label;
        const unknown = r.label === UNKNOWN;
        return (
          <li key={r.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className={cn("truncate", unknown ? "italic text-slate-400" : "")} title={label}>{label}</span>
              <span className="shrink-0 tabular-nums text-slate-500">{num(r.sessions)} · {num(r.visitors)} kişi</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
              <div className={cn("h-1.5 rounded-full", unknown ? "bg-slate-300 dark:bg-slate-600" : color)} style={{ width: `${Math.max(2, Math.round((r.sessions / max) * 100))}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function LocationCard({ report }: { report: SiteAnalyticsReport }) {
  const [tab, setTab] = useState<"country" | "city">("city");
  const rows = tab === "country" ? report.countries : report.cities;
  const unknownCities = report.cities.find((r) => r.label === UNKNOWN)?.sessions ?? 0;
  const cityTotal = report.cities.reduce((sum, r) => sum + r.sessions, 0);
  const unknownShare = share(unknownCities, cityTotal);

  return (
    <Card className="p-5">
      <SectionTitle
        icon={MapPin}
        title="Konum"
        hint="IP adresinden tahmin edilir; VPN ya da mobil operatör kullananlarda başka il görünebilir."
        right={
          <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs dark:border-slate-700">
            {(["city", "country"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={cn("rounded-md px-2.5 py-1 font-medium", tab === k ? "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900" : "text-slate-500")}
              >
                {k === "city" ? "Şehir" : "Ülke"}
              </button>
            ))}
          </div>
        }
      />
      {tab === "city" && unknownShare >= 30 ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Ziyaretlerin %{unknownShare}&apos;inde şehir yok: 29 Eylül – 14 Ekim arasında Cloudflare şehir bilgisini göndermedi, o
          kayıtlar “Bilinmiyor” kalır. Ülke bilgisi o dönemde de var, “Ülke” sekmesine bakabilirsin.
        </p>
      ) : null}
      <div className="mt-4">
        {!rows.length ? (
          <p className="text-sm text-slate-500">Konum bilgisi yok.</p>
        ) : (
          <MiniBars rows={rows} labelOf={tab === "country" ? countryLabel : undefined} color="bg-sky-500" />
        )}
      </div>
    </Card>
  );
}

function TechCard({ report }: { report: SiteAnalyticsReport }) {
  return (
    <Card className="p-5">
      <SectionTitle icon={MonitorSmartphone} title="Cihaz ve tarayıcı" />
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Cihaz</p>
          {report.devices.length ? <MiniBars rows={report.devices} color="bg-indigo-500" limit={5} /> : <p className="text-sm text-slate-500">Kayıt yok.</p>}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Tarayıcı</p>
          {report.browsers.length ? <MiniBars rows={report.browsers} color="bg-indigo-500" limit={5} /> : <p className="text-sm text-slate-500">Kayıt yok.</p>}
        </div>
      </div>
    </Card>
  );
}

function FunnelCard({ report }: { report: SiteAnalyticsReport }) {
  const steps = FUNNEL_EVENTS.filter((e) => e !== "signup_error");
  const errors = report.funnel.find((r) => r.event_name === "signup_error")?.visitors ?? 0;
  const values = steps.map((e) => report.funnel.find((r) => r.event_name === e)?.visitors ?? 0);
  const max = Math.max(...values, 1);

  return (
    <Card className="p-5">
      <SectionTitle
        title="Demo ve kayıt adımları"
        hint="Her adımı yapan tekil ziyaretçi sayısı. Demo zorunlu adım değildir; sayılar aynı grubun dönüşüm oranı değildir."
      />
      {!report.funnelAvailable ? (
        <p className="mt-4 text-sm text-amber-700">Dönüşüm verisi şu anda alınamıyor. Ölçüm veritabanı kurulumu ve bağlantısı kontrol edilmeli.</p>
      ) : (
        <>
          <ol className="mt-4 space-y-2.5">
            {steps.map((event, i) => {
              const v = values[i];
              const done = event === "signup_complete";
              return (
                <li key={event} className="grid grid-cols-[1.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
                  <span className={cn("grid size-6 place-items-center rounded-full text-[11px] font-bold", done ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800")}>
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block truncate", done ? "font-semibold text-emerald-700" : "")}>{FUNNEL_LABELS[event]}</span>
                    <span className="mt-1 block h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                      <span className={cn("block h-1.5 rounded-full", done ? "bg-emerald-600" : "bg-emerald-400")} style={{ width: `${v ? Math.max(3, Math.round((v / max) * 100)) : 0}%` }} />
                    </span>
                  </span>
                  <span className="text-right font-semibold tabular-nums">{num(v)}</span>
                </li>
              );
            })}
          </ol>
          {errors > 0 ? (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              {num(errors)} kişi kayıt sırasında hata aldı.
            </p>
          ) : null}
        </>
      )}
    </Card>
  );
}

function TableShell({ title, hint, right, children }: { title: string; hint?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="px-5 pt-5">
        <SectionTitle title={title} hint={hint} right={right} />
      </div>
      {children}
    </Card>
  );
}

const TH = "px-4 py-2.5 font-medium";
const THEAD = "bg-slate-50 text-xs text-slate-500 dark:bg-slate-900";
const ROW = "hover:bg-slate-50/70 dark:hover:bg-slate-900/60";

function PagesTable({ report }: { report: SiteAnalyticsReport }) {
  const rows = report.pages;
  return (
    <TableShell title="Sayfalar" hint="Kırmızı çıkış oranı: ziyaretçilerin çoğu siteyi o sayfada bırakıyor, iyileştirme adayı. Kaydırma: sayfanın ne kadarının görüldüğü.">
      {!rows.length ? (
        <p className="p-5 text-sm text-slate-500">Bu dönemde sayfa görüntülemesi yok.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={THEAD}>
              <tr>
                <th className={cn(TH, "text-left")}>Sayfa</th>
                <th className={cn(TH, "text-right")}>Görüntüleme</th>
                <th className={cn(TH, "text-right")}>Kişi</th>
                <th className={cn(TH, "text-right")}>Ort. süre</th>
                <th className={cn(TH, "text-right")}>Kaydırma</th>
                <th className={cn(TH, "text-right")}>Giriş</th>
                <th className={cn(TH, "text-right")}>Çıkış oranı</th>
                <th className={cn(TH, "text-right")}>Tıklama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r) => (
                <tr key={r.path} className={ROW}>
                  <td className="max-w-[280px] truncate px-4 py-2 font-medium" title={r.path}>{r.path}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.pageviews)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.visitors)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatDuration(r.avgTimeMs)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">%{r.avgScrollPct}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.entries)}</td>
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
    </TableShell>
  );
}

function ClicksTable({ report }: { report: SiteAnalyticsReport }) {
  const rows = report.clicks;
  return (
    <TableShell title="En çok tıklananlar" hint="Hangi sayfada hangi düğmeye ya da bağlantıya basıldığı.">
      {!rows.length ? (
        <p className="p-5 text-sm text-slate-500">Bu dönemde tıklama kaydı yok.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={THEAD}>
              <tr>
                <th className={cn(TH, "text-left")}>Tıklanan</th>
                <th className={cn(TH, "text-left")}>Sayfa</th>
                <th className={cn(TH, "text-left")}>Gittiği yer</th>
                <th className={cn(TH, "text-right")}>Tıklama</th>
                <th className={cn(TH, "text-right")}>Kişi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.slice(0, 40).map((r, i) => (
                <tr key={`${r.path}-${r.targetText}-${r.targetHref}-${i}`} className={ROW}>
                  <td className="max-w-[260px] truncate px-4 py-2 font-medium" title={r.targetText}>{r.targetText}</td>
                  <td className="max-w-[200px] truncate px-4 py-2 text-slate-600 dark:text-slate-300" title={r.path}>{r.path}</td>
                  <td className="max-w-[240px] truncate px-4 py-2 text-slate-500" title={r.targetHref ?? ""}>{r.targetHref ?? "—"}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.clicks)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.visitors)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </TableShell>
  );
}

function BucketTable({ report }: { report: SiteAnalyticsReport }) {
  const rows = report.series.filter((p) => p.sessions > 0);
  if (!rows.length) return null;
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-slate-600 hover:text-foreground dark:text-slate-300 [&::-webkit-details-marker]:hidden">
        <ChevronDown className="size-4 transition group-open:rotate-180" />
        Dönem dökümünü tablo olarak göster
      </summary>
      <Card className="mt-3 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={THEAD}>
              <tr>
                <th className={cn(TH, "text-left")}>Dönem</th>
                <th className={cn(TH, "text-right")}>Ziyaretçi</th>
                <th className={cn(TH, "text-right")}>Oturum</th>
                <th className={cn(TH, "text-right")}>Görüntüleme</th>
                <th className={cn(TH, "text-right")}>Ort. süre</th>
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
    </details>
  );
}

function SourceBadge({ source }: { source: string | null }) {
  const channel = classifySiteSource(source);
  const info = CHANNEL_INFO[channel];
  const detail = source && channel !== "direct" ? prettySourceName(source) : info.label;
  return (
    <span className="inline-flex max-w-[180px] items-center gap-1.5" title={`${info.label}${source ? ` · ${source}` : ""}`}>
      <span className={cn("size-2 shrink-0 rounded-full", info.color)} />
      <span className="truncate">{detail}</span>
    </span>
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
    <TableShell
      title="Ziyaretçiler (kişi kişi)"
      hint="Son görülen en üstte. Koda tıklayınca o kişinin sayfa sayfa gezintisi açılır."
      right={<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{num(page.total)} ziyaretçi</span>}
    >
      {!rows.length ? (
        <p className="p-5 text-sm text-slate-500">Bu dönemde ziyaretçi yok.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={THEAD}>
              <tr>
                <th className={cn(TH, "text-left")}>Ziyaretçi</th>
                <th className={cn(TH, "text-left")}>Son görülme</th>
                <th className={cn(TH, "text-left")}>Kaynak</th>
                <th className={cn(TH, "text-left")}>Konum / cihaz</th>
                <th className={cn(TH, "text-right")}>Oturum</th>
                <th className={cn(TH, "text-right")}>Sayfa</th>
                <th className={cn(TH, "text-right")}>Toplam süre</th>
                <th className={cn(TH, "text-left")}>Giriş → Çıkış</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r) => (
                <tr key={r.visitorId} className={ROW}>
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
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300"><SourceBadge source={r.lastSource} /></td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-600 dark:text-slate-300">
                    {r.city ?? (r.country ? countryLabel(r.country) : "—")} · {r.device ?? "?"} · {r.browser ?? "?"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.sessions)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{num(r.pageviews)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatDuration(r.totalDurationMs)}</td>
                  <td className="max-w-[220px] truncate px-4 py-2 text-slate-600 dark:text-slate-300" title={`${r.lastEntryPath ?? ""} → ${r.lastExitPath ?? ""}`}>
                    {r.lastEntryPath ?? "—"} <span className="text-slate-400">→</span> {r.lastExitPath ?? "—"}
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
    </TableShell>
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
  const [showCustom, setShowCustom] = useState(initialPreset === "custom");
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
  const returning = Math.max(0, s.visitors - s.newVisitors);
  const rangeText =
    report.range.from === report.range.to ? formatDay(report.range.from) : `${formatDay(report.range.from)} – ${formatDay(report.range.to)}`;
  const chip = (active: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-60",
      active ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
    );

  return (
    <div className="space-y-5">
      <Card className="p-3 sm:p-4">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => choosePreset(p)} disabled={loading} className={chip(preset === p)}>
              {PRESET_LABELS[p]}
            </button>
          ))}
          <button type="button" onClick={() => setShowCustom((v) => !v)} className={chip(preset === "custom")}>
            <CalendarRange className="size-4" /> Özel tarih
          </button>
        </div>
        {showCustom ? (
          <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <label className="text-xs font-medium text-slate-500">
              Başlangıç
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="mt-1 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-500">
              Bitiş
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="mt-1 py-2 text-sm" />
            </label>
            <Button onClick={applyCustom} disabled={loading}>Uygula</Button>
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
          <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            {loading ? <Loader2 className="size-4 animate-spin text-emerald-600" /> : <CalendarRange className="size-4 text-slate-400" />}
            {rangeText}
          </p>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
            Grafik
            <Select value={bucket} onChange={(e) => chooseBucket(e.target.value as SiteAnalyticsBucket | "auto")} className="py-1.5 text-sm" disabled={loading}>
              <option value="auto">Otomatik</option>
              <option value="day">Günlük</option>
              <option value="week">Haftalık</option>
              <option value="month">Aylık</option>
            </Select>
          </label>
        </div>
        {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
      </Card>

      <div className={cn("space-y-5 transition-opacity", loading ? "opacity-60" : "")}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icon={Users} label="Ziyaretçi" value={num(s.visitors)} hint={`${num(s.newVisitors)} yeni · ${num(returning)} geri dönen`} />
          <Kpi icon={MousePointerClick} label="Oturum" value={num(s.sessions)} hint={`${num(s.pageviews)} sayfa · ${num(s.clicks)} tıklama`} />
          <Kpi icon={Clock} label="Ort. kalma süresi" value={formatDuration(s.avgDurationMs)} hint={`oturum başına ${s.pagesPerSession.toLocaleString("tr-TR")} sayfa`} />
          <Kpi
            icon={LogOut}
            label="Hemen çıkma"
            value={pct(s.bounceRatePct)}
            hint="tek sayfa görüp ayrılanlar"
            tone={s.bounceRatePct !== null && s.bounceRatePct > 70 ? "bad" : s.bounceRatePct !== null && s.bounceRatePct > 50 ? "warn" : undefined}
          />
        </div>

        <TrendChart report={report} />

        <div className="grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3"><SourcesCard report={report} /></div>
          <div className="lg:col-span-2"><LocationCard report={report} /></div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <FunnelCard report={report} />
          <TechCard report={report} />
        </div>

        <PagesTable report={report} />
        <ClicksTable report={report} />
        <VisitorsTable page={report.visitors} range={report.range} onLoadMore={loadMoreVisitors} loadingMore={loadingMore} />
        <BucketTable report={report} />
      </div>
    </div>
  );
}
