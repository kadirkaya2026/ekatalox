"use client";

import { useStorefrontLocale } from "@/lib/storefront/locale-context";

export function StorefrontSectionBreadcrumb({
  homeHref,
  sectionTitle,
}: {
  homeHref: string;
  sectionTitle: string;
}) {
  const { t } = useStorefrontLocale();

  return (
    <nav className="flex items-center gap-2 text-sm text-slate-500">
      <a href={homeHref} className="font-medium transition hover:text-slate-900">
        {t("catalog.home")}
      </a>
      <span>/</span>
      <span className="font-semibold text-slate-900">{sectionTitle}</span>
    </nav>
  );
}
