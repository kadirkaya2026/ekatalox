"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  formatPriceListLimit,
  getPriceListLimit,
} from "@/lib/billing/plans";
import { CATALOG_ONLY_PRICE_LIST_NAME } from "@/lib/price-lists/constants";
import type { PriceList, Tenant } from "@/lib/types";

export function PriceListsManager({
  tenant,
  initialPriceLists,
}: {
  tenant: Tenant;
  initialPriceLists: PriceList[];
}) {
  const [priceLists, setPriceLists] = useState(initialPriceLists);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const plan = tenant.plan ?? "baslangic";
  const pricedLists = priceLists.filter((list) => !list.is_catalog_only);
  const limit = getPriceListLimit(plan);
  const canCreate = limit === null || pricedLists.length < limit;

  function addList(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/price-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Liste eklenemedi.");
        return;
      }

      setPriceLists((current) => [...current, result.priceList as PriceList]);
      setName("");
      setMessage("Yeni fiyat listesi eklendi.");
    });
  }

  function updateList(list: PriceList, nextName: string) {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/price-lists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: list.id, name: nextName }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Liste güncellenemedi.");
        return;
      }

      setPriceLists((current) =>
        current.map((entry) =>
          entry.id === list.id ? (result.priceList as PriceList) : entry,
        ),
      );
      setMessage("Liste güncellendi.");
    });
  }

  function deleteList(list: PriceList) {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/price-lists", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: list.id }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Liste silinemedi.");
        return;
      }

      setPriceLists((current) => current.filter((entry) => entry.id !== list.id));
      setMessage("Liste silindi.");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Yeni fiyat listesi</h2>
        <p className="mt-1 text-sm text-slate-600">
          Paketinizde en fazla {formatPriceListLimit(plan)} adlandırılabilir liste
          oluşturabilirsiniz. {CATALOG_ONLY_PRICE_LIST_NAME} limit dışındadır.
        </p>

        <form onSubmit={addList} className="mt-5 space-y-4">
          <Input
            placeholder="Örn. Bayi İstanbul"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={!canCreate || pending}
          />
          <Button type="submit" disabled={!canCreate || pending || !name.trim()}>
            {pending ? "Kaydediliyor..." : "Liste ekle"}
          </Button>
          {!canCreate ? (
            <p className="text-sm text-amber-700">
              Fiyat listesi limitinize ulaştınız. Yeni liste eklemek için paketinizi
              yükseltin.
            </p>
          ) : null}
        </form>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Mevcut listeler</h2>
          <Badge variant="secondary">
            {pricedLists.length}
            {limit === null ? "+" : ` / ${limit}`}
          </Badge>
        </div>

        <div className="mt-4 space-y-3">
          {priceLists.map((list) => (
            <PriceListRow
              key={list.id}
              list={list}
              pending={pending}
              onSave={(nextName) => updateList(list, nextName)}
              onDelete={() => deleteList(list)}
            />
          ))}
        </div>

        {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
      </Card>
    </div>
  );
}

function PriceListRow({
  list,
  pending,
  onSave,
  onDelete,
}: {
  list: PriceList;
  pending: boolean;
  onSave: (name: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(list.name);

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {list.is_catalog_only ? (
          <Badge>{CATALOG_ONLY_PRICE_LIST_NAME}</Badge>
        ) : (
          <Badge variant="outline">Fiyat listesi</Badge>
        )}
        <span className="text-xs text-slate-500">Sıra: {list.sort_order}</span>
      </div>

      {list.is_catalog_only ? (
        <p className="mt-3 text-sm font-medium text-slate-900">{list.name}</p>
      ) : (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending || !name.trim() || name.trim() === list.name}
              onClick={() => onSave(name.trim())}
            >
              Kaydet
            </Button>
            <Button type="button" variant="ghost" disabled={pending} onClick={onDelete}>
              Sil
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
