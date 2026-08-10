"use client";

import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { cn } from "@/lib/utils";

export function StorefrontSectionBreadcrumb({
  homeHref,
  sectionTitle,
}: {
  homeHref: string;
  sectionTitle: string;
}) {
  const { t } = useStorefrontLocale();
  const theme = useStorefrontTheme();

  return (
    <nav className={cn("flex items-center gap-2 text-sm", theme.textMuted)}>
      <a href={homeHref} className={cn("font-medium transition hover:opacity-75", theme.text)}>
        {t("catalog.home")}
      </a>
      <span>/</span>
      <span className={cn("font-semibold", theme.text)}>{sectionTitle}</span>
    </nav>
  );
}
