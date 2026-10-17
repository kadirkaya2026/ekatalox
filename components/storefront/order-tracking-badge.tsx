"use client";

import { useEffect, useState } from "react";
import {
  countUnseen,
  readMemberSignedInHint,
  readSeen,
  readTrackingPhone,
} from "@/lib/storefront/tracking-phone";

const POLL_MS = 60_000;

// Başlıktaki "Sipariş Takip" ikonunun kırmızı sayacı. Üye girişi, cihazda
// üyeliksiz sipariş kodu ya da (toptancı takip mağazalarında) numara varsa
// siparişleri çeker, görülmemiş durum değişikliklerini sayar; 60 sn'de bir ve
// sekme öne gelince yeniler.
export function useUnseenOrderUpdates(subdomain: string | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!subdomain) return;
    let cancelled = false;

    const refresh = async () => {
      // Market/tekel'de sunucu numarayı yok sayar: üye çerezi ya da kodlar (0180).
      const phone = readTrackingPhone();
      // Sipariş takibi yalnız üyelikle (17 Eki 2026): üyeliksiz cihaz kodları sayılmaz.
      const tokens: string[] = [];
      if (!phone && !readMemberSignedInHint()) {
        setCount(0);
        return;
      }
      try {
        const r = await fetch("/api/storefront/my-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subdomain, phone: phone ?? undefined, tokens }),
        });
        if (!r.ok) return;
        const d = (await r.json()) as {
          orders: Array<{ order_no: number | null; status: string; status_updated_at: string }>;
        };
        if (!cancelled) setCount(countUnseen(d.orders ?? [], readSeen()));
      } catch {
        /* ağ hatası: sonraki turda */
      }
    };

    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("ekx-track-seen-changed", onVisible);
    window.addEventListener("ekx-track-phone-changed", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("ekx-track-seen-changed", onVisible);
      window.removeEventListener("ekx-track-phone-changed", onVisible);
    };
  }, [subdomain]);

  return count;
}

export function OrderTrackingBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold leading-none text-white ring-2 ring-white/80"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
