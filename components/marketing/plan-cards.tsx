import { CheckList } from "@/components/marketing/ui";
import { formatTry, TOPTAN_PLANS } from "@/lib/billing/toptan-plans";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Toptancı paket kartları: ana sayfa (compact, dark) ve /fiyatlandirma (açık).
// Ücretsiz plan ilk sırada; her kartın CTA'sı /basvuru?plan=<slug>.
export function PlanCards({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {TOPTAN_PLANS.map((plan) => {
        const isFree = plan.yearlyPrice === 0;
        const highlight = isFree || plan.featured;
        return (
          <div
            key={plan.slug}
            className={cn(
              "flex flex-col rounded-2xl border p-6",
              dark
                ? cn(
                    "bg-brand-dark-surface",
                    plan.featured ? "border-brand-neon shadow-[0_0_40px_-12px_rgba(34,197,94,0.5)]" : "border-white/10",
                    isFree && "border-brand-neon/40",
                  )
                : cn(
                    "bg-white",
                    plan.featured ? "border-brand-navy" : "border-brand-line",
                    isFree && "border-brand-green bg-brand-green-soft/40",
                  ),
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className={cn("text-xl font-semibold", dark ? "text-white" : "text-brand-navy")}>{plan.name}</h3>
              {plan.featured ? (
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    dark ? "bg-brand-neon/15 text-brand-neon" : "bg-brand-navy-soft text-brand-navy",
                  )}
                >
                  Önerilen
                </span>
              ) : null}
              {isFree ? (
                <span className={cn("rounded-full px-3 py-1 text-xs font-semibold text-white", dark ? "bg-brand-neon" : "bg-brand-green")}>
                  Kart yok
                </span>
              ) : null}
            </div>
            <p className={cn("mt-1 min-h-[3rem] text-sm", dark ? "text-white/60" : "text-brand-muted")}>{plan.tagline}</p>
            <div className="mt-5 flex flex-wrap items-baseline gap-x-2">
              <span className={cn("text-3xl font-bold tracking-[-0.02em] tabular-nums", dark ? "text-white" : "text-brand-navy")}>
                {isFree ? "0 ₺" : formatTry(plan.yearlyPrice)}
              </span>
              <span className={cn("text-sm", dark ? "text-white/50" : "text-brand-muted")}>{isFree ? "süresiz" : "/ yıl"}</span>
            </div>
            <p className={cn("mt-1 text-xs", dark ? "text-white/45" : "text-brand-muted")}>
              {isFree ? "eKatalox reklamları görünür" : `Aylık yaklaşık ${formatTry(Math.round(plan.yearlyPrice / 12))} · reklamsız`}
            </p>
            <CheckList items={compact ? plan.features.slice(0, 4) : plan.features} className="mt-5 text-sm" dark={dark} />
            <div className="mt-auto pt-6">
              <Link
                href={`/basvuru?plan=${plan.slug}`}
                className={cn(
                  "inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all",
                  highlight
                    ? dark
                      ? "bg-brand-neon text-white hover:shadow-[0_0_24px_-4px_rgba(34,197,94,0.6)]"
                      : "bg-brand-green text-white hover:bg-[#126A4F]"
                    : dark
                      ? "border border-white/15 bg-white/5 text-white hover:border-white/30"
                      : "border border-brand-line bg-white text-brand-ink hover:border-brand-navy",
                )}
              >
                {isFree ? "Ücretsiz başla" : "Bu paketle başla"}
              </Link>
              {!isFree ? (
                <p className={cn("mt-2 text-center text-xs", dark ? "text-white/45" : "text-brand-muted")}>
                  14 gün ücretsiz deneyin, ödeme için sizi ararız.
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
