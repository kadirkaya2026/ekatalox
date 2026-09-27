"use client";

import { cn } from "@/lib/utils";
export type PlanAudience = "toptanci" | "market";

export function PlanAudienceSelector({ value, onChange, dark = false }: {
  value: PlanAudience; onChange: (value: PlanAudience) => void; dark?: boolean;
}) {
  return <div className="mb-8">
    <div role="group" aria-label="İşletme türüne göre paket sunumu" className={cn("inline-flex w-full flex-col gap-1 rounded-2xl border p-1.5 sm:w-auto sm:flex-row", dark ? "border-white/15 bg-white/5" : "border-brand-line bg-brand-paper")}>
      {([['toptanci', 'Toptancı & Üretici'], ['market', 'Market & Perakende']] as const).map(([key, label]) =>
        <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)}
          className={cn("rounded-xl px-6 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green", value === key ? (dark ? "bg-brand-neon text-brand-dark" : "bg-brand-green text-white shadow-sm") : (dark ? "text-white/75 hover:bg-white/10" : "text-brand-muted hover:bg-white"))}>{label}</button>
      )}
    </div>
    <p className={cn("mt-3 text-sm", dark ? "text-white/65" : "text-brand-muted")}>Her sektörde aynı paket, aynı fiyat. İşinize uygun kullanım örneklerini keşfedin.</p>
    <p className={cn("mt-2 text-sm", dark ? "text-white/80" : "text-brand-ink")}>
      {value === "market" ? "Konum eklenebilen siparişler, mobilde sabit alt sepet ve minimum sepet tutarıyla market alışverişini kolaylaştırın." : "Bayilerinize özel fiyat listeleri, toplu ürün yükleme ve sipariş takibiyle toptan satışınızı yönetin."}
    </p>
  </div>;
}
