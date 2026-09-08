"use client";

// Fiyatlandırma tablosu: dönem seçimi, iki paket kartı, kupon kutusu ve
// özellik karşılaştırması. Fiyatlar lib/billing/esnaf-plans.ts'den okunur.
import Link from "next/link";
import { useState } from "react";
import {
  ESNAF_PLANS,
  ESNAF_TRIAL_DAYS,
  formatTry,
  getPlanPrice,
  yearlySavingsPct,
  type BillingPeriod,
  type EsnafPlanSlug,
} from "@/lib/billing/esnaf-plans";
import { CheckList } from "@/components/marketing/ui";
import { CouponBox, type CouponResult } from "@/components/marketing/coupon-box";
import { cn } from "@/lib/utils";

type ComparisonRow = { label: string; esnaf: string | boolean; esnaf_plus: string | boolean };

// Karşılaştırma satırları paket metinlerinden türetilmiş gerçek kapsam.
const COMPARISON: ComparisonRow[] = [
  { label: "Sipariş sayfası adresi", esnaf: "dukkan.ekatalox.com", esnaf_plus: "Kendi alan adınız" },
  { label: "Ürünlerin bizim tarafımızdan yüklenmesi", esnaf: true, esnaf_plus: true },
  { label: "WhatsApp'a PDF sipariş", esnaf: true, esnaf_plus: true },
  { label: "Hazırlanıyor ve yola çıktı bildirimleri", esnaf: true, esnaf_plus: true },
  { label: "Kampanya ve indirimli ürün sayfası", esnaf: true, esnaf_plus: true },
  { label: "Yoğunum modu, çalışma saatleri, minimum sepet", esnaf: true, esnaf_plus: true },
  { label: "Yaş doğrulama", esnaf: true, esnaf_plus: true },
  { label: "Veresiye takibi ve tahsilat bildirimi", esnaf: false, esnaf_plus: true },
  { label: "Satış ve kârlılık raporu", esnaf: false, esnaf_plus: true },
  { label: "Müşteri kuponu ve \"sizi özledik\" bildirimi", esnaf: false, esnaf_plus: true },
  { label: "Magnet sipariş takibi (hangi magnet müşteri getirdi)", esnaf: false, esnaf_plus: true },
  { label: "QR magnet hediye", esnaf: "100 adet", esnaf_plus: "300 adet" },
  { label: "Ürün sınırı", esnaf: "1.000", esnaf_plus: "2.500" },
  { label: "Destek", esnaf: "WhatsApp ve e-posta", esnaf_plus: "Öncelikli hat" },
];

export function PricingTable({ initialPeriod = "yearly" }: { initialPeriod?: BillingPeriod }) {
  const [period, setPeriod] = useState<BillingPeriod>(initialPeriod);
  const [couponPlan, setCouponPlan] = useState<EsnafPlanSlug>("esnaf_plus");
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);

  const savings = yearlySavingsPct(ESNAF_PLANS[0]);

  function changePeriod(next: BillingPeriod) {
    setPeriod(next);
    setCouponResult(null);
  }

  return (
    <div>
      {/* Dönem seçimi */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div role="group" aria-label="Ödeme dönemi" className="inline-flex rounded-md border border-brand-line bg-white p-1">
          <PeriodButton active={period === "monthly"} onClick={() => changePeriod("monthly")}>
            Aylık
          </PeriodButton>
          <PeriodButton active={period === "yearly"} onClick={() => changePeriod("yearly")}>
            Yıllık
          </PeriodButton>
        </div>
        <p className="text-sm font-semibold text-brand-green">Yıllıkta %{savings} tasarruf</p>
      </div>

      {/* Paket kartları */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {ESNAF_PLANS.map((plan) => {
          const price = getPlanPrice(plan, period);
          const monthlyEq = period === "yearly" ? Math.round(plan.yearlyPrice / 12) : null;
          return (
            <article
              key={plan.slug}
              className={cn(
                "flex flex-col rounded-lg bg-white p-6 sm:p-8",
                plan.featured ? "border-2 border-brand-green" : "border border-brand-line",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-bold text-brand-navy">{plan.name}</h3>
                  <p className="mt-1 text-sm text-brand-muted">{plan.tagline}</p>
                </div>
                {plan.featured ? (
                  <span className="shrink-0 rounded-md bg-brand-green-soft px-2 py-1 text-xs font-semibold text-brand-green">Önerilen</span>
                ) : null}
              </div>

              <div className="mt-6 border-b border-brand-line pb-6">
                <p className="font-plex-mono text-4xl font-medium tabular-nums text-brand-navy">
                  {formatTry(price)}
                  <span className="ml-1 text-base font-normal text-brand-muted">{period === "yearly" ? "/ yıl" : "/ ay"}</span>
                </p>
                <p className="mt-1 text-sm text-brand-muted">
                  KDV hariç.{" "}
                  {monthlyEq !== null
                    ? `Aya ${formatTry(monthlyEq)} düşer.`
                    : `Yıllık ödemede ${formatTry(plan.yearlyPrice)} (%${yearlySavingsPct(plan)} daha az).`}
                </p>
              </div>

              <CheckList items={plan.features} className="mt-6 text-sm" />

              <div className="mt-8 flex flex-col gap-2">
                <Link
                  href={`/basvuru?plan=${plan.slug}&period=${period}`}
                  className={cn(
                    "inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition-colors",
                    plan.featured ? "bg-brand-green text-white hover:bg-[#126A4F]" : "bg-brand-navy text-white hover:bg-[#0E2039]",
                  )}
                >
                  Ücretsiz başla
                </Link>
                <p className="text-center text-xs text-brand-muted">{ESNAF_TRIAL_DAYS} gün ücretsiz, kart bilgisi istenmez.</p>
              </div>
            </article>
          );
        })}
      </div>

      {/* Kupon */}
      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <CouponBox
          plan={couponPlan}
          period={period}
          value={couponCode}
          onValueChange={setCouponCode}
          result={couponResult}
          onResult={setCouponResult}
        />
        <div className="rounded-lg border border-brand-line bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-muted">Kupon hangi pakete</p>
          <div className="mt-2 flex gap-2">
            {ESNAF_PLANS.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => {
                  setCouponPlan(p.slug);
                  setCouponResult(null);
                }}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-medium",
                  couponPlan === p.slug ? "border-brand-navy bg-brand-navy text-white" : "border-brand-line bg-white text-brand-ink",
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Karşılaştırma */}
      <div className="mt-16">
        <h3 className="text-2xl font-bold tracking-[-0.02em] text-brand-navy">Paketleri karşılaştırın</h3>
        <div className="mt-6 overflow-x-auto rounded-lg border border-brand-line bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-brand-paper text-brand-navy">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Özellik
                </th>
                {ESNAF_PLANS.map((p) => (
                  <th key={p.slug} scope="col" className="px-4 py-3 font-semibold">
                    {p.name}
                    <span className="block font-plex-mono text-xs font-normal text-brand-muted">
                      {formatTry(getPlanPrice(p, period))} {period === "yearly" ? "/ yıl" : "/ ay"}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-t border-brand-line">
                  <th scope="row" className="px-4 py-3 font-normal text-brand-ink">
                    {row.label}
                  </th>
                  <td className="px-4 py-3">
                    <Cell value={row.esnaf} />
                  </td>
                  <td className="px-4 py-3">
                    <Cell value={row.esnaf_plus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PeriodButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded px-4 py-2 text-sm font-semibold transition-colors",
        active ? "bg-brand-navy text-white" : "text-brand-ink hover:bg-brand-navy-soft",
      )}
    >
      {children}
    </button>
  );
}

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === "string") return <span className="text-brand-ink">{value}</span>;
  return value ? (
    <span className="inline-flex items-center gap-1.5 font-medium text-brand-green">
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 10.5l4 4 8-9" />
      </svg>
      Var
    </span>
  ) : (
    <span className="text-brand-muted">Yok</span>
  );
}
