"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StorefrontThemeKey } from "@/lib/types";
import { StorefrontThemeProvider, useStorefrontTheme } from "@/lib/storefront/theme-context";

function PasswordGateForm({
  subdomain,
  companyName,
}: {
  subdomain: string;
  companyName: string;
}) {
  const theme = useStorefrontTheme();
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
        setError(result.error ?? "Şifre doğrulanamadı.");
        return;
      }

      window.location.assign("/");
    });
  }

  return (
    <div className="container-shell flex min-h-screen items-center justify-center py-8">
      <div className={theme.gateCard}>
        <p className={theme.gateEyebrow}>B2B Giriş</p>
        <h1 className={theme.gateTitle}>{companyName}</h1>
        <p className={theme.gateDescription}>
          Fiyatları Görüntüleyebilmek İçin Size Özel Verilen Şifrenizi Giriniz.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input
            inputMode="numeric"
            placeholder="Şifrenizi Giriniz"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <Button type="submit" className={`w-full ${theme.primaryButton}`} disabled={pending}>
            {pending ? "Doğrulanıyor..." : "Mağaza'ya Gir"}
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
      <PasswordGateForm subdomain={subdomain} companyName={companyName} />
    </StorefrontThemeProvider>
  );
}
