"use client";

import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import type { TenantStorefrontSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StorefrontHeroBlock({
  settings,
}: {
  settings: Pick<
    TenantStorefrontSettings,
    "hero_heading" | "hero_cta_label" | "storefront_description" | "is_hero_visible"
  >;
}) {
  const theme = useStorefrontTheme();

  if (!settings.is_hero_visible) {
    return null;
  }

  const heading = settings.hero_heading?.trim();
  const description = settings.storefront_description?.trim();
  const ctaLabel = settings.hero_cta_label?.trim();

  if (!heading && !description) {
    return null;
  }

  return (
    <section className="mb-5 sm:mb-8">
      <div
        className={cn(
          "rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10",
          theme.border,
          theme.surface,
          theme.elevation1,
        )}
      >
        {heading ? (
          <h1 className={cn("text-2xl font-bold tracking-tight sm:text-4xl", theme.text)}>
            {heading}
          </h1>
        ) : null}
        {description ? (
          <p className={cn("mt-3 max-w-3xl text-sm leading-7 sm:text-base", theme.textMuted)}>
            {description}
          </p>
        ) : null}
        {ctaLabel ? (
          <div className="mt-6">
            <a
              href="#catalog-grid"
              className={cn(
                "inline-flex rounded-full px-6 py-3 text-sm font-semibold shadow-sm transition hover:opacity-90",
                theme.primaryButton,
              )}
            >
              {ctaLabel}
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
