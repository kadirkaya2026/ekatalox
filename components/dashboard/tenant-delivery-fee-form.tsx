"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SettingsSectionHeader } from "@/components/dashboard/settings-section-header";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/inline-alert";
import type { TenantStorefrontSettings } from "@/lib/types";

export function TenantDeliveryFeeForm({
  initialStorefrontSettings,
}: {
  initialStorefrontSettings: TenantStorefrontSettings;
}) {
  const [isActive, setIsActive] = useState(
    initialStorefrontSettings.is_delivery_fee_active ?? false,
  );
  const [feeAmount, setFeeAmount] = useState(
    initialStorefrontSettings.delivery_fee_amount
      ? String(initialStorefrontSettings.delivery_fee_amount)
      : "",
  );
  const [freeThreshold, setFreeThreshold] = useState(
    initialStorefrontSettings.delivery_fee_free_threshold
      ? String(initialStorefrontSettings.delivery_fee_free_threshold)
      : "",
  );
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const parsedFee = feeAmount.trim() ? Number(feeAmount) : 0;
    const parsedThreshold = freeThreshold.trim() ? Number(freeThreshold) : 0;

    if (isActive && (!Number.isFinite(parsedFee) || parsedFee < 0)) {
      setError("Getirme ücreti 0 veya daha büyük bir tutar olmalı.");
      return;
    }

    if (isActive && (!Number.isFinite(parsedThreshold) || parsedThreshold < 0)) {
      setError("Ücretsiz teslimat barajı 0 veya daha büyük bir tutar olmalı.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_delivery_fee_active: isActive,
          delivery_fee_amount: parsedFee,
          delivery_fee_free_threshold: parsedThreshold,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Getirme ücreti kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings) {
        setIsActive(Boolean(result.storefrontSettings.is_delivery_fee_active));
        setFeeAmount(
          result.storefrontSettings.delivery_fee_amount
            ? String(result.storefrontSettings.delivery_fee_amount)
            : "",
        );
        setFreeThreshold(
          result.storefrontSettings.delivery_fee_free_threshold
            ? String(result.storefrontSettings.delivery_fee_free_threshold)
            : "",
        );
      }

      setMessage("Getirme ücreti kaydedildi.");
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <SettingsSectionHeader icon={Truck} title="Getirme (teslimat) ücreti" />
      <p className="mb-4 text-sm text-slate-500">
        Aktif ettiğinizde, müşteri sipariş verirken sepetine otomatik bir getirme ücreti eklenir ve
        sepet özetinde ayrı bir satır olarak gösterilir. Ücretsiz teslimat barajı girerseniz, o
        tutar ve üzeri siparişlerde ücret alınmaz. Baraj boş bırakılırsa her siparişe ücret eklenir.
        Ücreti 0 girerseniz tüm siparişlerde teslimat ücretsiz olur.
      </p>

      <form onSubmit={save} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Getirme ücreti uygula</p>
              <p className="mt-1 text-sm text-slate-500">
                Switch kapalıyken siparişlere teslimat ücreti eklenmez.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsActive((current) => !current);
                setMessage(null);
                setError(null);
              }}
              aria-pressed={isActive}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                isActive ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
                  isActive ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {isActive ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Getirme Ücreti (₺)
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={feeAmount}
                onChange={(event) => {
                  setFeeAmount(event.target.value);
                  setMessage(null);
                  setError(null);
                }}
                placeholder="Örn. 100"
              />
              <p className="mt-1 text-xs text-slate-500">0 girerseniz teslimat her zaman ücretsiz.</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Ücretsiz Teslimat Barajı (₺)
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={freeThreshold}
                onChange={(event) => {
                  setFreeThreshold(event.target.value);
                  setMessage(null);
                  setError(null);
                }}
                placeholder="Örn. 1000 — boş = baraj yok"
              />
              <p className="mt-1 text-xs text-slate-500">
                Bu tutar ve üzeri siparişlerde ücret alınmaz.
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6">
            <InlineAlert message={message} onExpire={() => setMessage(null)} />
            <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Getirme ücretini kaydet"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
