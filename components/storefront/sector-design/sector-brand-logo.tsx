"use client";

import type { ReactNode } from "react";
import { useIsWideLogo } from "@/lib/storefront/use-wide-logo";

// Sektör temalarının başlığındaki logo + mağaza adı (29 Eyl 2026, Yaşatan
// Kozmetik). Geniş/banner biçimli logo (en/boy > 2,4) küçük kutuya sıkışıp
// okunmuyordu ve altında mağaza adı ikinci kez yazılıyordu: geniş logo
// okunur boyda çizilir, ad yalnız ekran okuyucuya kalır. Kare logo ve logosuz
// mağazada temanın kendi düzeni aynen korunur.
export function SectorBrandLogo({
  logoUrl,
  title,
  className,
  fallback = null,
}: {
  logoUrl: string | null | undefined;
  title: string;
  className?: string;
  fallback?: ReactNode;
}) {
  const wide = useIsWideLogo(logoUrl);

  if (logoUrl && wide) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element -- oran doğal genişlikte korunur */}
        <img
          src={logoUrl}
          alt=""
          style={{
            height: "clamp(38px, 5.5vw, 56px)",
            width: "auto",
            maxWidth: "min(320px, 62vw)",
            objectFit: "contain",
            borderRadius: 6,
            flexShrink: 0,
          }}
        />
        <span className="sr-only">{title}</span>
      </>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- temanın kendi logo stili */}
      {logoUrl ? <img src={logoUrl} alt="" className={className} /> : fallback}
      <span>{title}</span>
    </>
  );
}
