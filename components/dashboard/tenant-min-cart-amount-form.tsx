"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SettingsSectionHeader } from "@/components/dashboard/settings-section-header";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/inline-alert";
import type { TenantStorefrontSettings } from "@/lib/types";

export function TenantMinCartAmountForm({
  initialStorefrontSettings,
}: {
  initialStorefrontSettings: TenantStorefrontSettings;
}) {
  const [isActive, setIsActive] = useState(
    initialStorefrontSettings.is_min_cart_amount_active ?? false,
  );
  const [minAmount, setMinAmount] = useState(
    initialStorefrontSettings.min_cart_amount
      ? String(initialStorefrontSettings.min_cart_amount)
      : "",
  );
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function saveMinAmount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const parsedAmount = Number(minAmount);

    if (isActive && (!minAmount.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0)) {
      setError("Minimum sepet tutarını aktif etmek için 0'dan büyük bir tutar girin.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_min_cart_amount_active: isActive,
          min_cart_amount: isActive ? parsedAmount : Number(minAmount) || 0,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Minimum sepet tutarı kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings) {
        setIsActive(Boolean(result.storefrontSettings.is_min_cart_amount_active));
        setMinAmount(
          result.storefrontSettings.min_cart_amount
            ? String(result.storefrontSettings.min_cart_amount)
            : "",
        );
      }

      setMessage("Minimum sepet tutarı kaydedildi.");
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <SettingsSectionHeader icon={Wallet} title="Minimum sepet tutarı" />
      <p className="mb-4 text-sm text-slate-500">
        Aktif ettiğinizde, sepeti bu tutarın altında kalan müşteriler WhatsApp ile sipariş
        tamamlayamaz; sepetlerine kaç TL daha eklemeleri gerektiği vitrinde gösterilir. Kapalıyken
        her tutardan sipariş alınabilir.
      </p>

      <form onSubmit={saveMinAmount} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Minimum tutar uygula</p>
              <p className="mt-1 text-sm text-slate-500">
                Switch kapalıyken minimum sepet tutarı olmadan sipariş alınmaya devam edilir.
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
          <div className="max-w-xs">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Minimum Sepet Tutarı (₺)
            </label>
            <Input
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              value={minAmount}
              onChange={(event) => {
                setMinAmount(event.target.value);
                setMessage(null);
                setError(null);
              }}
              placeholder="Örn. 500"
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6">
            <InlineAlert message={message} onExpire={() => setMessage(null)} />
            <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Minimum tutarı kaydet"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
