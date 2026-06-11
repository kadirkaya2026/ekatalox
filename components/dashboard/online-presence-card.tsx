"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import type { TenantPresenceReport } from "@/lib/analytics/presence";

const REFRESH_INTERVAL_MS = 30_000;

export function OnlinePresenceCard({
  initialPresence,
}: {
  initialPresence: TenantPresenceReport;
}) {
  const [presence, setPresence] = useState(initialPresence);
  const [stale, setStale] = useState(false);
  const isFetching = useRef(false);

  const loadPresence = useCallback(async () => {
    if (isFetching.current) {
      return;
    }
    isFetching.current = true;

    try {
      const response = await fetch("/api/tenant/presence", { cache: "no-store" });
      const result = await response.json().catch(() => null);

      if (response.ok && result?.presence) {
        setPresence(result.presence as TenantPresenceReport);
        setStale(false);
      } else {
        setStale(true);
      }
    } catch {
      setStale(true);
    } finally {
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(loadPresence, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [loadPresence]);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
          <h2 className="text-lg font-semibold text-slate-900">Şu An Online</h2>
        </div>
        <span className="text-3xl font-bold text-slate-900">{presence.total}</span>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        Son 2 dakika içinde aktif, şifre girmiş ziyaretçiler. Fiyat listesine göre
        ayrılmıştır; her 30 saniyede güncellenir.
      </p>

      {presence.rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Henüz fiyat listesi tanımlı değil.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {presence.rows.map((row) => (
            <div
              key={row.priceListId}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
            >
              <span className="text-sm font-medium text-slate-700">
                {row.priceListName}
              </span>
              <span
                className={
                  row.onlineCount > 0
                    ? "text-sm font-semibold text-emerald-600"
                    : "text-sm font-semibold text-slate-400"
                }
              >
                {row.onlineCount} online
              </span>
            </div>
          ))}
        </div>
      )}

      {stale ? (
        <p className="mt-3 text-xs text-amber-600">
          Canlı veri güncellenemedi, son bilinen değerler gösteriliyor.
        </p>
      ) : null}
    </Card>
  );
}
