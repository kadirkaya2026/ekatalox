"use client";

// Meta Pixel yükleyici — (marketing) layout'una takılır, panel/vitrin/admin
// bu layout'un dışında olduğu için orada yüklenmez. İlk PageView Meta'nın
// kendi snippet'inden gelir; sonraki istemci tarafı sayfa geçişlerinde
// PageView elle gönderilir.
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { META_PIXEL_ID } from "@/lib/marketing/meta-pixel";

export function MetaPixel() {
  const pathname = usePathname();
  const firstRender = useRef(true);

  useEffect(() => {
    if (!META_PIXEL_ID) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const fbq = (window as unknown as { fbq?: (c: string, e: string) => void }).fbq;
    if (typeof fbq === "function") fbq("track", "PageView");
  }, [pathname]);

  if (!META_PIXEL_ID) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
    </Script>
  );
}
