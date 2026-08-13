"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { StorefrontThemeKey } from "@/lib/types";
import { StorefrontThemeProvider, useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { StorefrontThemeToggle } from "@/components/storefront/storefront-theme-toggle";
import { StorefrontLanguageSwitcher } from "@/components/storefront/storefront-language-switcher";

function AgeVerificationForm({
  subdomain,
  companyName,
}: {
  subdomain: string;
  companyName: string;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmAdult() {
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/storefront/verify-age", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setError(result?.error ?? t("ageGate.defaultError"));
        return;
      }

      window.location.assign("/");
    });
  }

  if (blocked) {
    return (
      <div className="container-shell flex min-h-screen items-center justify-center py-8">
        <div className={theme.gateCard}>
          <p className={theme.gateEyebrow}>{t("ageGate.blockedTitle")}</p>
          <h1 className={theme.gateTitle}>{companyName}</h1>
          <p className={theme.gateDescription}>{t("ageGate.blockedDescription")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-shell flex min-h-screen items-center justify-center py-8">
      <div className={theme.gateCard}>
        <p className={theme.gateEyebrow}>{t("ageGate.eyebrow")}</p>
        <h1 className={theme.gateTitle}>{companyName}</h1>
        <p className={theme.gateDescription}>{t("ageGate.description")}</p>

        <div className="mt-6 space-y-3">
          <Button
            type="button"
            className={`w-full ${theme.primaryButton}`}
            disabled={pending}
            onClick={confirmAdult}
          >
            {pending ? t("ageGate.verifying") : t("ageGate.confirmYes")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={() => setBlocked(true)}
          >
            {t("ageGate.confirmNo")}
          </Button>
          {error ? <p className={`text-sm ${theme.gateError}`}>{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function AgeVerificationGate({
  subdomain,
  companyName,
  themeKey = "minimal",
  isThemeToggleVisible = true,
}: {
  subdomain: string;
  companyName: string;
  themeKey?: StorefrontThemeKey | string;
  isThemeToggleVisible?: boolean;
}) {
  return (
    <StorefrontThemeProvider themeKey={themeKey}>
      <div data-storefront className="relative min-h-screen">
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-6 sm:top-6">
          <StorefrontLanguageSwitcher />
          {isThemeToggleVisible ? <StorefrontThemeToggle /> : null}
        </div>
        <AgeVerificationForm subdomain={subdomain} companyName={companyName} />
      </div>
    </StorefrontThemeProvider>
  );
}
