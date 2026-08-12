"use client";

import {
  StorefrontThemeProvider,
  useStorefrontTheme,
  type StorefrontAppearanceSettings,
} from "@/lib/storefront/theme-context";
import { StorefrontLanguageSwitcher } from "@/components/storefront/storefront-language-switcher";

function StorefrontNoticeCard({ title, body }: { title: string; body: string }) {
  const theme = useStorefrontTheme();

  return (
    <div data-storefront className="relative container-shell flex min-h-screen items-center justify-center py-8">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <StorefrontLanguageSwitcher />
      </div>
      <div className={theme.gateCard}>
        <h1 className={theme.gateTitle}>{title}</h1>
        <p className={theme.gateDescription}>{body}</p>
      </div>
    </div>
  );
}

// Deneme dolumu / mağaza kapalı / kota / askıya alma gibi tüm son müşteri
// "erişilemiyor" ekranlarının paylaştığı ortak kabuk — tenant'ın kendi
// temasıyla (marka rengi dahil) render eder, hardcoded bg-white yerine.
export function StorefrontNoticeScreen({
  title,
  body,
  appearance,
}: {
  title: string;
  body: string;
  appearance?: StorefrontAppearanceSettings;
}) {
  return (
    <StorefrontThemeProvider
      themeKey={appearance?.theme_key ?? "minimal"}
      brandPrimaryColor={appearance?.brand_primary_color}
      brandAccentColor={appearance?.brand_accent_color}
    >
      <StorefrontNoticeCard title={title} body={body} />
    </StorefrontThemeProvider>
  );
}
