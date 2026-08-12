"use client";

import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import type { NextOpening } from "@/lib/storefront/business-hours";
import { cn } from "@/lib/utils";

/**
 * Ziyaretçi sayfayı açıkken (sekmeyi kapatmadan) mağaza saatleri dışına
 * çıkıldığında gösterilen tam ekran uyarı. Sepeti/oturumu bozmaz — sadece
 * storefront-client.tsx içindeki periyodik saat kontrolü tetiklendiğinde
 * mevcut içeriğin üzerine biner (bkz. isStoreOpenNow polling effect).
 */
export function StoreClosedOverlay({ nextOpening }: { nextOpening: NextOpening | null }) {
  const { t } = useStorefrontLocale();
  const theme = useStorefrontTheme();

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className={cn(theme.gateCard, "text-center")}>
        <h1 className={theme.gateTitle}>{t("notice.hoursClosedNowTitle")}</h1>
        <p className={theme.gateDescription}>{body}</p>
      </div>
    </div>
  );
}
