"use client";

import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { StorefrontNoticeScreen } from "@/components/storefront/storefront-notice-screen";
import type { StorefrontAppearanceSettings } from "@/lib/storefront/theme-context";

/**
 * Deneme süresi dolan tenant'ın vitrininde son müşteriye gösterilen nötr
 * kapalıyız ekranı. Ziyaretçi tenant'ın müşterisi olduğu için paket/ödeme
 * detayı içermez; o mesaj yalnızca yönetim panelinde gösterilir.
 */
export function StoreClosedNotice({ appearance }: { appearance?: StorefrontAppearanceSettings }) {
  const { t } = useStorefrontLocale();

  return (
    <StorefrontNoticeScreen
      title={t("notice.closedTitle")}
      body={t("notice.closedBody")}
      appearance={appearance}
    />
  );
}
