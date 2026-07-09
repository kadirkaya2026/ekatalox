import { Check } from "lucide-react";
import {
  formatPlanCapacityFeature,
  PLAN_OPTIONS,
  PLAN_PRICING,
} from "@/lib/billing/plans";

const PLAN_FEATURE_SUMMARY: Record<string, string[]> = {
  baslangic: [
    "3 seviyeli müşteri fiyat listesi",
    "WhatsApp sipariş formu",
    "ekatalox.com subdomain adresi",
  ],
  profesyonel: [
    "Sınırsız fiyat listesi",
    "Özel domain desteği",
    "Akıllı stok yönetimi",
    "Öncelikli teknik destek",
  ],
  kurumsal: [
    "Alex AI ile WhatsApp otomasyonu",
    "Tüm Profesyonel özellikleri",
    "Kurumsal onboarding",
  ],
};

/**
 * Deneme süresi dolan tenant admin'i panele giriş yaptığında karşılayan,
 * kapatılamayan tam ekran paket seçim ekranı.
 */
export function TrialExpiredModal({ companyName }: { companyName: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/80 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl md:p-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
            Deneme Süresi Doldu
          </p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">
            Deneme üyeliğinizin sonuna geldiniz
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            {companyName} için 14 günlük deneme süreniz sona erdi. eKatalox'u
            kullanmaya devam edebilmek için bir paket satın almanız gerekmekte.
            Size uygun paketi seçin, dakikalar içinde kaldığınız yerden devam
            edin.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PLAN_OPTIONS.map((plan) => {
            const pricing = PLAN_PRICING[plan.id];
            const featured = plan.id === "profesyonel";

            return (
              <div
                key={plan.id}
                className={
                  featured
                    ? "relative rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 p-5"
                    : "rounded-2xl border border-slate-200 p-5"
                }
              >
                {featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Önerilen
                  </span>
                ) : null}
                <h3 className="text-lg font-semibold text-slate-900">
                  {plan.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500">{pricing.highlight}</p>
                <p className="mt-3">
                  <span className="text-2xl font-bold text-slate-900">
                    {pricing.price}
                  </span>
                  <span className="text-sm text-slate-500"> {pricing.unit}</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {formatPlanCapacityFeature(plan.id)}
                  </li>
                  {PLAN_FEATURE_SUMMARY[plan.id].map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl bg-slate-50 p-5 text-center">
          <p className="text-sm font-medium text-slate-900">
            Paket satın almak için bizimle iletişime geçin
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Aynı gün içinde hesabınızı seçtiğiniz pakete geçirelim.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://www.ekatalox.com/iletisim"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              İletişim Formu
            </a>
            <a
              href="mailto:info@ekatalox.com?subject=Paket%20Sat%C4%B1n%20Alma"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              info@ekatalox.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
