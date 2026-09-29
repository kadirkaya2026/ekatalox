// "Ziyaretçi Hikâyeleri" (29 Eyl 2026): ekatalox.com ziyaretçilerini tek tek,
// okunur bir zaman çizelgesi olarak gösterir — hangi sayfada ne kadar kaldı,
// hangi butona tıkladı, kayıt/demo durumu. Yapay zekâ asistanlarından
// gelenler ayrı gruplanır; süper adminin kendi cihazları (note = "ben") ve
// panele giriş yapan mevcut müşteriler ayrı tutulur.
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { rangeBounds } from "@/lib/site-analytics/report";

export const OWN_DEVICE_NOTE = "ben";

const AI_SOURCES: Array<[RegExp, string]> = [
  [/chatgpt|openai/i, "ChatGPT"],
  [/gemini|bard/i, "Gemini"],
  [/claude|anthropic/i, "Claude"],
  [/perplexity/i, "Perplexity"],
  [/copilot/i, "Copilot"],
  [/deepseek/i, "DeepSeek"],
  [/grok|x\.ai/i, "Grok"],
  [/meta\.ai/i, "Meta AI"],
  [/you\.com|phind|poe\.com/i, "Yapay zekâ"],
];
const SEARCH_SOURCES: Array<[RegExp, string]> = [
  [/google\./i, "Google"],
  [/bing\./i, "Bing"],
  [/yandex\./i, "Yandex"],
  [/duckduckgo/i, "DuckDuckGo"],
  [/yahoo\./i, "Yahoo"],
];
const INTERNAL_HOSTS = /^(admin\.ekatalox\.com|localhost|127\.0\.0\.1)$/i;
const PANEL_PATHS = new Set(["/login", "/sifremi-unuttum", "/sifre-sifirla"]);
const PANEL_CLICKS = new Set(["Giriş", "Giriş yap", "Panele giriş", "Panele gir"]);

export type StoryGroup = "ai" | "visitor" | "panel" | "own";

export interface StoryStep {
  at: string; // HH:MM
  kind: "page" | "click" | "leave" | "funnel";
  path?: string;
  text?: string;
  href?: string | null;
  seconds?: number | null;
  scroll?: number | null;
}

export interface VisitorStory {
  visitorId: string;
  group: StoryGroup;
  firstAt: string;
  device: string | null;
  source: string;
  sourceKind: "ai" | "search" | "direct" | "other";
  sessions: number;
  totalSeconds: number;
  pageCount: number;
  signedUp: boolean;
  openedSignup: boolean;
  openedDemo: boolean;
  note: string | null;
  steps: StoryStep[];
}

const FUNNEL_LABELS: Record<string, string> = {
  signup_cta: "“Ücretsiz başla”ya tıkladı",
  demo_open: "Demoyu açtı",
  signup_start: "Kayıt formunu açtı",
  signup_business_complete: "Kayıt: işletme bilgilerini doldurdu",
  signup_whatsapp_complete: "Kayıt: WhatsApp bilgisini doldurdu",
  signup_submit: "Kayıt formunu gönderdi",
  signup_complete: "✅ KAYIT OLDU",
  signup_error: "⚠️ Kayıtta hata aldı",
};

function hhmm(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date(iso));
}

function classifySource(host: string | null, utm: string | null) {
  const text = `${host ?? ""} ${utm ?? ""}`;
  for (const [pattern, label] of AI_SOURCES) if (pattern.test(text)) return { label, kind: "ai" as const };
  for (const [pattern, label] of SEARCH_SOURCES) if (pattern.test(host ?? "")) return { label, kind: "search" as const };
  if (!host) return { label: utm ? `Doğrudan (${utm})` : "Doğrudan / WhatsApp", kind: "direct" as const };
  return { label: host, kind: "other" as const };
}

type SessionRow = {
  id: string;
  session_key: string;
  visitor_id: string;
  started_at: string;
  device: string | null;
  referrer_host: string | null;
  utm_source: string | null;
};
type EventRow = {
  session_id: string;
  event_type: string;
  path: string | null;
  target_text: string | null;
  target_href: string | null;
  time_on_page_ms: number | null;
  scroll_pct: number | null;
  created_at: string;
};

export async function getVisitorStories(day: string): Promise<VisitorStory[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { fromTs, toTs } = rangeBounds(day, day);

  const { data: sessionData } = await supabase
    .from("site_sessions")
    .select("id, session_key, visitor_id, started_at, device, referrer_host, utm_source")
    .gte("started_at", fromTs)
    .lt("started_at", toTs)
    .order("started_at", { ascending: true })
    .limit(1000);
  const sessions = (sessionData ?? []) as SessionRow[];
  if (!sessions.length) return [];

  const sessionIds = sessions.map((s) => s.id);
  const sessionKeys = sessions.map((s) => s.session_key);
  const visitorIds = [...new Set(sessions.map((s) => s.visitor_id))];

  const events: EventRow[] = [];
  for (let i = 0; i < sessionIds.length; i += 200) {
    const { data } = await supabase
      .from("site_events")
      .select("session_id, event_type, path, target_text, target_href, time_on_page_ms, scroll_pct, created_at")
      .in("session_id", sessionIds.slice(i, i + 200))
      .order("created_at", { ascending: true })
      .limit(5000);
    events.push(...((data ?? []) as EventRow[]));
  }
  const funnel: Array<{ session_key: string; event_name: string; created_at: string }> = [];
  for (let i = 0; i < sessionKeys.length; i += 200) {
    const { data } = await supabase
      .from("site_funnel_events")
      .select("session_key, event_name, created_at")
      .in("session_key", sessionKeys.slice(i, i + 200))
      .limit(5000);
    funnel.push(...((data ?? []) as typeof funnel));
  }
  const { data: visitorData } = await supabase.from("site_visitors").select("id, note").in("id", visitorIds);
  const notes = new Map(((visitorData ?? []) as Array<{ id: string; note: string | null }>).map((v) => [v.id, v.note]));

  const byVisitor = new Map<string, SessionRow[]>();
  for (const s of sessions) byVisitor.set(s.visitor_id, [...(byVisitor.get(s.visitor_id) ?? []), s]);

  const stories: VisitorStory[] = [];
  for (const [visitorId, visitorSessions] of byVisitor) {
    const ids = new Set(visitorSessions.map((s) => s.id));
    const keys = new Set(visitorSessions.map((s) => s.session_key));
    const visitorEvents = events.filter((e) => ids.has(e.session_id));
    const visitorFunnel = funnel.filter((f) => keys.has(f.session_key));

    const steps: StoryStep[] = [
      ...visitorEvents.map((e) => ({ e, at: e.created_at })),
      ...visitorFunnel.map((f) => ({ f, at: f.created_at })),
    ]
      .sort((a, b) => a.at.localeCompare(b.at))
      .flatMap((item): StoryStep[] => {
        if ("f" in item) {
          const label = FUNNEL_LABELS[item.f.event_name];
          return label ? [{ at: hhmm(item.at), kind: "funnel", text: label }] : [];
        }
        const e = item.e;
        if (e.event_type === "pageview") return [{ at: hhmm(e.created_at), kind: "page", path: e.path ?? "/" }];
        if (e.event_type === "click" && e.target_text?.trim()) {
          return [{ at: hhmm(e.created_at), kind: "click", text: e.target_text.trim().slice(0, 80), href: e.target_href }];
        }
        if (e.event_type === "leave") {
          return [{ at: hhmm(e.created_at), kind: "leave", seconds: e.time_on_page_ms ? Math.round(e.time_on_page_ms / 1000) : null, scroll: e.scroll_pct }];
        }
        return [];
      });

    const first = visitorSessions[0];
    const source = classifySource(first.referrer_host, first.utm_source);
    const aiSession = visitorSessions.map((s) => classifySource(s.referrer_host, s.utm_source)).find((s) => s.kind === "ai");
    const pages = visitorEvents.filter((e) => e.event_type === "pageview").map((e) => e.path ?? "/");
    const clicks = visitorEvents.filter((e) => e.event_type === "click" && e.target_text?.trim()).map((e) => e.target_text!.trim());
    const note = notes.get(visitorId) ?? null;
    const internal = visitorSessions.some((s) => INTERNAL_HOSTS.test(s.referrer_host ?? ""));
    const onlyPanel =
      pages.length > 0 &&
      pages.every((p) => PANEL_PATHS.has(p) || p === "/") &&
      pages.some((p) => PANEL_PATHS.has(p)) &&
      clicks.every((c) => PANEL_CLICKS.has(c));

    const group: StoryGroup =
      note?.trim().toLocaleLowerCase("tr-TR") === OWN_DEVICE_NOTE || internal
        ? "own"
        : aiSession
          ? "ai"
          : onlyPanel
            ? "panel"
            : "visitor";

    stories.push({
      visitorId,
      group,
      firstAt: hhmm(first.started_at),
      device: first.device,
      source: aiSession?.label ?? source.label,
      sourceKind: aiSession ? "ai" : source.kind,
      sessions: visitorSessions.length,
      totalSeconds: Math.round(visitorEvents.filter((e) => e.event_type === "leave").reduce((sum, e) => sum + (e.time_on_page_ms ?? 0), 0) / 1000),
      pageCount: pages.length,
      signedUp: visitorFunnel.some((f) => f.event_name === "signup_complete"),
      openedSignup: visitorFunnel.some((f) => f.event_name === "signup_start" || f.event_name === "signup_cta"),
      openedDemo: visitorFunnel.some((f) => f.event_name === "demo_open") || clicks.some((c) => /demo/i.test(c)),
      note,
      steps,
    });
  }

  return stories.sort((a, b) => a.firstAt.localeCompare(b.firstAt));
}
