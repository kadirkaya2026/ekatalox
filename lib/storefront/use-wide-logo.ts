"use client";

import { useEffect, useState } from "react";

// Yazı logosu (ör. "SETRE", en/boy > 2,4): kare kutuya sığdırılınca
// küçülüyor ve mağaza adı ikinci kez yazılıyordu (28 Eyl 2026). Geniş logo
// kutusuz, geniş çizilir; ad yazısı yalnız ekran okuyucuya kalır. Oran
// görsel yüklenince ölçülür ve cihazda saklanır (sonraki açılışta anında).
export const WIDE_LOGO_RATIO = 2.4;

export function useIsWideLogo(url: string | null | undefined) {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    if (!url) return;
    const key = `ek_logo_ratio:${url}`;
    let cached: string | null = null;
    try {
      cached = window.localStorage.getItem(key);
    } catch {
      /* depolama kapalı */
    }
    if (cached) {
      const frame = window.requestAnimationFrame(() => setWide(Number(cached) > WIDE_LOGO_RATIO));
      return () => window.cancelAnimationFrame(frame);
    }
    const probe = new window.Image();
    probe.onload = () => {
      if (!probe.naturalHeight) return;
      const ratio = probe.naturalWidth / probe.naturalHeight;
      try {
        window.localStorage.setItem(key, String(ratio));
      } catch {
        /* depolama kapalı */
      }
      setWide(ratio > WIDE_LOGO_RATIO);
    };
    probe.src = url;
  }, [url]);
  return wide;
}
