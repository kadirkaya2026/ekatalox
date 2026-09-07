// Pazarlama sitesi ziyaretçi olaylarını toplar (beacon). Vitrin analitiği
// geleneği: her durumda 204 — beacon'a asla durum sızdırma, sayfayı asla bozma.
import { NextResponse } from "next/server";
import { resolveHost } from "@/lib/tenancy/resolve-host";
import { getClientIp } from "@/lib/storefront/client-ip";
import { isLikelyBot, parseUserAgent, referrerHost } from "@/lib/site-analytics/ua";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { siteAnalyticsBatchSchema } from "@/lib/validators/site-analytics";

const NO_CONTENT = () => new NextResponse(null, { status: 204 });

// IP başına basit frenleme (instance içi; customer-lookup ile aynı yaklaşım).
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 120;
const RATE_MAX_ENTRIES = 5000;
const rate = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = rate.get(key);
  if (!entry || entry.resetAt <= now) {
    if (rate.size >= RATE_MAX_ENTRIES) rate.clear();
    rate.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_MAX;
}

// İzlenmeyen yollar: panel/vitrin/yardımcı rotalar pazarlama sayfası değil.
const EXCLUDED_PREFIXES = ["/admin", "/dashboard", "/store", "/api", "/t", "/f", "/yazdir", "/_next"];

function isTrackablePath(path: string) {
  return !EXCLUDED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function decodeHeader(value: string | null) {
  if (!value) return null;
  try {
    return decodeURIComponent(value).trim() || null;
  } catch {
    return value.trim() || null;
  }
}

export async function POST(request: Request) {
  // Yalnız pazarlama alan adından gelen sayfalar (origin/referer ile).
  const originHost = (() => {
    const ref = request.headers.get("origin") ?? request.headers.get("referer");
    if (!ref) return null;
    try {
      return new URL(ref).host;
    } catch {
      return null;
    }
  })();
  if (!originHost || resolveHost(originHost).kind !== "marketing") {
    return NO_CONTENT();
  }

  const userAgent = request.headers.get("user-agent");
  if (isLikelyBot(userAgent)) {
    return NO_CONTENT();
  }

  const ip = getClientIp(request);
  if (ip && isRateLimited(ip)) {
    return NO_CONTENT();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NO_CONTENT();
  }

  const parsed = siteAnalyticsBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NO_CONTENT();
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NO_CONTENT();
  }

  const ua = parseUserAgent(userAgent);
  const country =
    decodeHeader(request.headers.get("x-vercel-ip-country")) ??
    decodeHeader(request.headers.get("cf-ipcountry"));
  const city = decodeHeader(request.headers.get("x-vercel-ip-city"));
  const { visitorKey, sessionKey, screen, events } = parsed.data;

  // Sıra önemli (pageview → click → leave); art arda, hata olsa da devam.
  for (const event of events) {
    if (!isTrackablePath(event.path)) continue;

    const { error } = await supabase.rpc("record_site_event", {
      p_visitor_key: visitorKey,
      p_session_key: sessionKey,
      p_event_type: event.type,
      p_path: event.path,
      p_title: event.title ?? null,
      p_referrer: event.referrer ?? null,
      p_referrer_host: referrerHost(event.referrer),
      p_utm_source: event.utmSource ?? null,
      p_utm_medium: event.utmMedium ?? null,
      p_utm_campaign: event.utmCampaign ?? null,
      p_device: ua.device,
      p_browser: ua.browser,
      p_os: ua.os,
      p_screen: screen ?? null,
      p_country: country,
      p_city: city,
      p_target_text: event.targetText ?? null,
      p_target_href: event.targetHref ?? null,
      p_target_tag: event.targetTag ?? null,
      p_scroll_pct: event.scrollPct ?? null,
      p_time_on_page_ms: event.timeOnPageMs ?? null,
    });

    if (error) {
      console.error("[site-analytics/collect] record_site_event hata:", error.message);
    }
  }

  return NO_CONTENT();
}
