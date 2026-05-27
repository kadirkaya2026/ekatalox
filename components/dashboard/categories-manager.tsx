"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronRight, FolderTree, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  buildCategoryTree,
  flattenCategoryTree,
} from "@/lib/categories/tree";
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
  const [inlineParentId, setInlineParentId] = useState<string | null>(null);
  const [inlineName, setInlineName] = useState("");
  const [pending, startTransition] = useTransition();
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const flatCategories = useMemo(() => flattenCategoryTree(categoryTree), [categoryTree]);

  function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          parent_id: null,
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

  function createSubCategory(parentId: string) {
    if (!inlineName.trim()) return;
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          parent_id: parentId,
          name: inlineName.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Alt kategori eklenemedi.");
        return;
      }

      setCategories((current) => [...current, result.category as Category]);
      setInlineParentId(null);
      setInlineName("");
      setMessage("Alt kategori eklendi.");
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

  function toggleInlineForm(categoryId: string) {
    if (inlineParentId === categoryId) {
      setInlineParentId(null);
      setInlineName("");
    } else {
      setInlineParentId(categoryId);
      setInlineName("");
    }
  }

  function cancelInline() {
    setInlineParentId(null);
    setInlineName("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Ana kategori ekle</h2>
        <p className="mt-1 text-sm text-slate-600">
          Üst düzey yeni bir kategori oluşturun. Alt kategoriler için listeden "+ Alt ekle" butonunu kullanın.
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

        <div className="mt-5 space-y-2">
          {flatCategories.map((category) => (
            <div key={category.id}>
              <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-xl bg-white p-2 text-slate-500 shadow-sm">
                    <FolderTree className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      {category.depth > 0 ? (
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <ChevronRight className="size-4" />
                          <span className="text-sm">Alt kategori</span>
                        </span>
                      ) : (
                        <span className="text-sm text-emerald-700">Ana kategori</span>
                      )}
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {"— ".repeat(category.depth)}
                      {category.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{category.id}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="secondary"
                    className="h-8 gap-1.5 px-3 text-xs"
                    onClick={() => toggleInlineForm(category.id)}
                    disabled={pending}
                  >
                    <Plus className="size-3" />
                    Alt ekle
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => deleteCategory(category.id)}
                    disabled={pending}
                  >
                    Kaldır
                  </Button>
                </div>
              </div>

              {inlineParentId === category.id ? (
                <div
                  className="mt-1 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3"
                  style={{ marginLeft: `${(category.depth + 1) * 20}px` }}
                >
                  <Input
                    placeholder={`"${category.name}" altına alt kategori adı`}
                    value={inlineName}
                    onChange={(event) => setInlineName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        createSubCategory(category.id);
                      }
                      if (event.key === "Escape") {
                        cancelInline();
                      }
                    }}
                    autoFocus
                    className="h-8 text-sm"
                  />
                  <Button
                    className="h-8 shrink-0 px-3 text-xs"
                    onClick={() => createSubCategory(category.id)}
                    disabled={pending || !inlineName.trim()}
                  >
                    Kaydet
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-8 shrink-0 px-3 text-xs"
                    onClick={cancelInline}
                    disabled={pending}
                  >
                    İptal
                  </Button>
                </div>
              ) : null}
            </div>
          ))}

          {flatCategories.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Henüz kategori yok. Soldaki formdan ilk kategorinizi ekleyin.
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
