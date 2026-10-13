"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Clock3, KeyRound, Monitor, Radio, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AdminLoginLogEntry, AdminPanelVisit } from "@/lib/types";
import { cn, formatTimeAgo } from "@/lib/utils";

// Panel açıkken dakikada bir ping gelir (panel-visit-tracker); 2,5 dk içinde
// görülen "şu an panelde", 30 dk içinde görülen "az önce ayrıldı" sayılır.
const ONLINE_MS = 150_000;
const RECENT_MS = 30 * 60_000;
const REFRESH_MS = 60_000;

type Filter = "all" | "online" | "today" | "week" | "never";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "online", label: "Şu an panelde" },
  { key: "today", label: "Bugün girenler" },
  { key: "week", label: "Son 7 gün" },
  { key: "never", label: "Hiç girmemiş" },
];

const PAGE_LABELS: [string, string][] = [
  ["/products/add", "Ürün Ekle"],
  ["/products/bulk", "Toplu Ürün Ekleme"],
  ["/products/market-catalog", "Master Katalog"],
  ["/products/stock-import", "Stok İçe Aktarma"],
  ["/products/showcase", "Vitrin"],
  ["/products/best-sellers", "Çok Satanlar"],
  ["/products/suggestions", "Ürün Önerileri"],
  ["/products/bizimhesap", "BizimHesap"],
  ["/products", "Ürünler"],
  ["/categories", "Kategoriler"],
  ["/access-codes", "Fiyat Listeleri"],
  ["/basvurular", "Başvurular"],
  ["/customers", "Müşteriler"],
  ["/siparisler", "Siparişler"],
  ["/reports/iller", "İller Raporu"],
  ["/reports/satis", "Satış Raporu"],
  ["/reports", "Raporlar"],
  ["/magnetler", "Magnetler"],
  ["/settings", "Ayarlar"],
];

function pageLabel(path: string | null) {
  if (!path) return null;
  const clean = path.replace(/^\/dashboard/, "") || "/";
  if (clean === "/") return "Genel Bakış";
  const hit = PAGE_LABELS.find(([prefix]) => clean === prefix || clean.startsWith(`${prefix}/`));
  return hit ? hit[1] : clean;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(
    new Date(value),
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(value));
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", weekday: "short", timeZone: "Europe/Istanbul" }).format(
    new Date(value),
  );
}

function formatDuration(visit: AdminPanelVisit) {
  const minutes = Math.round((new Date(visit.last_seen_at).getTime() - new Date(visit.started_at).getTime()) / 60_000);
  if (minutes < 1) return "< 1 dk";
  if (minutes < 60) return `${minutes} dk`;
  return `${Math.floor(minutes / 60)} sa ${minutes % 60} dk`;
}

function startOfTodayIstanbul(now: number) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(now));
  // İstanbul UTC+3 sabit (yaz saati yok).
  return new Date(`${parts}T00:00:00+03:00`).getTime();
}

type Presence = "online" | "recent" | "idle" | "none" | "untracked";

function presenceOf(entry: AdminLoginLogEntry, now: number): Presence {
  if (entry.role === "super_admin") return "untracked";
  if (!entry.last_panel_seen_at) return "none";
  const age = now - new Date(entry.last_panel_seen_at).getTime();
  if (age <= ONLINE_MS) return "online";
  if (age <= RECENT_MS) return "recent";
  return "idle";
}

function PresenceDot({ presence }: { presence: Presence }) {
  return (
    <span className="relative inline-flex size-2.5 shrink-0">
      {presence === "online" ? (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      ) : null}
      <span
        className={cn(
          "relative inline-flex size-2.5 rounded-full",
          presence === "online" && "bg-emerald-500",
          presence === "recent" && "bg-amber-400",
          presence === "idle" && "bg-slate-300",
          (presence === "none" || presence === "untracked") && "bg-slate-200",
        )}
      />
    </span>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  hint: string;
  tone: "emerald" | "sky" | "violet" | "slate";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    violet: "bg-violet-50 text-violet-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold tabular-nums tracking-tight text-slate-900">{value}</p>
        <p className="truncate text-sm font-medium text-slate-700">{label}</p>
        <p className="truncate text-xs text-slate-500">{hint}</p>
      </div>
    </Card>
  );
}

export function AdminLoginLogsPanel({ entries, loadedAt }: { entries: AdminLoginLogEntry[]; loadedAt: string }) {
  const router = useRouter();
  // Sunucunun yüklediği an; router.refresh() ile her dakika yeni değer gelir.
  const now = new Date(loadedAt).getTime();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [showSuperAdmins, setShowSuperAdmins] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  // Sayfa açık kaldıkça kendini tazeler: "şu an panelde" canlı kalsın.
  useEffect(() => {
    const tick = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESH_MS);
    return () => window.clearInterval(tick);
  }, [router]);

  const todayStart = startOfTodayIstanbul(now);
  const weekStart = now - 7 * 24 * 60 * 60_000;

  const tenantAdmins = useMemo(() => entries.filter((e) => e.role !== "super_admin"), [entries]);
  const stats = useMemo(
    () => ({
      online: tenantAdmins.filter((e) => presenceOf(e, now) === "online").length,
      today: tenantAdmins.filter((e) => e.visits.some((v) => new Date(v.last_seen_at).getTime() >= todayStart)).length,
      week: tenantAdmins.filter((e) => e.visit_count_7d > 0).length,
      never: tenantAdmins.filter((e) => !e.last_panel_seen_at && !e.last_sign_in_at).length,
    }),
    [tenantAdmins, now, todayStart],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    return entries.filter((e) => {
      if (!showSuperAdmins && e.role === "super_admin") return false;
      if (q) {
        const hay = [e.full_name, e.email, e.tenant_name, e.tenant_subdomain].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
        if (!hay.includes(q)) return false;
      }
      const presence = presenceOf(e, now);
      switch (filter) {
        case "online":
          return presence === "online";
        case "today":
          return e.visits.some((v) => new Date(v.last_seen_at).getTime() >= todayStart);
        case "week":
          return e.visits.some((v) => new Date(v.last_seen_at).getTime() >= weekStart);
        case "never":
          return !e.last_panel_seen_at && !e.last_sign_in_at;
        default:
          return true;
      }
    });
  }, [entries, filter, query, showSuperAdmins, now, todayStart, weekStart]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Radio} label="Şu an panelde" value={stats.online} hint="Son 2-3 dakikada görülen" tone="emerald" />
        <StatTile icon={Clock3} label="Bugün giren" value={stats.today} hint="İstanbul saatiyle bugün" tone="sky" />
        <StatTile icon={Users} label="Son 7 günde giren" value={stats.week} hint={`${tenantAdmins.length} mağaza yöneticisinden`} tone="violet" />
        <StatTile icon={KeyRound} label="Hiç girmemiş" value={stats.never} hint="Hesap açıldı, panel görülmedi" tone="slate" />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  filter === f.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {f.label}
                {f.key === "online" && stats.online > 0 ? (
                  <span className={cn("ml-1.5 rounded-full px-1.5 text-[10px]", filter === f.key ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700")}>
                    {stats.online}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              <input type="checkbox" checked={showSuperAdmins} onChange={(e) => setShowSuperAdmins(e.target.checked)} className="size-3.5" />
              Süper adminleri göster
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ad, e-posta, mağaza…"
                className="h-9 w-56 pl-8 text-sm"
              />
            </div>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Bu filtreye uyan kullanıcı yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-4 py-2.5 font-semibold">Kullanıcı</th>
                  <th className="px-4 py-2.5 font-semibold">Durum</th>
                  <th className="px-4 py-2.5 font-semibold">Son görülme</th>
                  <th className="px-4 py-2.5 font-semibold">Son 7 g / 30 g</th>
                  <th className="px-4 py-2.5 font-semibold">Şifreli giriş</th>
                  <th className="px-4 py-2.5 font-semibold">Hesap</th>
                  <th className="w-10 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {visible.map((entry) => {
                  const presence = presenceOf(entry, now);
                  const expanded = open === entry.user_id;
                  const page = pageLabel(entry.last_path);
                  return (
                    <LogRow
                      key={entry.user_id}
                      entry={entry}
                      presence={presence}
                      page={page}
                      expanded={expanded}
                      now={now}
                      onToggle={() => setOpen(expanded ? null : entry.user_id)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
          {visible.length} kullanıcı · en son panelde görülen en üstte · sayfa her dakika kendini tazeler · süper admin
          ziyaretleri kaydedilmez.
        </p>
      </Card>
    </div>
  );
}

function LogRow({
  entry,
  presence,
  page,
  expanded,
  now,
  onToggle,
}: {
  entry: AdminLoginLogEntry;
  presence: Presence;
  page: string | null;
  expanded: boolean;
  now: number;
  onToggle: () => void;
}) {
  const hasVisits = entry.visits.length > 0;
  const statusText =
    presence === "online"
      ? "Şu an panelde"
      : presence === "recent"
        ? "Az önce ayrıldı"
        : presence === "untracked"
          ? "İzlenmiyor"
          : presence === "none"
            ? entry.last_sign_in_at
              ? "Panel kaydı yok"
              : "Hiç girmedi"
            : "Çevrimdışı";
  return (
    <>
      <tr
        className={cn("border-t border-slate-100 transition-colors", hasVisits && "cursor-pointer hover:bg-slate-50", expanded && "bg-slate-50")}
        onClick={hasVisits ? onToggle : undefined}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">{entry.full_name ?? "İsimsiz kullanıcı"}</span>
            {entry.role === "super_admin" ? <Badge className="bg-violet-100 text-violet-700">Süper admin</Badge> : null}
          </div>
          <div className="text-xs text-slate-500">
            {entry.tenant_name ? (
              <>
                <span className="font-medium text-slate-600">{entry.tenant_name}</span>
                {entry.tenant_subdomain ? <span> · {entry.tenant_subdomain}</span> : null}
                <span> · </span>
              </>
            ) : null}
            {entry.email}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <PresenceDot presence={presence} />
            <span
              className={cn(
                "font-medium",
                presence === "online" && "text-emerald-700",
                presence === "recent" && "text-amber-700",
                (presence === "idle" || presence === "none" || presence === "untracked") && "text-slate-500",
              )}
            >
              {statusText}
            </span>
          </div>
          {page && (presence === "online" || presence === "recent") ? (
            <div className="mt-0.5 text-xs text-slate-500">{presence === "online" ? "Açık sayfa" : "Son sayfa"}: {page}</div>
          ) : null}
        </td>
        <td className="px-4 py-3">
          {entry.last_panel_seen_at ? (
            <>
              <div className="font-medium text-slate-900">{formatTimeAgo(entry.last_panel_seen_at)}</div>
              <div className="text-xs text-slate-500">
                {formatDateTime(entry.last_panel_seen_at)}
                {entry.last_device ? ` · ${entry.last_device}` : ""}
              </div>
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 tabular-nums">
          {hasVisits ? (
            <>
              <span className="font-semibold text-slate-900">{entry.visit_count_7d}</span>
              <span className="text-slate-400"> / </span>
              <span className="text-slate-700">{entry.visit_count_30d}</span>
              <span className="text-xs text-slate-500"> ziyaret</span>
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          {entry.last_sign_in_at ? (
            <>
              <div className="text-slate-700">{formatTimeAgo(entry.last_sign_in_at)}</div>
              <div className="text-xs text-slate-500">{formatDateTime(entry.last_sign_in_at)}</div>
            </>
          ) : (
            <span className="text-slate-400">Hiç</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(entry.created_at)}</td>
        <td className="px-2 py-3 text-slate-400">
          {hasVisits ? <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} /> : null}
        </td>
      </tr>
      {expanded ? (
        <tr className="border-t border-slate-100 bg-slate-50/60">
          <td colSpan={7} className="px-4 pb-4 pt-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Son 30 günün ziyaretleri</p>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              {entry.visits.map((visit) => {
                const live = now - new Date(visit.last_seen_at).getTime() <= ONLINE_MS;
                return (
                  <div key={visit.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-100 px-3 py-2 text-sm last:border-b-0">
                    <span className="w-28 text-slate-700">{formatDay(visit.started_at)}</span>
                    <span className="w-28 tabular-nums text-slate-900">
                      {formatTime(visit.started_at)} – {live ? "devam ediyor" : formatTime(visit.last_seen_at)}
                    </span>
                    <span className="w-20 text-xs text-slate-500">{formatDuration(visit)}</span>
                    <span className="w-24 text-xs text-slate-500">{visit.page_views} sayfa</span>
                    <span className="min-w-0 flex-1 truncate text-xs text-slate-600">
                      Son sayfa: {pageLabel(visit.last_path) ?? "—"}
                    </span>
                    {visit.device ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Monitor className="size-3.5" />
                        {visit.device}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
