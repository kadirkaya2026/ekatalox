"use client";

import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { StorefrontNoticeScreen } from "@/components/storefront/storefront-notice-screen";
import type { StorefrontAppearanceSettings } from "@/lib/storefront/theme-context";

/**
 * Aylık ziyaretçi kotası dolan tenant'ın vitrininde son müşteriye gösterilen
 * nötr ekran. Ziyaretçi tenant'ın müşterisi olduğu için paket/kota detayı
 * içermez; o mesaj yalnızca yönetim panelinde gösterilir.
 */
export function VisitorQuotaNotice({ appearance }: { appearance?: StorefrontAppearanceSettings }) {
  const { t } = useStorefrontLocale();

  return (
    <StorefrontNoticeScreen
      title={t("notice.quotaTitle")}
      body={t("notice.quotaBody")}
      appearance={appearance}
    />
  );
}
