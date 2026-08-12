"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_BUSINESS_HOURS,
  WEEKDAY_LABELS_TR,
  WEEKDAY_ORDER,
} from "@/lib/storefront/business-hours";
import type { BusinessHours, TenantStorefrontSettings, WeekdayKey } from "@/lib/types";

export function TenantBusinessHoursForm({
  initialStorefrontSettings,
}: {
  initialStorefrontSettings: TenantStorefrontSettings;
}) {
  const [isAlwaysOpen, setIsAlwaysOpen] = useState(
    initialStorefrontSettings.is_always_open ?? true,
  );
  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    initialStorefrontSettings.business_hours ?? DEFAULT_BUSINESS_HOURS,
  );
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function updateDay(day: WeekdayKey, patch: Partial<BusinessHours[WeekdayKey]>) {
    setBusinessHours((current) => ({
      ...current,
      [day]: { ...current[day], ...patch },
    }));
    setMessage(null);
    setError(null);
  }

  function saveHours(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!isAlwaysOpen && !WEEKDAY_ORDER.some((day) => businessHours[day].is_open)) {
      setError("En az bir gün açık olmalıdır.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_always_open: isAlwaysOpen,
          business_hours: businessHours,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Çalışma saatleri kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings) {
        setIsAlwaysOpen(Boolean(result.storefrontSettings.is_always_open));
        setBusinessHours(result.storefrontSettings.business_hours ?? DEFAULT_BUSINESS_HOURS);
      }

      setMessage("Çalışma saatleri kaydedildi.");
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Clock className="size-4 text-emerald-700" />
        <span>Çalışma saatleri</span>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Belirli saatler seçildiğinde, saatler dışında vitrine gelen ziyaretçilere
        &quot;mağazamız şu anda kapalıdır&quot; ekranı gösterilir. Sepetine ürün eklemiş,
        sekmesi açık kalan müşterilere de kapanış anında aynı bildirim otomatik gösterilir.
      </p>

      <form onSubmit={saveHours} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">7/24 Açık</p>
              <p className="mt-1 text-sm text-slate-500">
                Switch açıkken mağaza her zaman açık kabul edilir, aşağıdaki saatler dikkate
                alınmaz.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAlwaysOpen((current) => !current);
                setMessage(null);
                setError(null);
              }}
              aria-pressed={isAlwaysOpen}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                isAlwaysOpen ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
                  isAlwaysOpen ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {!isAlwaysOpen ? (
          <div className="space-y-2">
            {WEEKDAY_ORDER.map((day) => {
              const dayHours = businessHours[day];

              return (
                <div
                  key={day}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateDay(day, { is_open: !dayHours.is_open })}
                      aria-pressed={dayHours.is_open}
                      className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition ${
                        dayHours.is_open ? "bg-emerald-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition ${
                          dayHours.is_open ? "left-5" : "left-1"
                        }`}
                      />
                    </button>
                    <span className="w-24 text-sm font-medium text-slate-700">
                      {WEEKDAY_LABELS_TR[day]}
                    </span>
                  </div>

                  {dayHours.is_open ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={dayHours.open_time}
                        onChange={(event) => updateDay(day, { open_time: event.target.value })}
                        className="w-32"
                      />
                      <span className="text-sm text-slate-400">—</span>
                      <Input
                        type="time"
                        value={dayHours.close_time}
                        onChange={(event) => updateDay(day, { close_time: event.target.value })}
                        className="w-32"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">Kapalı</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6">
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="text-sm text-amber-700">{error}</p> : null}
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Çalışma saatlerini kaydet"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
