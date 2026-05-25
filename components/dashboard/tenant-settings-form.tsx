"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Tenant } from "@/lib/types";

export function TenantSettingsForm({ tenant }: { tenant: Tenant }) {
  const [whatsapp, setWhatsapp] = useState(tenant.whatsapp_number);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp_number: whatsapp }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Ayar kaydedilemedi.");
        return;
      }

      setMessage("WhatsApp yönlendirme numarası güncellendi.");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Tenant bilgileri</h2>
        <dl className="mt-5 space-y-4 text-sm text-slate-600">
          <div>
            <dt className="text-slate-500">Firma</dt>
            <dd className="mt-1 font-medium text-slate-900">{tenant.company_name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Alt alan adı</dt>
            <dd className="mt-1 font-medium text-slate-900">{tenant.subdomain}.ekatalox.com</dd>
          </div>
          <div>
            <dt className="text-slate-500">Paket limiti</dt>
            <dd className="mt-1 font-medium text-slate-900">{tenant.max_product_limit} ürün</dd>
          </div>
          <div>
            <dt className="text-slate-500">Durum</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {tenant.status === "active" ? "Aktif" : "Askıda"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Sipariş yönlendirme</h2>
        <p className="mt-1 text-sm text-slate-600">
          Storefront sepetindeki WhatsApp siparişleri bu numaraya yönlendirilir.
        </p>
        <form onSubmit={save} className="mt-5 space-y-4">
          <Input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          {message ? (
            <p className="text-sm text-emerald-700">{message}</p>
          ) : null}
        </form>
      </Card>
    </div>
  );
}