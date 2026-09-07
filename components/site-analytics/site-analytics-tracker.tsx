"use client";

// Pazarlama sitesi ziyaretçi izleyici. Kök layout'a takılır ama YALNIZ
// pazarlama alan adında (ekatalox.com / www / localhost) ve panel dışı
// yollarda çalışır; tenant vitrinleri, bayi paneli ve admin izlenmez.
//
// Kaydedilenler: sayfa görüntüleme, tıklama (a/button), sayfadan ayrılma
// (görünür kalınan süre + en derin kaydırma). Kimlik: localStorage'da rastgele
// ziyaretçi anahtarı, 30 dk hareketsizlikte yenilenen oturum anahtarı.
// Gönderim: sendBeacon (sekme kapanırken de gider), yoksa keepalive fetch.

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { appEnv } from "@/lib/env";

const COLLECT_URL = "/api/site-analytics/collect";
const VISITOR_KEY = "ekatalox_site_visitor";
const SESSION_KEY = "ekatalox_site_session";
const SESSION_IDLE_MS = 30 * 60_000;
const EXCLUDED_PREFIXES = ["/admin", "/dashboard", "/store", "/api", "/t", "/f", "/yazdir"];

type TrackerEvent = {
  type: "pageview" | "click" | "leave";
  path: string;
  title?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  targetText?: string | null;
  targetHref?: string | null;
  targetTag?: string | null;
  scrollPct?: number | null;
  timeOnPageMs?: number | null;
};

function stripPort(host: string) {
  return host.replace(/:\d+$/, "").toLowerCase();
}

function isMarketingHost() {
  const host = stripPort(window.location.hostname);
  const marketing = stripPort(appEnv.marketingDomain);
  const root = stripPort(appEnv.rootDomain);
  return host === marketing || host === root || host === `www.${root}` || host === "localhost";
}

function isTrackablePath(path: string) {
  return !EXCLUDED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function randomKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getVisitorKey() {
  const store = safeStorage();
  const existing = store?.getItem(VISITOR_KEY);
  if (existing && existing.length >= 8) return existing;
  const key = randomKey();
  store?.setItem(VISITOR_KEY, key);
  return key;
}

/** Oturum anahtarı: son hareketten 30 dk geçtiyse yeni oturum. */
function touchSessionKey() {
  const store = safeStorage();
  const now = Date.now();
  const raw = store?.getItem(SESSION_KEY);
  if (raw) {
    const sep = raw.lastIndexOf(":");
    const key = raw.slice(0, sep);
    const last = Number(raw.slice(sep + 1));
    if (key.length >= 8 && Number.isFinite(last) && now - last < SESSION_IDLE_MS) {
      store?.setItem(SESSION_KEY, `${key}:${now}`);
      return key;
    }
  }
  const key = randomKey();
  store?.setItem(SESSION_KEY, `${key}:${now}`);
  return key;
}

function send(events: TrackerEvent[]) {
  if (!events.length) return;
  const payload = {
    v: 1 as const,
    visitorKey: getVisitorKey(),
    sessionKey: touchSessionKey(),
    screen: `${window.screen.width}x${window.screen.height}`,
    events,
  };
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    if (navigator.sendBeacon(COLLECT_URL, new Blob([body], { type: "application/json" }))) return;
  }

  void fetch(COLLECT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

function currentPath() {
  return window.location.pathname || "/";
}

function readUtm() {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
  };
}

function describeClickTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const el = target.closest("a, button, [role='button'], input[type='submit'], summary") as HTMLElement | null;
  if (!el) return null;

  const text =
    (el.getAttribute("aria-label") || el.textContent || (el as HTMLInputElement).value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || null;

  let href: string | null = null;
  if (el instanceof HTMLAnchorElement && el.href) {
    try {
      const url = new URL(el.href, window.location.href);
      href = url.origin === window.location.origin ? url.pathname + url.search + url.hash : url.href;
      href = href.slice(0, 500);
    } catch {
      href = null;
    }
  }

  return { targetText: text, targetHref: href, targetTag: el.tagName.toLowerCase() };
}

export function SiteAnalyticsTracker() {
  const pathname = usePathname();
  const pageRef = useRef<{
    path: string;
    visibleSince: number | null;
    accumulatedMs: number;
    maxScrollPct: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isMarketingHost()) return;

    const path = pathname || currentPath();
    if (!isTrackablePath(path)) return;

    const now = Date.now();
    const visible = document.visibilityState === "visible";
    pageRef.current = { path, visibleSince: visible ? now : null, accumulatedMs: 0, maxScrollPct: 0 };

    const utm = readUtm();
    send([
      {
        type: "pageview",
        path,
        title: document.title?.slice(0, 200) || null,
        referrer: document.referrer?.slice(0, 500) || null,
        ...utm,
      },
    ]);

    const measureScroll = () => {
      const page = pageRef.current;
      if (!page) return;
      const doc = document.documentElement;
      const total = Math.max(doc.scrollHeight, window.innerHeight);
      const pct = Math.min(100, Math.round(((window.scrollY + window.innerHeight) / total) * 100));
      if (pct > page.maxScrollPct) page.maxScrollPct = pct;
    };

    // Ayrılma: birikmiş görünür süreyi gönder, sayaçları sıfırla (toplamsal).
    const flushLeave = () => {
      const page = pageRef.current;
      if (!page) return;
      if (page.visibleSince !== null) {
        page.accumulatedMs += Date.now() - page.visibleSince;
        page.visibleSince = null;
      }
      measureScroll();
      if (page.accumulatedMs < 500) return;
      send([
        {
          type: "leave",
          path: page.path,
          timeOnPageMs: Math.min(7_200_000, Math.round(page.accumulatedMs)),
          scrollPct: page.maxScrollPct,
        },
      ]);
      page.accumulatedMs = 0;
    };

    const onVisibility = () => {
      const page = pageRef.current;
      if (!page) return;
      if (document.visibilityState === "hidden") {
        flushLeave();
      } else if (page.visibleSince === null) {
        page.visibleSince = Date.now();
      }
    };

    const onClick = (event: MouseEvent) => {
      const described = describeClickTarget(event.target);
      if (!described) return;
      send([{ type: "click", path: currentPath(), ...described }]);
    };

    measureScroll();
    window.addEventListener("scroll", measureScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flushLeave);
    document.addEventListener("click", onClick, { capture: true, passive: true });

    return () => {
      // Rota değişimi: önceki sayfanın süresini kapat.
      flushLeave();
      window.removeEventListener("scroll", measureScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flushLeave);
      document.removeEventListener("click", onClick, { capture: true });
      pageRef.current = null;
    };
  }, [pathname]);

  return null;
}
