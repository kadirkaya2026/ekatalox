"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Store } from "lucide-react";
import { STOREFRONT_LOGO_SIZES } from "@/lib/storefront/image-sizes";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { cn } from "@/lib/utils";
import { StorefrontImage } from "@/components/storefront/storefront-image";
import { StorefrontLanguageSwitcher } from "@/components/storefront/storefront-language-switcher";
import { StorefrontThemeToggle } from "@/components/storefront/storefront-theme-toggle";

// Vitrin dışı sayfalar (sipariş takip, siparişlerim) için ortak kabuk: vitrinin
// kendi başlığı (logo + mağaza adı + dil/tema), aynı zemin ve tipografi.
// Böylece bu sayfalar "boşlukta duran kart" değil, mağazanın bir sayfası gibi görünür.
export function StorefrontSubpageShell({
  logoUrl,
  title,
  children,
  maxWidthClassName = "max-w-5xl",
}: {
  logoUrl: string | null;
  title: string;
  children: ReactNode;
  maxWidthClassName?: string;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();

  return (
    <div data-storefront className={cn(theme.page, "flex min-h-screen flex-col")}>
      <header className={cn(theme.header, theme.headerBorder)}>
        <div className="container-shell flex items-center justify-between gap-3 py-3">
          <a href="/" className="flex min-w-0 items-center gap-3">
            <div className={cn(theme.logoWrap, "h-12 w-12 sm:h-14 sm:w-14")}>
              {logoUrl ? (
                <StorefrontImage src={logoUrl} alt={`${title} logo`} className="object-contain" sizes={STOREFRONT_LOGO_SIZES} />
              ) : (
                <Store className={cn("size-5", theme.logoPlaceholder)} />
              )}
            </div>
            <span className={cn(theme.headerTitle, "truncate text-base sm:text-lg")}>{title}</span>
          </a>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className={cn(theme.headerIconButton, "hidden h-11 shrink-0 items-center gap-2 whitespace-nowrap px-4 text-xs font-bold sm:inline-flex lg:h-12 lg:!w-auto")}
            >
              <ArrowLeft className="size-4" />
              {t("orders.backToStore")}
            </a>
            <StorefrontLanguageSwitcher />
            <StorefrontThemeToggle />
          </div>
        </div>
      </header>
      <main className={cn("container-shell w-full flex-1 py-8 sm:py-12", maxWidthClassName)}>{children}</main>
    </div>
  );
}
