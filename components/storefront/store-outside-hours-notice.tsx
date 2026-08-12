"use client";

import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { StorefrontNoticeScreen } from "@/components/storefront/storefront-notice-screen";
import type { StorefrontAppearanceSettings } from "@/lib/storefront/theme-context";
import type { NextOpening } from "@/lib/storefront/business-hours";

/**
 * Tenant admin panelde belirli açılış/kapanış saatleri tanımladığında, bu
 * saatlerin dışındaki ziyaretlerde gösterilen kapalı ekranı. `nextOpening`
 * varsa bir sonraki açılış zamanı da metne eklenir (bkz.
 * lib/storefront/business-hours.ts -> getNextOpening).
 */
export function StoreOutsideHoursNotice({
  nextOpening,
  appearance,
}: {
  nextOpening: NextOpening | null;
  appearance?: StorefrontAppearanceSettings;
}) {
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
    <StorefrontNoticeScreen
      title={t("notice.hoursClosedTitle")}
      body={body}
      appearance={appearance}
    />
  );
}
