import { CheckList } from "@/components/marketing/ui";
import { formatTry, TOPTAN_PLANS } from "@/lib/billing/toptan-plans";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PAID_PLAN_TRIAL_DAYS } from "@/lib/billing/plan-trial";

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
                <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", dark ? "bg-brand-neon text-brand-dark" : "bg-brand-green text-white")}>
                  Süresiz
                </span>
              ) : null}
            </div>
            <p className={cn("mt-2 min-h-[4.5rem] text-sm leading-relaxed", dark ? "text-white/70" : "text-brand-muted")}>{plan.tagline}</p>
            <div className="mt-5 flex flex-wrap items-baseline gap-x-2">
              <span className={cn("text-3xl font-bold tracking-[-0.02em] tabular-nums", dark ? "text-white" : "text-brand-navy")}>
                {isFree ? "0 ₺" : formatTry(plan.yearlyPrice)}
              </span>
              <span className={cn("text-sm", dark ? "text-white/50" : "text-brand-muted")}>{isFree ? "süresiz" : "/ yıl"}</span>
            </div>
            <p className={cn("mt-1 text-xs", dark ? "text-white/45" : "text-brand-muted")}>
              {isFree ? "Kart bilgisi gerekmez · eKatalox reklamlı" : "Yıllık peşin ödeme · KDV hariç · reklamsız"}
            </p>
            <CheckList items={(compact ? plan.features.slice(0, 4) : plan.features).filter((feature) => !/^Aylık .* ziyaretçi$/.test(feature))} className="mt-5 text-sm" dark={dark} />
            <p className={cn("mt-3 text-xs", dark ? "text-white/70" : "text-brand-muted")}>
              Aylık {plan.visitorLimit.toLocaleString("tr-TR")} ziyaretçi
            </p>
            <div className="mt-auto pt-6">
              <Link
                href={`/basvuru?plan=${plan.slug}`}
                className={cn(
                  "inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all",
                  highlight
                    ? dark
                      ? "bg-brand-neon text-brand-dark hover:shadow-[0_0_24px_-4px_rgba(34,197,94,0.6)]"
                      : "bg-brand-green text-white hover:bg-[#126A4F]"
                    : dark
                      ? "border border-white/15 bg-white/5 text-white hover:border-white/30"
                      : "border border-brand-line bg-white text-brand-ink hover:border-brand-navy",
                )}
              >
                {isFree ? "Ücretsiz başla" : `${PAID_PLAN_TRIAL_DAYS} gün ücretsiz dene`}
              </Link>
              {!isFree ? (
                <p className={cn("mt-2 text-center text-xs", dark ? "text-white/45" : "text-brand-muted")}>
                  Ödeme yapılmazsa deneme sonunda Ücretsiz plana geçersiniz.
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
