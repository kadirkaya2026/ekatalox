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
  const [tab, setTab] = useState<"cash" | "card">("cash");

  // ── Nakit kampanyası state ─────────────────────────────────────────────────
  const [cashThreshold, setCashThreshold] = useState(
    String(storefrontSettings.cash_discount_threshold ?? 0),
  );
  const [cashPercentage, setCashPercentage] = useState(
    String(storefrontSettings.cash_discount_percentage ?? 0),
  );
  const [isCashActive, setIsCashActive] = useState(
    storefrontSettings.is_cash_discount_active ?? false,
  );
  const [cashNote, setCashNote] = useState(storefrontSettings.cash_discount_note ?? "");

  // ── Kart kampanyası state ──────────────────────────────────────────────────
  const [cardThreshold, setCardThreshold] = useState(
    String(storefrontSettings.card_campaign_threshold ?? 0),
  );
  const [isCardActive, setIsCardActive] = useState(
    storefrontSettings.is_card_campaign_active ?? false,
  );
  const [cardNote, setCardNote] = useState(storefrontSettings.card_campaign_note ?? "");
  const [cardInstallmentOptions, setCardInstallmentOptions] = useState<InstallmentOption[]>(() => {
    const saved = storefrontSettings.card_installment_options ?? [];
    if (!saved.length) return DEFAULT_INSTALLMENT_OPTIONS;
    const savedCounts = new Set(saved.map((o) => o.count));
    const extras = DEFAULT_INSTALLMENT_OPTIONS.filter((o) => !savedCounts.has(o.count));
    return [...saved, ...extras].sort((a, b) => a.count - b.count);
  });

  // ── UI / form state ────────────────────────────────────────────────────────
  const [message, setMessage] = useState<string | null>(null);
  const [cashThresholdError, setCashThresholdError] = useState<string | null>(null);
  const [cashPercentageError, setCashPercentageError] = useState<string | null>(null);
  const [cardThresholdError, setCardThresholdError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setCashThresholdError(null);
    setCashPercentageError(null);
    setCardThresholdError(null);

    const parsedCashThreshold = Number(cashThreshold);
    const parsedCashPercentage = Number(cashPercentage);
    const parsedCardThreshold = Number(cardThreshold);

    let hasError = false;

    if (!Number.isFinite(parsedCashThreshold) || parsedCashThreshold < 0) {
      setCashThresholdError("Baraj tutarı sıfırdan küçük olamaz.");
      hasError = true;
    }
    if (!Number.isFinite(parsedCashPercentage) || parsedCashPercentage < 0 || parsedCashPercentage > 100) {
      setCashPercentageError("İskonto oranı 0 ile 100 arasında olmalıdır.");
      hasError = true;
    }
    if (!Number.isFinite(parsedCardThreshold) || parsedCardThreshold < 0) {
      setCardThresholdError("Baraj tutarı sıfırdan küçük olamaz.");
      hasError = true;
    }

    if (isCashActive && parsedCashThreshold <= 0) {
      setCashThresholdError("Kampanyayı aktif etmek için baraj 0'dan büyük olmalıdır.");
      hasError = true;
    }
    if (isCashActive && parsedCashPercentage <= 0) {
      setCashPercentageError("Kampanyayı aktif etmek için iskonto oranı 0'dan büyük olmalıdır.");
      hasError = true;
    }
    if (isCardActive && parsedCardThreshold <= 0) {
      setCardThresholdError("Kampanyayı aktif etmek için baraj 0'dan büyük olmalıdır.");
      hasError = true;
    }

    if (hasError) return;

    startTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cash_discount_threshold: parsedCashThreshold,
          cash_discount_percentage: parsedCashPercentage,
          is_cash_discount_active: isCashActive,
          cash_discount_note: cashNote.trim() || null,
          card_campaign_threshold: parsedCardThreshold,
          is_card_campaign_active: isCardActive,
          card_campaign_note: cardNote.trim() || null,
          card_installment_options: cardInstallmentOptions,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "Ödeme ayarları kaydedilemedi.");
        return;
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
              Bağımsız nakit ve kart kampanyaları
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Her iki kampanyayı aynı anda tanımlayabilir ve aktif edebilirsiniz. Müşteri
              ödeme yöntemini seçtiğinde yalnızca o yöntemin kampanyası uygulanır.
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-100 bg-slate-50">
        <button
          type="button"
          onClick={() => setTab("cash")}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition ${
            tab === "cash"
              ? "border-b-2 border-emerald-600 bg-white text-emerald-700"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Banknote className="size-4" />
          Nakit
          {isCashActive && (
            <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
              AKTİF
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("card")}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition ${
            tab === "card"
              ? "border-b-2 border-blue-600 bg-white text-blue-700"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <CreditCard className="size-4" />
          Kredi Kartı
          {isCardActive && (
            <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
              AKTİF
            </span>
          )}
        </button>
      </div>

      <form onSubmit={save} className="space-y-5 p-5">
        {/* ── NAKİT SEKMESİ ─────────────────────────────── */}
        {tab === "cash" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Nakit İskonto Kampanyası
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
                    value={cashThreshold}
                    onChange={(e) => {
                      setCashThreshold(e.target.value);
                      setMessage(null);
                      setCashThresholdError(null);
                    }}
                    placeholder="500"
                  />
                  {cashThresholdError ? (
                    <p className="mt-2 text-sm text-amber-700">{cashThresholdError}</p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">Ham para birimiyle. Örn: 500 USD</p>
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
                    value={cashPercentage}
                    onChange={(e) => {
                      setCashPercentage(e.target.value);
                      setMessage(null);
                      setCashPercentageError(null);
                    }}
                    placeholder="7.5"
                  />
                  {cashPercentageError ? (
                    <p className="mt-2 text-sm text-amber-700">{cashPercentageError}</p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">Baraj geçilince uygulanacak %</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Şart notu{" "}
                  <span className="font-normal text-slate-400">(opsiyonel)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={cashNote}
                  onChange={(e) => {
                    setCashNote(e.target.value);
                    setMessage(null);
                  }}
                  placeholder="Örn: Bu indirim sadece nakit alımlarda geçerlidir."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Nakit kampanyasını aktif et</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Aktifken nakit ödeyen müşterilere otomatik iskonto uygulanır.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCashActive((v) => !v);
                    setMessage(null);
                  }}
                  aria-pressed={isCashActive}
                  className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                    isCashActive ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
                      isCashActive ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── KART SEKMESİ ───────────────────────────────── */}
        {tab === "card" && (
          <div className="space-y-4">
            {/* 0 Komisyon kampanyası */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                0 Komisyon Kampanyası
              </p>

              <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <span className="mt-0.5 text-lg">💳</span>
                <div>
                  <p className="text-sm font-semibold text-blue-800">Kart kampanyası: 0 Komisyon</p>
                  <p className="mt-0.5 text-xs text-blue-700">
                    Baraj aşılınca müşterinin seçtiği taksit seçeneğinin vade farkı otomatik
                    sıfırlanır. Fiyat indirimi uygulanmaz.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Baraj tutarı
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={cardThreshold}
                  onChange={(e) => {
                    setCardThreshold(e.target.value);
                    setMessage(null);
                    setCardThresholdError(null);
                  }}
                  placeholder="1000"
                />
                {cardThresholdError ? (
                  <p className="mt-2 text-sm text-amber-700">{cardThresholdError}</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">Ham para birimiyle. Örn: 1000 USD</p>
                )}
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Şart notu{" "}
                  <span className="font-normal text-slate-400">(opsiyonel)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={cardNote}
                  onChange={(e) => {
                    setCardNote(e.target.value);
                    setMessage(null);
                  }}
                  placeholder="Örn: 1000 USD ve üzeri kart alımlarında taksit komisyonu yok."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Kart kampanyasını aktif et</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Aktifken kart ile ödeyen ve barajı geçen müşterilerde vade farkı sıfırlanır.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCardActive((v) => !v);
                    setMessage(null);
                  }}
                  aria-pressed={isCardActive}
                  className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                    isCardActive ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
                      isCardActive ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Taksit seçenekleri */}
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
                    <button
                      type="button"
                      onClick={() =>
                        setCardInstallmentOptions((prev) =>
                          prev.map((o, i) => (i === index ? { ...o, isActive: !o.isActive } : o)),
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

                    <span className="w-24 text-sm font-medium text-slate-800">{option.label}</span>

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
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6">
            {message ? (
              <p
                className={`text-sm ${
                  message.includes("kaydedildi") ? "text-emerald-700" : "text-rose-600"
                }`}
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
