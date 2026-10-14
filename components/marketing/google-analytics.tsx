"use client";

// Google Analytics 4 / Google Ads dönüşüm etiketi (14 Eki 2026). Yalnız
// pazarlama sitesinde; NEXT_PUBLIC_GA_ID (G-XXXX ya da AW-XXXX) boşsa hiçbir
// şey yüklenmez. İstemci tarafı sayfa geçişlerinde page_view elle gönderilir.
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() ?? "";

type Gtag = (...args: unknown[]) => void;

export function trackGaEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !GA_ID) return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag !== "function") return;
  try {
    gtag("event", event, params);
  } catch {
    // engelleyici vb. — izleme hatası sayfayı bozmamalı
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const firstRender = useRef(true);

  useEffect(() => {
    if (!GA_ID) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    trackGaEvent("page_view", { page_path: pathname });
  }, [pathname]);

  if (!GA_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  );
}
