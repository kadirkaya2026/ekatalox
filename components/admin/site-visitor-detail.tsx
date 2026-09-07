import Link from "next/link";
import { ArrowLeft, MousePointerClick, Eye, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatDuration } from "@/components/admin/site-analytics-panel";
import type { SiteSessionDetail, SiteVisitorDetail } from "@/lib/site-analytics/types";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { timeStyle: "medium", timeZone: "Europe/Istanbul" }).format(new Date(value));
}

function SessionCard({ session, index }: { session: SiteSessionDetail; index: number }) {
  const source = session.utmSource ?? session.referrerHost ?? "Doğrudan / yer imi";
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Oturum {index}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{formatDateTime(session.startedAt)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDuration(session.durationMs)} · {session.pageviewCount} sayfa · {session.clickCount} tıklama
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{source}</Badge>
          {session.utmCampaign ? <Badge variant="neutral">{session.utmCampaign}</Badge> : null}
          <Badge variant="neutral">
            {[session.city, session.country].filter(Boolean).join(", ") || "Konum yok"}
          </Badge>
          <Badge variant="neutral">
            {session.device ?? "?"} · {session.browser ?? "?"} · {session.os ?? "?"}
          </Badge>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Giriş: <span className="font-medium text-foreground">{session.entryPath ?? "—"}</span> · Çıkış:{" "}
        <span className="font-medium text-foreground">{session.exitPath ?? "—"}</span>
        {session.referrer ? (
          <>
            {" "}· Yönlendiren: <span className="break-all">{session.referrer}</span>
          </>
        ) : null}
      </p>

      {session.events.length ? (
        <ol className="mt-4 space-y-2 border-l border-slate-200 pl-4 dark:border-slate-800">
          {session.events.map((e) => (
            <li key={e.id} className="relative text-sm">
              <span
                className={
                  "absolute -left-[21px] top-1.5 size-2.5 rounded-full " +
                  (e.eventType === "pageview" ? "bg-emerald-500" : e.eventType === "click" ? "bg-slate-900 dark:bg-slate-300" : "bg-amber-500")
                }
              />
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="w-16 shrink-0 tabular-nums text-xs text-slate-500">{formatTime(e.createdAt)}</span>
                {e.eventType === "pageview" ? (
                  <>
                    <Eye className="size-3.5 text-emerald-600" />
                    <span className="font-medium">{e.path}</span>
                    {e.pageTitle ? <span className="text-xs text-slate-500">{e.pageTitle}</span> : null}
                  </>
                ) : e.eventType === "click" ? (
                  <>
                    <MousePointerClick className="size-3.5 text-slate-500" />
                    <span>
                      <span className="font-medium">{e.targetText ?? "(metinsiz)"}</span>
                      {e.targetHref ? <span className="text-xs text-slate-500"> → {e.targetHref}</span> : null}
                    </span>
                    <span className="text-xs text-slate-400">{e.path}</span>
                  </>
                ) : (
                  <>
                    <LogOut className="size-3.5 text-amber-600" />
                    <span className="text-slate-600 dark:text-slate-300">
                      {e.path} sayfasında {formatDuration(e.timeOnPageMs ?? 0)} kaldı
                      {e.scrollPct !== null ? `, %${e.scrollPct} kaydırdı` : ""}
                    </span>
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Bu oturumun olay kaydı silinmiş (180 gün saklama).</p>
      )}
    </Card>
  );
}

export function SiteVisitorDetailView({ visitor, backHref }: { visitor: SiteVisitorDetail; backHref: string }) {
  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="size-4" /> Ziyaretçi listesine dön
      </Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ziyaretçi</p>
            <p className="mt-1 font-mono text-lg font-semibold text-foreground">{visitor.visitorKey.slice(0, 12)}</p>
            <p className="mt-1 text-xs text-slate-500">
              İlk görülme {formatDateTime(visitor.firstSeenAt)} · son görülme {formatDateTime(visitor.lastSeenAt)}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold">{visitor.sessionCount}</p>
              <p className="text-xs text-slate-500">oturum</p>
            </div>
            <div>
              <p className="text-xl font-bold">{visitor.pageviewCount}</p>
              <p className="text-xs text-slate-500">sayfa</p>
            </div>
            <div>
              <p className="text-xl font-bold">{formatDuration(visitor.sessions.reduce((a, s) => a + s.durationMs, 0))}</p>
              <p className="text-xs text-slate-500">toplam süre</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="neutral">İlk giriş: {visitor.firstLandingPath ?? "—"}</Badge>
          <Badge variant="neutral">İlk kaynak: {visitor.firstReferrerHost ?? "Doğrudan"}</Badge>
          <Badge variant="neutral">{[visitor.lastCity, visitor.lastCountry].filter(Boolean).join(", ") || "Konum yok"}</Badge>
          <Badge variant="neutral">{visitor.lastDevice ?? "?"} · {visitor.lastBrowser ?? "?"} · {visitor.lastOs ?? "?"}</Badge>
        </div>
      </Card>

      {visitor.sessions.length ? (
        visitor.sessions.map((s, i) => <SessionCard key={s.id} session={s} index={visitor.sessions.length - i} />)
      ) : (
        <Card className="p-5 text-sm text-slate-500">Oturum kaydı yok.</Card>
      )}
    </div>
  );
}
