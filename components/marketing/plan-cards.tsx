import { CheckList } from "@/components/marketing/ui";
import { formatTry, TOPTAN_PLANS } from "@/lib/billing/toptan-plans";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Toptancı paket kartları: ana sayfa (compact) ve /fiyatlandirma. Ücretsiz plan
// ilk sırada; her kartın CTA'sı /basvuru?plan=<slug> (kayıt formunda seçili gelir).
export function PlanCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {TOPTAN_PLANS.map((plan) => {
        const isFree = plan.yearlyPrice === 0;
        return (
          <div
            key={plan.slug}
            className={cn(
              "flex flex-col rounded-lg border bg-white p-6",
              plan.featured ? "border-brand-navy" : "border-brand-line",
              isFree && "bg-brand-green-soft/40 border-brand-green",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-brand-navy">{plan.name}</h3>
              {plan.featured ? (
                <span className="rounded-full bg-brand-navy-soft px-3 py-1 text-xs font-semibold text-brand-navy">Önerilen</span>
              ) : null}
              {isFree ? (
                <span className="rounded-full bg-brand-green px-3 py-1 text-xs font-semibold text-white">Kart yok</span>
              ) : null}
            </div>
            <p className="mt-1 min-h-[3rem] text-sm text-brand-muted">{plan.tagline}</p>
            <div className="mt-5 flex flex-wrap items-baseline gap-x-2">
              <span className="font-plex-mono text-3xl font-medium tabular-nums text-brand-navy">
                {isFree ? "0 ₺" : formatTry(plan.yearlyPrice)}
              </span>
              <span className="text-sm text-brand-muted">{isFree ? "süresiz" : "/ yıl"}</span>
            </div>
            <p className="mt-1 text-xs text-brand-muted">
              {isFree ? "eKatalox reklamları görünür" : `Aylık yaklaşık ${formatTry(Math.round(plan.yearlyPrice / 12))} · reklamsız`}
            </p>
            <CheckList items={compact ? plan.features.slice(0, 4) : plan.features} className="mt-5 text-sm" />
            <div className="mt-auto pt-6">
              <Link
                href={`/basvuru?plan=${plan.slug}`}
                className={cn(
                  "inline-flex w-full items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition-colors",
                  isFree || plan.featured
                    ? "bg-brand-green text-white hover:bg-[#126A4F]"
                    : "border border-brand-line bg-white text-brand-ink hover:border-brand-navy",
                )}
              >
                {isFree ? "Ücretsiz başla" : "Bu paketle başla"}
              </Link>
              {!isFree ? (
                <p className="mt-2 text-center text-xs text-brand-muted">Hesabınız hemen açılır, ödeme için sizi ararız.</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
