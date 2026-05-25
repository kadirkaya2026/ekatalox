"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Category, Tenant } from "@/lib/types";

export function CategoriesManager({
  tenant,
  initialCategories,
}: {
  tenant: Tenant;
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Kategori eklenemedi.");
        return;
      }

      setCategories((current) => [result.category as Category, ...current]);
      setName("");
      setMessage("Yeni kategori eklendi.");
    });
  }

  function deleteCategory(id: string) {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Kategori silinemedi.");
        return;
      }

      setCategories((current) => current.filter((category) => category.id !== id));
      setMessage("Kategori kaldırıldı.");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Yeni kategori</h2>
        <p className="mt-1 text-sm text-slate-600">
          Ürünler eklenirken kategori seçimi zorunludur.
        </p>

        <form onSubmit={createCategory} className="mt-5 grid gap-3">
          <Input
            placeholder="Örn. Telefon, Tablet, Aksesuar"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Kategori ekle"}
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Aktif kategoriler</h2>
            <p className="mt-1 text-sm text-slate-600">
              Tenant: {tenant.company_name} • {tenant.subdomain}.ekatalox.com
            </p>
          </div>
          <Badge className="bg-slate-100 text-slate-700">
            {categories.length} kategori
          </Badge>
        </div>

        {message ? (
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {category.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">{category.id}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => deleteCategory(category.id)}
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