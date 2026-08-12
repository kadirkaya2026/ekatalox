"use client";

import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { StorefrontNoticeScreen } from "@/components/storefront/storefront-notice-screen";
import type { StorefrontAppearanceSettings } from "@/lib/storefront/theme-context";

// Tenant admin tarafından askıya alındığında gösterilen nötr ekran
// (deneme süresi dolan tenant'lar için ayrı olan StoreClosedNotice'tan farklıdır).
export function StorefrontSuspendedNotice({ appearance }: { appearance?: StorefrontAppearanceSettings }) {
  const { t } = useStorefrontLocale();

  return (
    <StorefrontNoticeScreen
      title={t("notice.suspendedTitle")}
      body={t("notice.suspendedBody")}
      appearance={appearance}
    />
  );
}
