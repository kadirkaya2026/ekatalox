"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, Globe, Plus, Trash2, ShoppingCart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import type { TenantPlan } from "@/lib/billing/plans";
import type {
  CashDiscountTier,
  CardCampaignTier,
  InstallmentOption,
  TenantStorefrontSettings,
} from "@/lib/types";
import { DEFAULT_INSTALLMENT_OPTIONS } from "@/lib/storefront/cart";
import { cn } from "@/lib/utils";

type CashTierRow = CashDiscountTier & { _id: string };
type CardTierRow = CardCampaignTier & { _id: string };

type PaymentSettingsTab = "cash" | "card" | "installments";

const PAYMENT_SETTINGS_TABS: Array<{ key: PaymentSettingsTab; label: string }> = [
  { key: "cash", label: "Nakit Kampanyası" },
  { key: "card", label: "Kart Kampanyası" },
  { key: "installments", label: "Taksit Seçenekleri & Vade Farkları" },
];

export function TenantPaymentSettingsForm({
  storefrontSettings,
  plan,
  companyName,
}: {
  storefrontSettings: TenantStorefrontSettings;
  plan: TenantPlan;
  companyName: string;
}) {
  // ── Nakit kampanyası state ─────────────────────────────────────────────────
  const [cashTiers, setCashTiers] = useState<CashTierRow[]>(() =>
    (storefrontSettings.cash_discount_tiers ?? []).map((t) => ({
      ...t,
      _id: crypto.randomUUID(),
    })),
  );
  const [isCashActive, setIsCashActive] = useState(
    storefrontSettings.is_cash_discount_active ?? false,
  );
  const [cashNote, setCashNote] = useState(storefrontSettings.cash_discount_note ?? "");

  // ── Kart kampanyası state ──────────────────────────────────────────────────
  const [cardTiers, setCardTiers] = useState<CardTierRow[]>(() =>
    (storefrontSettings.card_campaign_tiers ?? []).map((t) => ({
      ...t,
      _id: crypto.randomUUID(),
    })),
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

  // ── UI state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<PaymentSettingsTab>("cash");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // ── Tier helpers ─────────────────────────────────────────────────────────────
  function addCashTier() {
    setCashTiers((prev) => [
      ...prev,
      { threshold: 0, percentage: 0, _id: crypto.randomUUID() },
    ]);
    setMessage(null);
  }

  function updateCashTier(id: string, field: keyof CashDiscountTier, value: number) {
    setCashTiers((prev) => prev.map((t) => (t._id === id ? { ...t, [field]: value } : t)));
    setMessage(null);
  }

  function removeCashTier(id: string) {
    setCashTiers((prev) => prev.filter((t) => t._id !== id));
    setMessage(null);
  }

  function addCardTier() {
    setCardTiers((prev) => [
      ...prev,
      { threshold: 0, maxFreeInstallmentCount: 3, _id: crypto.randomUUID() },
    ]);
    setMessage(null);
  }

  function updateCardTier(id: string, field: keyof CardCampaignTier, value: number) {
    setCardTiers((prev) => prev.map((t) => (t._id === id ? { ...t, [field]: value } : t)));
    setMessage(null);
  }

  function removeCardTier(id: string) {
    setCardTiers((prev) => prev.filter((t) => t._id !== id));
    setMessage(null);
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_cash_discount_active: isCashActive,
          cash_discount_note: cashNote.trim() || null,
          cash_discount_tiers: cashTiers
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .map(({ _id, ...t }) => t)
            .sort((a, b) => a.threshold - b.threshold),
          is_card_campaign_active: isCardActive,
          card_campaign_note: cardNote.trim() || null,
          card_campaign_tiers: cardTiers
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .map(({ _id, ...t }) => t)
            .sort((a, b) => a.threshold - b.threshold),
          card_installment_options: cardInstallmentOptions,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "Ödeme ayarları kaydedilemedi.");
        return;
      }
      setMessage("Ödeme ayarları kaydedildi.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
    <Card className="overflow-hidden border-border p-0">
      {/* Header */}
      <div className="border-b border-border bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_42%),linear-gradient(135deg,#f8fafc_0%,#ffffff_45%,#ecfeff_100%)] px-5 py-5">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <ShoppingCart className="size-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              <Sparkles className="size-3.5" />
              Ödeme &amp; İskonto Ayarları
            </div>
            <h2 className="mt-3 text-lg font-semibold text-foreground">
              Basamaklı nakit ve kart kampanyaları
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Her iki kampanyaya birden fazla baraj tanımlayabilirsiniz. Müşteri sepetine
              uygun en yüksek baraj otomatik uygulanır.
            </p>
          </div>
        </div>
      </div>
    </Card>

      <form onSubmit={save} className="space-y-6">
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap border-b border-border">
            {PAYMENT_SETTINGS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition sm:px-5",
                  activeTab === tab.key
                    ? "border-emerald-500 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-700",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
        {/* ── NAKİT KAMPANYASI ─────────────────────────────── */}
        {activeTab === "cash" ? (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Banknote className="size-5 text-emerald-700" />
            <h2 className="text-lg font-semibold text-foreground">Nakit Kampanyası</h2>
            {isCashActive && (
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                AKTİF
              </span>
            )}
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/60/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Nakit İskonto Barajları
                </p>
                <button
                  type="button"
                  onClick={addCashTier}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Plus className="size-3.5" />
                  Baraj Ekle
                </button>
              </div>

              {cashTiers.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Henüz baraj eklenmedi. &ldquo;Baraj Ekle&rdquo; butonuna basın.
                </p>
              ) : (
                <div className="space-y-2">
                  {/* Başlık satırı */}
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Baraj tutarı</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">İskonto oranı (%)</span>
                    <span className="w-8" />
                  </div>
                {cashTiers
                    .slice()
                    .sort((a, b) => a.threshold - b.threshold)
                    .map((tier) => (
                        <div key={tier._id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 rounded-xl border border-border bg-card p-3">
                          <div>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              inputMode="decimal"
                              value={tier.threshold}
                              onChange={(e) =>
                                updateCashTier(tier._id, "threshold", Number(e.target.value))
                              }
                              placeholder="500"
                              className="h-9"
                            />
                          </div>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              inputMode="decimal"
                              value={tier.percentage}
                              onChange={(e) =>
                                updateCashTier(tier._id, "percentage", Number(e.target.value))
                              }
                              placeholder="7.5"
                              className="h-9 pr-7"
                            />
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              %
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCashTier(tier._id)}
                            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ))}
                </div>
              )}

              <p className="mt-2 text-xs text-muted-foreground">
                En yüksek barajı geçen müşteriye o tier&apos;ın iskontosu uygulanır.
              </p>
            </div>

            {/* Şart notu */}
            <div className="rounded-2xl border border-border bg-muted/60/60 p-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Şart notu{" "}
                <span className="font-normal text-muted-foreground">(opsiyonel)</span>
              </label>
              <textarea
                rows={2}
                maxLength={300}
                value={cashNote}
                onChange={(e) => { setCashNote(e.target.value); setMessage(null); }}
                placeholder="Örn: Bu indirim sadece nakit alımlarda geçerlidir."
                className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-slate-400 focus:outline-none"
              />
            </div>

            {/* Toggle */}
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-muted/60/60 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Nakit kampanyasını aktif et</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Aktifken nakit ödeyen müşterilere otomatik iskonto uygulanır.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setIsCashActive((v) => !v); setMessage(null); }}
                aria-pressed={isCashActive}
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                  isCashActive ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 size-5 rounded-full bg-card shadow-sm transition ${
                    isCashActive ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
        ) : null}

        {/* ── KART KAMPANYASI ───────────────────────────────── */}
        {activeTab === "card" ? (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="size-5 text-blue-700" />
            <h2 className="text-lg font-semibold text-foreground">Kart Kampanyası</h2>
            {isCardActive && (
              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                AKTİF
              </span>
            )}
          </div>
          <div className="space-y-4">
            {/* 0 Komisyon barajları */}
            <div className="rounded-2xl border border-border bg-muted/60/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  0 Komisyon Barajları
                </p>
                <button
                  type="button"
                  onClick={addCardTier}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus className="size-3.5" />
                  Baraj Ekle
                </button>
              </div>

              <div className="mb-3 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <span className="mt-0.5 text-lg">💳</span>
                <div>
                  <p className="text-sm font-semibold text-blue-800">Kart kampanyası: 0 Komisyon</p>
                  <p className="mt-0.5 text-xs text-blue-700">
                    Barajı aşan müşteri, belirtilen taksit sayısına kadar 0 vade farkıyla ödeme yapar.
                    Baraj dışındaki taksitler normal vade farkıyla görünür.
                  </p>
                </div>
              </div>

              {cardTiers.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Henüz baraj eklenmedi. &ldquo;Baraj Ekle&rdquo; butonuna basın.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Baraj tutarı</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Maks. ücretsiz taksit</span>
                    <span className="w-8" />
                  </div>
                  {cardTiers
                    .slice()
                    .sort((a, b) => a.threshold - b.threshold)
                    .map((tier) => (
                        <div
                          key={tier._id}
                          className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 rounded-xl border border-border bg-card p-3"
                        >
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={tier.threshold}
                            onChange={(e) =>
                              updateCardTier(tier._id, "threshold", Number(e.target.value))
                            }
                            placeholder="1000"
                            className="h-9"
                          />
                          <select
                            value={tier.maxFreeInstallmentCount}
                            onChange={(e) =>
                              updateCardTier(
                                tier._id,
                                "maxFreeInstallmentCount",
                                Number(e.target.value),
                              )
                            }
                            className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-slate-400 focus:outline-none"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                              <option key={n} value={n}>
                                {n === 1 ? "Peşin" : `${n} Taksit`}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeCardTier(tier._id)}
                            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ))}
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Örn: 1000$ barajında 6 taksit → sepet ≥ 1000$ ise 6 taksit ve altı ücretsiz.
              </p>
            </div>

            {/* Şart notu */}
            <div className="rounded-2xl border border-border bg-muted/60/60 p-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Şart notu{" "}
                <span className="font-normal text-muted-foreground">(opsiyonel)</span>
              </label>
              <textarea
                rows={2}
                maxLength={300}
                value={cardNote}
                onChange={(e) => { setCardNote(e.target.value); setMessage(null); }}
                placeholder="Örn: 1000 USD ve üzeri kart alımlarında taksit komisyonu yok."
                className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-slate-400 focus:outline-none"
              />
            </div>

            {/* Toggle */}
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-muted/60/60 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Kart kampanyasını aktif et</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Aktifken kart ile ödeyen ve barajı geçen müşterilerde vade farkı sıfırlanır.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setIsCardActive((v) => !v); setMessage(null); }}
                aria-pressed={isCardActive}
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                  isCardActive ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 size-5 rounded-full bg-card shadow-sm transition ${
                    isCardActive ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
        ) : null}

        {/* ── TAKSİT SEÇENEKLERİ & VADE FARKLARI ───────────────────────────────── */}
        {activeTab === "installments" ? (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="size-5 text-emerald-700" />
            <h2 className="text-lg font-semibold text-foreground">
              Taksit Seçenekleri &amp; Vade Farkları
            </h2>
          </div>
          <div>
              <div className="space-y-2">
                {cardInstallmentOptions.map((option, index) => (
                  <div
                    key={option.count}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
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
                        className={`absolute top-0.5 size-4 rounded-full bg-card shadow-sm transition ${
                          option.isActive ? "left-4" : "left-0.5"
                        }`}
                      />
                    </button>

                    <span className="w-24 text-sm font-medium text-slate-800">{option.label}</span>

                    <div className="flex flex-1 items-center gap-2">
                      <span className="text-xs text-muted-foreground">Vade farkı:</span>
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
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
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
              <p className="mt-3 text-xs text-muted-foreground">
                Aktif seçenekler sepette müşteriye sunulur. Vade farkı 0 ise ek ücret uygulanmaz.
              </p>
          </div>
        </div>
        ) : null}
          </div>
        </Card>

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

    <PlanFeatureGate feature="online_payment" plan={plan} companyName={companyName}>
      <Card className="overflow-hidden border-border p-0">
        <div className="border-b border-border bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_42%),linear-gradient(135deg,#f8fafc_0%,#ffffff_45%,#eff6ff_100%)] px-5 py-5">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Globe className="size-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
                <CreditCard className="size-3.5" />
                Online Sanal POS Ödemesi
              </div>
              <h2 className="mt-3 text-lg font-semibold text-foreground">
                Vitrin üzerinden kredi kartı tahsilatı
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                iyzico, Paynet ve benzeri sanal POS sağlayıcıları ile müşterilerinizin
                sitenizden doğrudan ödeme yapmasını sağlayın.
              </p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm leading-6 text-muted-foreground">
            Sanal POS entegrasyon ayarları yakında eklenecek. Kurumsal paketinizle bu
            özelliği kullanmaya hazırsınız.
          </p>
        </div>
      </Card>
    </PlanFeatureGate>
    </div>
  );
}
