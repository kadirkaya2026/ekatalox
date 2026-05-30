"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const PASSWORD_REQUEST_MESSAGE =
  "Merhaba, Fiyat Listenizi Görüntüleyebilmek İçin Şifre Almak İstiyorum.";

export function PasswordGate({
  subdomain,
  companyName,
  whatsappNumber,
}: {
  subdomain: string;
  companyName: string;
  whatsappNumber: string;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const whatsappHref = useMemo(() => {
    const normalizedNumber = whatsappNumber.trim();

    if (normalizedNumber.length < 10) {
      return null;
    }

    return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(PASSWORD_REQUEST_MESSAGE)}`;
  }, [whatsappNumber]);

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
      <Card className="w-full max-w-md p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
          B2B Giriş
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{companyName}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Fiyatları Görüntüleyebilmek İçin Size Özel Verilen Şifrenizi Giriniz.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input
            inputMode="numeric"
            placeholder="Şifrenizi Giriniz"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Doğrulanıyor..." : "Mağaza'ya Gir"}
          </Button>
          {whatsappHref ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() =>
                window.open(whatsappHref, "_blank", "noopener,noreferrer")
              }
            >
              Şifre Al
            </Button>
          ) : null}
          {error ? <p className="text-sm text-slate-600">{error}</p> : null}
        </form>
      </Card>
    </div>
  );
}