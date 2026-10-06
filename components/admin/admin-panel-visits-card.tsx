import { Card } from "@/components/ui/card";
import type { PanelVisit } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function formatDuration(start: string, end: string) {
  const minutes = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000));
  if (minutes < 1) return "1 dk'dan kısa";
  if (minutes < 60) return `${minutes} dk`;
  return `${Math.floor(minutes / 60)} sa ${minutes % 60} dk`;
}

function deviceLabel(userAgent: string | null) {
  if (!userAgent) return "—";
  if (/iPhone|Android.+Mobile/i.test(userAgent)) return "Telefon";
  if (/iPad|Android/i.test(userAgent)) return "Tablet";
  return "Bilgisayar";
}

// Süper admin tenant detayı: tenant adminin panel ziyaretleri (0157). Açık kalan
// oturumla girişler de sayılır; 30 dk'dan uzun ara yeni ziyaret başlatır.
export function AdminPanelVisitsCard({ visits }: { visits: PanelVisit[] }) {
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Panel ziyaretleri</h2>
        <p className="text-xs text-slate-500">
          {visits.length ? `Son: ${formatTimeAgo(visits[0].last_seen_at)}` : "Henüz kayıt yok"}
        </p>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Mağaza sahibinin paneli açtığı zamanlar (açık kalan oturumla girişler dahil).
      </p>

      {visits.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.12em] text-slate-500">
                <th className="px-3 py-2 font-medium">Başlangıç</th>
                <th className="px-3 py-2 font-medium">Süre</th>
                <th className="px-3 py-2 font-medium">Sayfa</th>
                <th className="px-3 py-2 font-medium">Cihaz</th>
                <th className="px-3 py-2 font-medium">Son sayfa</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr key={visit.id} className="border-t border-slate-100">
                  <td className="px-3 py-2.5 text-slate-900">{formatDateTime(visit.started_at)}</td>
                  <td className="px-3 py-2.5 text-slate-600">{formatDuration(visit.started_at, visit.last_seen_at)}</td>
                  <td className="px-3 py-2.5 text-slate-600">{visit.page_views}</td>
                  <td className="px-3 py-2.5 text-slate-600">{deviceLabel(visit.user_agent)}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{visit.last_path ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Card>
  );
}
