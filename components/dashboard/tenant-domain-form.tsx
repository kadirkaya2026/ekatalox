"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Tenant } from "@/lib/types";

export function TenantDomainForm({ tenant }: { tenant: Tenant }) {
  const [customDomain, setCustomDomain] = useState(tenant.custom_domain ?? "");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/domain", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_domain: customDomain.trim() || null }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Özel alan adı kaydedilemedi.");
        return;
      }

      if (result.tenant) {
        setCustomDomain(result.tenant.custom_domain ?? "");
      }

      setMessage("Özel alan adı kaydedildi.");
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Globe className="size-4 text-emerald-700" />
        <span>Özel alan adı</span>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Mağazanız şu anda <strong>{tenant.subdomain}.ekatalox.com</strong> adresinde
        yayında. Kendi alan adınızı (ör. katalog.firmaniz.com) buradan kaydedebilirsiniz.
        Bu adım yalnızca alan adını sistemde kaydeder — DNS yönlendirmesini tamamlamak
        için destek ekibiyle iletişime geçmeniz gerekir.
      </p>

      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-900">Alan adı</label>
          <Input
            value={customDomain}
            onChange={(event) => {
              setCustomDomain(event.target.value);
              setMessage(null);
              setError(null);
            }}
            placeholder="katalog.firmaniz.com"
          />
          {error ? <p className="mt-2 text-sm text-amber-700">{error}</p> : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6">
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Alan adını kaydet"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
