"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TenantStorefrontSettings } from "@/lib/types";
import { formatDateSlashTr } from "@/lib/utils";

export function TenantStorefrontDisplayForm({
  initialStorefrontSettings,
}: {
  initialStorefrontSettings: TenantStorefrontSettings;
}) {
  const [priceUpdateDate, setPriceUpdateDate] = useState(
    initialStorefrontSettings.price_update_date ?? "",
  );
  const [isPriceUpdateDateVisible, setIsPriceUpdateDateVisible] = useState(
    initialStorefrontSettings.is_price_update_date_visible ?? false,
  );
  const [savePending, startSaveTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const router = useRouter();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveMessage(null);
    setDateError(null);

    if (isPriceUpdateDateVisible && !priceUpdateDate) {
      setDateError("Vitrinde göstermek için fiyat güncelleme tarihi zorunludur.");
      return;
    }

    startSaveTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_update_date: priceUpdateDate || null,
          is_price_update_date_visible: isPriceUpdateDateVisible,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSaveMessage(result.error ?? "Vitrin ayarları kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings) {
        setPriceUpdateDate(result.storefrontSettings.price_update_date ?? "");
        setIsPriceUpdateDateVisible(
          result.storefrontSettings.is_price_update_date_visible ?? false,
        );
      }

      setSaveMessage("Vitrin ayarları kaydedildi.");
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <CalendarDays className="size-4 text-emerald-700" />
        <span>Fiyat Güncelleme Tarihi</span>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Vitrin anasayfasında logo yanındaki mağaza adının altında fiyat güncelleme
        tarihini gösterebilirsiniz.
      </p>

      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Fiyat güncelleme tarihi
          </label>
          <Input
            type="date"
            value={priceUpdateDate}
            onChange={(event) => {
              setPriceUpdateDate(event.target.value);
              setSaveMessage(null);
              setDateError(null);
            }}
          />
          {dateError ? (
            <p className="mt-2 text-sm text-amber-700">{dateError}</p>
          ) : (
            <p className="mt-2 text-xs text-slate-400">
              Tarih, vitrinde gg/aa/yyyy formatında gösterilir.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Vitrinde göster</p>
              <p className="mt-1 text-sm text-slate-500">
                Açıkken tarih, mağaza adının altında görünür.
              </p>
              {isPriceUpdateDateVisible && priceUpdateDate ? (
                <p className="mt-2 text-sm text-slate-600">
                  Önizleme: Fiyat Güncelleme Tarihi :{" "}
                  {formatDateSlashTr(priceUpdateDate)}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsPriceUpdateDateVisible((current) => !current);
                setSaveMessage(null);
                setDateError(null);
              }}
              aria-pressed={isPriceUpdateDateVisible}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                isPriceUpdateDateVisible ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition ${
                  isPriceUpdateDateVisible ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6">
            {saveMessage ? (
              <p
                className={`text-sm ${
                  saveMessage.includes("kaydedildi")
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                {saveMessage}
              </p>
            ) : null}
          </div>
          <Button type="submit" disabled={savePending}>
            {savePending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
