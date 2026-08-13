"use client";

import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { STOREFRONT_HERO_SIZES } from "@/lib/storefront/image-sizes";
import type { TenantStorefrontSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StorefrontImage } from "@/components/storefront/storefront-image";

type HeroSettings = Pick<
  TenantStorefrontSettings,
  "hero_heading" | "hero_cta_label" | "hero_image_url" | "hero_style_key" | "storefront_description"
>;

function HeroCta({ label, tone = "themed" }: { label: string; tone?: "themed" | "onImage" }) {
  const theme = useStorefrontTheme();

  return (
    <a
      href="#catalog-grid"
      className={cn(
        "inline-flex rounded-full px-6 py-3 text-sm font-semibold shadow-sm transition hover:opacity-90",
        tone === "onImage" ? "bg-white text-slate-900" : theme.primaryButton,
      )}
    >
      {label}
    </a>
  );
}

function TextHero({ settings }: { settings: HeroSettings }) {
  const theme = useStorefrontTheme();
  const heading = settings.hero_heading?.trim();
  const description = settings.storefront_description?.trim();
  const ctaLabel = settings.hero_cta_label?.trim();

  return (
    <div
      className={cn(
        "rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10",
        theme.border,
        theme.surface,
        theme.elevation1,
      )}
    >
      {heading ? (
        <h2 className={cn("text-2xl font-bold tracking-tight sm:text-4xl", theme.text)}>
          {heading}
        </h2>
      ) : null}
      {description ? (
        <p className={cn("mt-3 max-w-3xl text-sm leading-7 sm:text-base", theme.textMuted)}>
          {description}
        </p>
      ) : null}
      {ctaLabel ? (
        <div className="mt-6">
          <HeroCta label={ctaLabel} />
        </div>
      ) : null}
    </div>
  );
}

function ImageSplitHero({ settings }: { settings: HeroSettings }) {
  const theme = useStorefrontTheme();
  const heading = settings.hero_heading?.trim();
  const description = settings.storefront_description?.trim();
  const ctaLabel = settings.hero_cta_label?.trim();
  const imageUrl = settings.hero_image_url?.trim();

  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-[2rem] sm:grid-cols-2 sm:items-stretch",
        theme.border,
        theme.surface,
        theme.elevation1,
      )}
    >
      <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10">
        {heading ? (
          <h2 className={cn("text-2xl font-bold tracking-tight sm:text-4xl", theme.text)}>
            {heading}
          </h2>
        ) : null}
        {description ? (
          <p className={cn("mt-3 max-w-md text-sm leading-7 sm:text-base", theme.textMuted)}>
            {description}
          </p>
        ) : null}
        {ctaLabel ? (
          <div className="mt-6">
            <HeroCta label={ctaLabel} />
          </div>
        ) : null}
      </div>
      {imageUrl ? (
        <div className="relative min-h-[220px] sm:min-h-full">
          <StorefrontImage
            src={imageUrl}
            alt={heading ?? ""}
            className="object-cover"
            sizes={STOREFRONT_HERO_SIZES}
            priority
          />
        </div>
      ) : null}
    </div>
  );
}

function FullBleedHero({ settings }: { settings: HeroSettings }) {
  const heading = settings.hero_heading?.trim();
  const description = settings.storefront_description?.trim();
  const ctaLabel = settings.hero_cta_label?.trim();
  const imageUrl = settings.hero_image_url?.trim();

  return (
    <div className="relative min-h-[280px] overflow-hidden rounded-[2rem] sm:min-h-[380px]">
      {imageUrl ? (
        <StorefrontImage
          src={imageUrl}
          alt={heading ?? ""}
          className="object-cover"
          sizes={STOREFRONT_HERO_SIZES}
          priority
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
      <div className="relative flex h-full min-h-[280px] flex-col justify-end px-6 py-8 sm:min-h-[380px] sm:px-10 sm:py-10">
        {heading ? (
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">{heading}</h2>
        ) : null}
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
            {description}
          </p>
        ) : null}
        {ctaLabel ? (
          <div className="mt-6">
            <HeroCta label={ctaLabel} tone="onImage" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function StorefrontHeroBlock({ settings }: { settings: HeroSettings }) {
  const heading = settings.hero_heading?.trim();
  const description = settings.storefront_description?.trim();
  const heroStyle = settings.hero_style_key ?? "text";
  const hasImage = Boolean(settings.hero_image_url?.trim());

  if (!heading && !description) {
    return null;
  }

  const effectiveStyle = heroStyle !== "text" && !hasImage ? "text" : heroStyle;

  return (
    <section className="mb-5 sm:mb-8">
      {effectiveStyle === "full-bleed" ? (
        <FullBleedHero settings={settings} />
      ) : effectiveStyle === "image-split" ? (
        <ImageSplitHero settings={settings} />
      ) : (
        <TextHero settings={settings} />
      )}
    </section>
  );
}
