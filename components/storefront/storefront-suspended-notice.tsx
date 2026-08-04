"use client";

import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { StorefrontLanguageSwitcher } from "@/components/storefront/storefront-language-switcher";

// Tenant admin tarafından askıya alındığında gösterilen nötr ekran
// (deneme süresi dolan tenant'lar için ayrı olan StoreClosedNotice'tan farklıdır).
export function StorefrontSuspendedNotice() {
  const { t } = useStorefrontLocale();

  return (
    <div data-storefront className="relative container-shell flex min-h-screen items-center justify-center py-8">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <StorefrontLanguageSwitcher />
      </div>
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          {t("notice.suspendedTitle")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {t("notice.suspendedBody")}
        </p>
      </div>
    </div>
  );
}
