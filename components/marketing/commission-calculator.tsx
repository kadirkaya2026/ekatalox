"use client";

// Komisyon hesaplayıcı: sitedeki tek istemci bileşeni. Komisyon oranını
// kullanıcı belirler; hiçbir platformun oranı iddia edilmez. eKatalox tarafı
// ESNAF_PLANS'tan okunur, elle rakam yazılmaz.
import { useId, useState } from "react";
import { ESNAF_PLANS, formatTry } from "@/lib/billing/esnaf-plans";

const esnaf = ESNAF_PLANS[0];

function RangeField({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-brand-ink">
          {label}
        </label>
        <output htmlFor={id} className="font-plex-mono text-base font-medium tabular-nums text-brand-navy">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-brand-line accent-brand-green"
      />
      <div className="mt-1 flex justify-between font-plex-mono text-xs tabular-nums text-brand-muted">
        <span>{min.toLocaleString("tr-TR")}</span>
        <span>{max.toLocaleString("tr-TR")}</span>
      </div>
    </div>
  );
}

export function CommissionCalculator() {
  const [orders, setOrders] = useState(300);
  const [basket, setBasket] = useState(500);
  const [rate, setRate] = useState(20);

  const monthlyRevenue = orders * basket;
  const yearlyCommission = Math.round(monthlyRevenue * 12 * (rate / 100));
  const yearlyEsnaf = esnaf.yearlyPrice;
  const difference = yearlyCommission - yearlyEsnaf;

  return (
    <div className="grid gap-8 rounded-lg border border-brand-line bg-white p-6 sm:p-8 lg:grid-cols-2 lg:gap-12">
      <div className="space-y-7">
        <RangeField
          label="Aylık sipariş sayısı"
          value={orders}
          min={10}
          max={2000}
          step={10}
          display={`${orders.toLocaleString("tr-TR")} sipariş`}
          onChange={setOrders}
        />
        <RangeField
          label="Ortalama sepet tutarı"
          value={basket}
          min={100}
          max={5000}
          step={50}
          display={formatTry(basket)}
          onChange={setBasket}
        />
        <RangeField
          label="Ödediğiniz komisyon oranı"
          value={rate}
          min={5}
          max={30}
          step={1}
          display={`%${rate}`}
          onChange={setRate}
        />
        <p className="text-xs leading-relaxed text-brand-muted">
          Oranı kendi anlaşmanıza göre ayarlayın. Hesap, aylık ciro × 12 × komisyon oranı ile yapılır; KDV ve ek
          hizmet bedelleri dahil değildir.
        </p>
      </div>

      <div className="flex flex-col justify-between gap-6 border-t border-brand-line pt-6 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
        <dl className="space-y-5">
          <div>
            <dt className="text-sm text-brand-muted">Yılda ödediğiniz komisyon</dt>
            <dd className="mt-1 font-plex-mono text-3xl font-medium tabular-nums text-brand-ink sm:text-4xl">
              {formatTry(yearlyCommission)}
            </dd>
            <p className="mt-1 text-xs text-brand-muted">
              Aylık ciro {formatTry(monthlyRevenue)} üzerinden
            </p>
          </div>
          <div>
            <dt className="text-sm text-brand-muted">eKatalox {esnaf.name}, yıllık sabit ücret</dt>
            <dd className="mt-1 font-plex-mono text-3xl font-medium tabular-nums text-brand-green sm:text-4xl">
              {formatTry(yearlyEsnaf)}
            </dd>
            <p className="mt-1 text-xs text-brand-muted">Sipariş sayısı ne olursa olsun değişmez.</p>
          </div>
        </dl>

        <div className="rounded-md bg-brand-paper p-4" aria-live="polite">
          {difference > 0 ? (
            <p className="text-sm leading-relaxed text-brand-ink">
              Bu hacimde eKatalox ile yılda{" "}
              <strong className="font-plex-mono font-medium tabular-nums text-brand-navy">{formatTry(difference)}</strong>{" "}
              cebinizde kalır.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-brand-ink">
              Bu hacimde iki seçenek arasında belirgin bir fark yok. Sipariş sayınız arttıkça sabit ücret lehinize döner;
              üstelik müşteri verisi ve iletişim sizde kalır.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
