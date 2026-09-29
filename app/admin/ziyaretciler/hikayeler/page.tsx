// Ziyaretçi Hikâyeleri — ekatalox.com ziyaretçileri tek tek, sade zaman
// çizelgesiyle (29 Eyl 2026). Her açılışta güncel.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { VisitorOwnToggle } from "@/components/admin/visitor-own-toggle";
import { getIstanbulToday, shiftIsoDate } from "@/lib/dates/istanbul";
import { getVisitorStories, type StoryGroup, type VisitorStory } from "@/lib/site-analytics/stories";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function formatSeconds(total: number) {
  if (!total) return "—";
  if (total < 60) return `${total} sn`;
  const minutes = Math.floor(total / 60);
  return minutes < 60 ? `${minutes} dk ${total % 60} sn` : `${Math.floor(minutes / 60)} sa ${minutes % 60} dk`;
}

function dayLabel(day: string, today: string) {
  if (day === today) return "Bugün";
  if (day === shiftIsoDate(today, -1)) return "Dün";
  const [y, m, d] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(y, m - 1, d));
}

const SOURCE_BADGE: Record<VisitorStory["sourceKind"], string> = {
  ai: "bg-violet-100 text-violet-800",
  search: "bg-sky-100 text-sky-800",
  direct: "bg-slate-100 text-slate-700",
  other: "bg-amber-100 text-amber-800",
};

function StoryCard({ story }: { story: VisitorStory }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-slate-900">{story.firstAt}</span>
        <span className="text-slate-500">· {story.device ?? "Cihaz ?"}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SOURCE_BADGE[story.sourceKind]}`}>
          {story.sourceKind === "ai" ? "🤖 " : ""}
          {story.source}
        </span>
        <span className="text-slate-500">
          · {story.pageCount} sayfa · {formatSeconds(story.totalSeconds)}
          {story.sessions > 1 ? ` · ${story.sessions} kez geldi` : ""}
        </span>
        {story.signedUp ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">KAYIT OLDU</span> : null}
        {!story.signedUp && story.openedSignup ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Kayda başladı</span> : null}
        {story.openedDemo ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">Demo/tema baktı</span> : null}
        <span className="ml-auto">
          <VisitorOwnToggle visitorId={story.visitorId} isOwn={story.group === "own"} />
        </span>
      </div>
      <ol className="mt-3 space-y-1 border-l-2 border-slate-100 pl-3 text-sm">
        {story.steps.map((step, index) => (
          <li key={index} className="flex gap-2">
            <span className="w-11 shrink-0 tabular-nums text-xs leading-5 text-slate-400">{step.kind === "page" || step.kind === "funnel" ? step.at : ""}</span>
            {step.kind === "page" ? (
              <span className="font-medium text-slate-900">→ {step.path}</span>
            ) : step.kind === "click" ? (
              <span className="text-slate-700">
                👆 “{step.text}”{step.href && step.href.startsWith("/") ? <span className="text-slate-400"> → {step.href}</span> : null}
              </span>
            ) : step.kind === "leave" ? (
              <span className="text-xs leading-5 text-slate-500">
                ⏱ sayfada {formatSeconds(step.seconds ?? 0)}
                {typeof step.scroll === "number" ? ` · %${step.scroll} kaydırdı` : ""}
              </span>
            ) : (
              <span className="font-semibold text-emerald-700">{step.text}</span>
            )}
          </li>
        ))}
      </ol>
    </article>
  );
}

const SECTIONS: Array<{ group: StoryGroup; title: string; hint: string; open: boolean }> = [
  { group: "ai", title: "🤖 Yapay zekâdan gelenler", hint: "ChatGPT, Gemini, Claude, Perplexity, Copilot…", open: true },
  { group: "visitor", title: "👀 Ziyaretçiler", hint: "Google, doğrudan (WhatsApp linki vb.) ve diğer kaynaklar", open: true },
  { group: "panel", title: "🔑 Panele giriş yapanlar", hint: "Yalnız giriş sayfasına gelen mevcut müşteriler", open: false },
  { group: "own", title: "🙋 Ben", hint: "“Bu benim” dediğin cihazlar ve admin/geliştirme ziyaretleri", open: false },
];

export default async function VisitorStoriesPage({ searchParams }: { searchParams: Promise<{ gun?: string }> }) {
  const params = await searchParams;
  const today = getIstanbulToday();
  const day = params.gun && ISO_DATE.test(params.gun) && params.gun <= today ? params.gun : today;
  const stories = await getVisitorStories(day);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ziyaretçi Analitiği"
        title="Ziyaretçi Hikâyeleri"
        description="ekatalox.com'a gelenleri tek tek görün: nereden geldi, hangi sayfada ne kadar kaldı, nelere tıkladı, kayıt oldu mu."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/ziyaretciler/hikayeler?gun=${shiftIsoDate(day, -1)}`} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
          ← Önceki gün
        </Link>
        <span className="px-2 text-base font-semibold text-slate-900">{dayLabel(day, today)}</span>
        {day < today ? (
          <Link href={`/ziyaretciler/hikayeler?gun=${shiftIsoDate(day, 1)}`} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
            Sonraki gün →
          </Link>
        ) : null}
        {day !== today ? (
          <Link href="/ziyaretciler/hikayeler" className="rounded-lg px-3 py-1.5 text-sm text-emerald-700 hover:underline">
            Bugüne dön
          </Link>
        ) : null}
        <Link href="/ziyaretciler" className="ml-auto text-sm text-slate-500 hover:underline">
          Grafikli rapor →
        </Link>
      </div>

      {SECTIONS.map((section) => {
        const items = stories.filter((story) => story.group === section.group);
        return (
          <details key={section.group} open={section.open} className="group rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer list-none">
              <span className="text-lg font-semibold text-slate-900">
                {section.title} <span className="text-slate-400">({items.length})</span>
              </span>
              <span className="ml-2 text-sm text-slate-500">{section.hint}</span>
            </summary>
            <div className="mt-4 space-y-3">
              {items.length ? (
                items.map((story) => <StoryCard key={story.visitorId} story={story} />)
              ) : (
                <p className="text-sm text-slate-500">Bu gün bu gruptan ziyaretçi yok.</p>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}
