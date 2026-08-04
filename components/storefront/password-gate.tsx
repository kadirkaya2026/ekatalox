"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StorefrontThemeKey } from "@/lib/types";
import { StorefrontThemeProvider, useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { StorefrontThemeToggle } from "@/components/storefront/storefront-theme-toggle";
import { StorefrontLanguageSwitcher } from "@/components/storefront/storefront-language-switcher";

function PasswordGateForm({
  subdomain,
  companyName,
}: {
  subdomain: string;
  companyName: string;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/storefront/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain, code }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? t("gate.defaultError"));
        return;
      }

      window.location.assign("/");
    });
  }

  return (
    <div className="container-shell flex min-h-screen items-center justify-center py-8">
      <div className={theme.gateCard}>
        <p className={theme.gateEyebrow}>{t("gate.eyebrow")}</p>
        <h1 className={theme.gateTitle}>{companyName}</h1>
        <p className={theme.gateDescription}>
          {t("gate.description")}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input
            inputMode="numeric"
            placeholder={t("gate.passwordPlaceholder")}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className={theme.formField}
          />
          <Button type="submit" className={`w-full ${theme.primaryButton}`} disabled={pending}>
            {pending ? t("gate.verifying") : t("gate.submit")}
          </Button>
          {error ? <p className={`text-sm ${theme.gateError}`}>{error}</p> : null}
        </form>
      </div>
    </div>
  );
}

export function PasswordGate({
  subdomain,
  companyName,
  themeKey = "minimal",
}: {
  subdomain: string;
  companyName: string;
  themeKey?: StorefrontThemeKey | string;
}) {
  return (
    <StorefrontThemeProvider themeKey={themeKey}>
      <div data-storefront className="relative min-h-screen">
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-6 sm:top-6">
          <StorefrontLanguageSwitcher />
          <StorefrontThemeToggle />
        </div>
        <PasswordGateForm subdomain={subdomain} companyName={companyName} />
      </div>
    </StorefrontThemeProvider>
  );
}
