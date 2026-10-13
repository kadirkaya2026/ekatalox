"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// 60 sn: süper admin "şu an panelde" bilgisini dakika hassasiyetinde görsün (14 Eki 2026).
const HEARTBEAT_MS = 60_000;

function ping(path: string, heartbeat: boolean) {
  fetch("/api/tenant/panel-ping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, heartbeat }),
    keepalive: true,
  }).catch(() => {});
}

// Panelin HER sayfasında çalışır (layout'ta). Sayfa değişiminde ve panel açık
// kaldıkça dakikada bir ziyaret kaydı atar; süper admin "son panel ziyareti"ni
// buradan görür (açık kalan oturumla girenler de dahil).
export function PanelVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    ping(pathname, false);
  }, [pathname]);

  useEffect(() => {
    const beat = () => {
      if (document.visibilityState === "visible") ping(window.location.pathname, true);
    };
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, []);

  return null;
}
