"use client";

import { useState, useTransition } from "react";
import { Banknote, CreditCard, ShoppingCart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { InstallmentOption, TenantStorefrontSettings } from "@/lib/types";
import { DEFAULT_INSTALLMENT_OPTIONS } from "@/lib/storefront/cart";

export function TenantPaymentSettingsForm({
  storefrontSettings,
}: {
  storefrontSettings: TenantStorefrontSettings;
}) {
  const [discountThreshold, setDiscountThreshold] = useState(
    String(storefrontSettings.discount_threshold ?? 0),
  );
  const [discountPercentage, setDiscountPercentage] = useState(
    String(storefrontSettings.discount_percentage ?? 0),
  );
  const [isDiscountActive, setIsDiscountActive] = useState(
    storefrontSettings.is_discount_active ?? false,
  );
  const [discountConditionNote, setDiscountConditionNote] = useState(
    storefrontSettings.discount_condition_note ?? "",
  );
  const [discountPaymentMethod, setDiscountPaymentMethod] = useState<"cash" | "card">(
    (storefrontSettings.discount_payment_method as "cash" | "card") ?? "cash",
  );
  const [discountPaymentTab, setDiscountPaymentTab] = useState<"cash" | "card">(
    (storefrontSettings.discount_payment_method as "cash" | "card") ?? "cash",
  );
  const [cardInstallmentOptions, setCardInstallmentOptions] = useState<InstallmentOption[]>(() => {
    const saved = storefrontSettings.card_installment_options ?? [];
    if (!saved.length) return DEFAULT_INSTALLMENT_OPTIONS;
    // Merge: kayıtlı seçenekleri koru, kayıtta olmayan yeni taksitleri default ile ekle
    const savedCounts = new Set(saved.map((o) => o.count));
    const extras = DEFAULT_INSTALLMENT_OPTIONS.filter((o) => !savedCounts.has(o.count));
    return [...saved, ...extras].sort((a, b) => a.count - b.count);
  });

  const [message, setMessage] = useState<string | null>(null);
  const [thresholdError, setThresholdError] = useState<string | null>(null);
  const [percentageError, setPercentageError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setThresholdError(null);
    setPercentageError(null);

    const parsedThreshold = Number(discountThreshold);
    const parsedPercentage = Number(discountPercentage);

    if (!Number.isFinite(parsedThreshold) || parsedThreshold < 0) {
      setThresholdError("Baraj tutarı sıfırdan küçük olamaz.");
      return;
    }
    if (!Number.isFinite(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > 100) {
      setPercentageError("İskonto oranı 0 ile 100 arasında olmalıdır.");
      return;
    }
    if (isDiscountActive && parsedThreshold <= 0) {
      setThresholdError("Kampanyayı yayına almak için baraj tutarı 0'dan büyük olmalıdır.");
      return;
    }
    if (isDiscountActive && parsedPercentage <= 0) {
      setPercentageError("Kampanyayı yayına almak için iskonto oranı 0'dan büyük olmalıdır.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discount_threshold: parsedThreshold,
          discount_percentage: parsedPercentage,
          is_discount_active: isDiscountActive,
          discount_condition_note: discountConditionNote.trim() || null,
          discount_payment_method: discountPaymentMethod,
          card_installment_options: cardInstallmentOptions,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "Ödeme ayarları kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings) {
        if (result.storefrontSettings.discount_payment_method) {
          setDiscountPaymentMethod(result.storefrontSettings.discount_payment_method);
          setDiscountPaymentTab(result.storefrontSettings.discount_payment_method);
        }
      }

      setMessage("Ödeme ayarları kaydedildi.");
    });
  }

  return (
    <Card className="overflow-hidden border-slate-200 p-0">
      {/* Header */}
      <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_42%),linear-gradient(135deg,#f8fafc_0%,#ffffff_45%,#ecfeff_100%)] px-5 py-5">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <ShoppingCart className="size-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              <Sparkles className="size-3.5" />
              Ödeme &amp; İskonto Ayarları
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">
              Nakit ve kart kampanya motoru
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Tek bir iskonto kampanyası tanımlayın, nakit veya karta uygulayın.
              Kart sekmesinden taksit seçeneklerini ve vade farklarını yönetin.
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-100 bg-slate-50">
        {(["cash", "card"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setDiscountPaymentTab(tab)}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition ${
              discountPaymentTab === tab
                ? "border-b-2 border-emerald-600 bg-white text-emerald-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "cash" ? (
              <Banknote className="size-4" />
            ) : (
              <CreditCard className="size-4" />
            )}
            {tab === "cash" ? "Nakit" : "Kredi Kartı"}
            {isDiscountActive && discountPaymentMethod === tab && (
              <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                AKTİF
              </span>
            )}
          </button>
        ))}
      </div>

      <form onSubmit={save} className="space-y-5 p-5">
        {/* İskonto Kampanyası */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            İskonto Kampanyası
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Baraj tutarı
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={discountThreshold}
                onChange={(e) => {
                  setDiscountThreshold(e.target.value);
                  setMessage(null);
                  setThresholdError(null);
                }}
                placeholder="1000"
              />
              {thresholdError ? (
                <p className="mt-2 text-sm text-amber-700">{thresholdError}</p>
              ) : (
                <p className="mt-2 text-xs text-slate-400">Ham para birimiyle. Örn: 1000 USD</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                İskonto oranı (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                inputMode="decimal"
                value={discountPercentage}
                onChange={(e) => {
                  setDiscountPercentage(e.target.value);
                  setMessage(null);
                  setPercentageError(null);
                }}
                placeholder="10"
              />
              {percentageError ? (
                <p className="mt-2 text-sm text-amber-700">{percentageError}</p>
              ) : (
                <p className="mt-2 text-xs text-slate-400">Baraj geçilince uygulanacak %</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              İskonto şart notu{" "}
              <span className="font-normal text-slate-400">(opsiyonel)</span>
            </label>
            <textarea
              rows={2}
              maxLength={300}
              value={discountConditionNote}
              onChange={(e) => {
                setDiscountConditionNote(e.target.value);
                setMessage(null);
              }}
              placeholder="Örn: Bu indirim sadece nakit alımlarda geçerlidir."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
            />
          </div>

          {/* Toggle */}
          <div className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {discountPaymentTab === "cash"
                  ? "Bu kampanyayı nakit alımlara uygula"
                  : "Bu kampanyayı kart alımlarına uygula"}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Açıkken yalnızca{" "}
                <strong>{discountPaymentTab === "cash" ? "nakit" : "kart"}</strong> seçen
                müşteriler bu iskontoya dahil olur.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const alreadyActive =
                  isDiscountActive && discountPaymentMethod === discountPaymentTab;
                if (alreadyActive) {
                  setIsDiscountActive(false);
                } else {
                  setIsDiscountActive(true);
                  setDiscountPaymentMethod(discountPaymentTab);
                }
                setMessage(null);
              }}
              aria-pressed={isDiscountActive && discountPaymentMethod === discountPaymentTab}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                isDiscountActive && discountPaymentMethod === discountPaymentTab
                  ? "bg-emerald-600"
                  : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
                  isDiscountActive && discountPaymentMethod === discountPaymentTab
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Taksit Seçenekleri — sadece Kart sekmesinde */}
        {discountPaymentTab === "card" && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Taksit Seçenekleri
            </p>
            <div className="space-y-2">
              {cardInstallmentOptions.map((option, index) => (
                <div
                  key={option.count}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                >
                  {/* Aktif toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      setCardInstallmentOptions((prev) =>
                        prev.map((o, i) =>
                          i === index ? { ...o, isActive: !o.isActive } : o,
                        ),
                      )
                    }
                    aria-pressed={option.isActive}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition ${
                      option.isActive ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition ${
                        option.isActive ? "left-4" : "left-0.5"
                      }`}
                    />
                  </button>

                  {/* Label */}
                  <span className="w-24 text-sm font-medium text-slate-800">
                    {option.label}
                  </span>

                  {/* Vade farkı */}
                  <div className="flex flex-1 items-center gap-2">
                    <span className="text-xs text-slate-400">Vade farkı:</span>
                    <div className="relative w-20">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        inputMode="decimal"
                        value={option.surchargePercentage}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!Number.isFinite(val)) return;
                          setCardInstallmentOptions((prev) =>
                            prev.map((o, i) =>
                              i === index
                                ? { ...o, surchargePercentage: Math.min(100, Math.max(0, val)) }
                                : o,
                            ),
                          );
                        }}
                        className="h-8 pr-6 text-sm"
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        %
                      </span>
                    </div>
                  </div>

                  {option.surchargePercentage > 0 && (
                    <span className="text-[10px] font-semibold text-amber-600">
                      +%{option.surchargePercentage} vade
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Aktif seçenekler sepette müşteriye sunulur. Vade farkı 0 ise ek ücret uygulanmaz.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6">
            {message ? (
              <p
                className={`text-sm ${message.includes("kaydedildi") ? "text-emerald-700" : "text-rose-600"}`}
              >
                {message}
              </p>
            ) : null}
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Ödeme ayarlarını kaydet"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
