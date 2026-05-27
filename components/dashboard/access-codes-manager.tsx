"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AccessCode, Tenant } from "@/lib/types";

export function AccessCodesManager({
  tenant,
  initialCodes,
}: {
  tenant: Tenant;
  initialCodes: AccessCode[];
}) {
  const [codes, setCodes] = useState(initialCodes);
  const [passwordCode, setPasswordCode] = useState("");
  const [tierLevel, setTierLevel] = useState<1 | 2 | 3>(1);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/access-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          password_code: passwordCode,
          price_tier_level: tierLevel,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Şifre eklenemedi.");
        return;
      }

      setCodes((current) => [result.accessCode as AccessCode, ...current]);
      setPasswordCode("");
      setTierLevel(1);
      setMessage("Yeni erişim şifresi eklendi.");
    });
  }

  function deleteCode(id: string) {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/access-codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Şifre silinemedi.");
        return;
      }

      setCodes((current) => current.filter((code) => code.id !== id));
      setMessage("Şifre kaldırıldı.");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Yeni erişim kodu</h2>
        <p className="mt-1 text-sm text-slate-600">
          Müşteri vitrini açıldığında girilen şifreye göre yalnız tek fiyat katmanı gösterilir.
        </p>

        <form onSubmit={addCode} className="mt-5 grid gap-3">
          <Input
            placeholder="Örn. 1111"
            value={passwordCode}
            onChange={(event) => setPasswordCode(event.target.value)}
          />
          <select
            value={tierLevel}
            onChange={(event) => setTierLevel(Number(event.target.value) as 1 | 2 | 3)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
          >
            <option value={1}>Katman 1 • Toptancı</option>
            <option value={2}>Katman 2 • Bayi</option>
            <option value={3}>Katman 3 • Telefoncu</option>
          </select>
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Kodu ekle"}
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Aktif erişim kodları</h2>
            <p className="mt-1 text-sm text-slate-600">
              {tenant.company_name} • {tenant.subdomain}.ekatalox.com
            </p>
          </div>
          <Badge className="bg-slate-100 text-slate-700">{codes.length} kod</Badge>
        </div>

        {message ? (
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {codes.map((code) => (
            <div
              key={code.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-base font-semibold text-slate-900">{code.password_code}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Fiyat Katmanı {code.price_tier_level}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => deleteCode(code.id)}
                disabled={pending}
              >
                Kaldır
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}