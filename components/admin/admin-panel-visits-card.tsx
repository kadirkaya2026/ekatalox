import { MonitorSmartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { describeDevice, formatVisitDuration, panelPageLabel } from "@/lib/admin/panel-visit-format";
import type { PanelVisit } from "@/lib/types";
import { cn, formatTimeAgo } from "@/lib/utils";

const ONLINE_MS = 150_000;

function formatDay(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", weekday: "short", timeZone: "Europe/Istanbul" }).format(
    new Date(value),
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(value));
}

// Süper admin tenant detayı: tenant adminin panel ziyaretleri (0157). Açık kalan
// oturumla girişler de sayılır; 30 dk'dan uzun ara yeni ziyaret başlatır.
export function AdminPanelVisitsCard({ visits, loadedAt }: { visits: PanelVisit[]; loadedAt: string }) {
  const now = new Date(loadedAt).getTime();
  const latest = visits[0] ?? null;
  const online = latest ? now - new Date(latest.last_seen_at).getTime() <= ONLINE_MS : false;
  const weekAgo = now - 7 * 24 * 60 * 60_000;
  const weekCount = visits.filter((v) => new Date(v.started_at).getTime() >= weekAgo).length;
  const totalMinutes = visits.reduce(
    (acc, v) => acc + Math.max(0, (new Date(v.last_seen_at).getTime() - new Date(v.started_at).getTime()) / 60_000),
    0,
  );

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Panel ziyaretleri</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Mağaza sahibinin paneli açtığı zamanlar; açık kalan oturumla girişler dahil. Son {visits.length} ziyaret.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold",
              online ? "bg-emerald-50 text-emerald-700" : latest ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700",
            )}
          >
            <span className={cn("size-2 rounded-full", online ? "bg-emerald-500" : latest ? "bg-slate-400" : "bg-amber-400")} />
            {online ? "Şu an panelde" : latest ? `Son: ${formatTimeAgo(latest.last_seen_at)}` : "Henüz girmedi"}
          </span>
          {visits.length ? (
            <>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">{weekCount} ziyaret / 7 gün</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                toplam {totalMinutes < 60 ? `${Math.round(totalMinutes)} dk` : `${Math.round(totalMinutes / 60)} sa`}
              </span>
            </>
          ) : null}
        </div>
      </div>

      {visits.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                <th className="px-5 py-2.5 font-semibold">Gün</th>
                <th className="px-4 py-2.5 font-semibold">Saat</th>
                <th className="px-4 py-2.5 font-semibold">Süre</th>
                <th className="px-4 py-2.5 font-semibold">Sayfa</th>
                <th className="px-4 py-2.5 font-semibold">Son sayfa</th>
                <th className="px-4 py-2.5 font-semibold">Cihaz</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit, index) => {
                const live = index === 0 && online;
                return (
                  <tr key={visit.id} className={cn("border-t border-slate-100", live && "bg-emerald-50/40")}>
                    <td className="px-5 py-2.5 text-slate-700">{formatDay(visit.started_at)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-900">
                      {formatTime(visit.started_at)} – {live ? <span className="font-medium text-emerald-700">devam ediyor</span> : formatTime(visit.last_seen_at)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{formatVisitDuration(visit.started_at, visit.last_seen_at)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-600">{visit.page_views}</td>
                    <td className="px-4 py-2.5 text-slate-600">{panelPageLabel(visit.last_path) ?? "—"}</td>
                    <td className="px-4 py-2.5 text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <MonitorSmartphone className="size-3.5" />
                        {describeDevice(visit.user_agent) ?? "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-5 py-8 text-center text-sm text-slate-500">Bu mağazanın yöneticisi paneli henüz hiç açmamış.</p>
      )}
    </Card>
  );
}
