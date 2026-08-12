"use client";

import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { StorefrontLanguageSwitcher } from "@/components/storefront/storefront-language-switcher";
import type { NextOpening } from "@/lib/storefront/business-hours";

/**
 * Tenant admin panelde belirli açılış/kapanış saatleri tanımladığında, bu
 * saatlerin dışındaki ziyaretlerde gösterilen kapalı ekranı. `nextOpening`
 * varsa bir sonraki açılış zamanı da metne eklenir (bkz.
 * lib/storefront/business-hours.ts -> getNextOpening).
 */
export function StoreOutsideHoursNotice({ nextOpening }: { nextOpening: NextOpening | null }) {
  const { t } = useStorefrontLocale();

  const when =
    nextOpening?.kind === "today"
      ? t("relative.today")
      : nextOpening?.kind === "tomorrow"
        ? t("relative.tomorrow")
        : nextOpening
          ? t(`weekday.${nextOpening.weekday}`)
          : null;

  const body =
    nextOpening && when
      ? t("notice.hoursClosedBodyWithTime", { when, time: nextOpening.time })
      : t("notice.hoursClosedBodyGeneric");

  return (
    <div data-storefront className="relative container-shell flex min-h-screen items-center justify-center py-8">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <StorefrontLanguageSwitcher />
      </div>
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">{t("notice.hoursClosedTitle")}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
      </div>
    </div>
  );
}
