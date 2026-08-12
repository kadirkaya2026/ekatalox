"use client";

import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import type { NextOpening } from "@/lib/storefront/business-hours";

/**
 * Ziyaretçi sayfayı açıkken (sekmeyi kapatmadan) mağaza saatleri dışına
 * çıkıldığında gösterilen tam ekran uyarı. Sepeti/oturumu bozmaz — sadece
 * storefront-client.tsx içindeki periyodik saat kontrolü tetiklendiğinde
 * mevcut içeriğin üzerine biner (bkz. isStoreOpenNow polling effect).
 */
export function StoreClosedOverlay({ nextOpening }: { nextOpening: NextOpening | null }) {
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-900">{t("notice.hoursClosedNowTitle")}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
      </div>
    </div>
  );
}
