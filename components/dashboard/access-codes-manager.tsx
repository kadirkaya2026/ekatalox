"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPriceListLimit, getPriceListLimit } from "@/lib/billing/plans";
import { getPriceListDisplayName, normalizePriceListName } from "@/lib/price-lists/constants";
import type { AccessCode, PriceList, Tenant } from "@/lib/types";

export function AccessCodesManager({
  tenant,
  initialCodes,
  priceLists,
}: {
  tenant: Tenant;
  initialCodes: AccessCode[];
  priceLists: PriceList[];
}) {
  const [codes, setCodes] = useState(initialCodes);
  const [passwordCode, setPasswordCode] = useState("");
  const [priceListId, setPriceListId] = useState(priceLists[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const codeLimit = getPriceListLimit(tenant.plan);
  const atCodeLimit = codeLimit !== null && codes.length >= codeLimit;

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
          price_list_id: priceListId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Şifre eklenemedi.");
        return;
      }

      const created = result.accessCode as AccessCode;
      const list = priceLists.find((entry) => entry.id === created.price_list_id);
      setCodes((current) => [
        {
          ...created,
          price_list_name: list ? getPriceListDisplayName(list) : created.price_list_name,
        },
        ...current,
      ]);
      setPasswordCode("");
      setMessage("Yeni erişim şifresi eklendi.");
      router.refresh();
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
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Yeni erişim kodu</h2>
        <p className="mt-1 text-sm text-slate-600">
          Müşteri vitrini için yeni şifre kodu buradan oluşturabilirsiniz. Seçilen fiyat
          listesine göre vitrin davranışı belirlenir.
        </p>

        {atCodeLimit ? (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Paketinizde en fazla {formatPriceListLimit(tenant.plan)} şifre oluşturabilirsiniz.
            Daha fazla fiyat seviyesi için paketinizi yükseltin.
          </div>
        ) : null}

        <form onSubmit={addCode} className="mt-5 grid gap-3">
          <Input
            placeholder="Örn. 1111"
            value={passwordCode}
            onChange={(event) => setPasswordCode(event.target.value)}
            disabled={atCodeLimit}
          />
          <select
            value={priceListId}
            onChange={(event) => setPriceListId(event.target.value)}
            disabled={atCodeLimit}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
          >
            {priceLists.map((list) => (
              <option key={list.id} value={list.id}>
                {getPriceListDisplayName(list)}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={pending || !priceListId || atCodeLimit}>
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
          <Badge className="bg-slate-100 text-slate-700">
            {codes.length} / {formatPriceListLimit(tenant.plan)} kod
          </Badge>
        </div>

        {message ? (
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {codes.map((code) => {
            const linkedList = priceLists.find((entry) => entry.id === code.price_list_id);
            const listLabel = linkedList
              ? getPriceListDisplayName(linkedList)
              : normalizePriceListName(code.price_list_name ?? "Fiyat listesi");

            return (
            <div
              key={code.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-base font-semibold text-slate-900">{code.password_code}</p>
                <p className="mt-1 text-sm text-slate-500">{listLabel}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => deleteCode(code.id)}
                disabled={pending}
              >
                Kaldır
              </Button>
            </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
