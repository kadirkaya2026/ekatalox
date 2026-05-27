"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronRight, FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
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
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // Alt kategori ekleme
  const [inlineParentId, setInlineParentId] = useState<string | null>(null);
  const [inlineName, setInlineName] = useState("");

  // İsim düzenleme
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Silme onayı
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [pending, startTransition] = useTransition();
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const flatCategories = useMemo(() => flattenCategoryTree(categoryTree), [categoryTree]);

  function showMessage(text: string, type: "success" | "error" = "success") {
    setMessage(text);
    setMessageType(type);
  }

  function closeAllInline() {
    setInlineParentId(null);
    setInlineName("");
    setEditingId(null);
    setEditingName("");
    setDeleteConfirmId(null);
  }

  // Ana kategori ekleme
  function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    showMessage("");

    startTransition(async () => {
      const response = await fetch("/api/tenant/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenant.id, parent_id: null, name }),
      });
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.error ?? "Kategori eklenemedi.", "error");
        return;
      }

      setCategories((current) => [result.category as Category, ...current]);
      setName("");
      showMessage("Yeni kategori eklendi.");
    });
  }

  // Alt kategori ekleme
  function createSubCategory(parentId: string) {
    if (!inlineName.trim()) return;
    showMessage("");

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
        showMessage(result.error ?? "Alt kategori eklenemedi.", "error");
        return;
      }

      setCategories((current) => [...current, result.category as Category]);
      setInlineParentId(null);
      setInlineName("");
      showMessage("Alt kategori eklendi.");
    });
  }

  // İsim düzenleme kaydet
  function saveRename(id: string) {
    if (!editingName.trim()) return;
    showMessage("");

    startTransition(async () => {
      const response = await fetch("/api/tenant/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editingName.trim() }),
      });
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.error ?? "İsim güncellenemedi.", "error");
        return;
      }

      setCategories((current) =>
        current.map((category) =>
          category.id === id ? { ...category, name: editingName.trim() } : category,
        ),
      );
      setEditingId(null);
      setEditingName("");
      showMessage("Kategori adı güncellendi.");
    });
  }

  // Silme (onay sonrası)
  function deleteCategory(id: string) {
    showMessage("");

    startTransition(async () => {
      const response = await fetch("/api/tenant/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.error ?? "Kategori silinemedi.", "error");
        setDeleteConfirmId(null);
        return;
      }

      setCategories((current) => current.filter((category) => category.id !== id));
      setDeleteConfirmId(null);
      showMessage("Kategori silindi.");
    });
  }

  function toggleSubForm(categoryId: string) {
    if (inlineParentId === categoryId) {
      setInlineParentId(null);
      setInlineName("");
    } else {
      closeAllInline();
      setInlineParentId(categoryId);
    }
  }

  function startEdit(category: Category) {
    closeAllInline();
    setEditingId(category.id);
    setEditingName(category.name);
  }

  function startDelete(categoryId: string) {
    closeAllInline();
    setDeleteConfirmId(categoryId);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Ana kategori ekle</h2>
        <p className="mt-1 text-sm text-slate-600">
          Üst düzey yeni bir kategori oluşturun. Alt kategoriler için listeden
          "+ Alt ekle" butonunu kullanın.
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
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              messageType === "error"
                ? "border-red-100 bg-red-50 text-red-800"
                : "border-emerald-100 bg-emerald-50 text-emerald-800"
            }`}
          >
            {message}
          </div>
        ) : null}

        <div className="mt-5 space-y-2">
          {flatCategories.map((category) => (
            <div key={category.id}>
              {/* Kategori satırı */}
              <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-xl bg-white p-2 text-slate-500 shadow-sm">
                    <FolderTree className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2">
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
                    <p className="mt-0.5 text-xs text-slate-400">{category.id}</p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="h-8 gap-1.5 px-3 text-xs"
                    onClick={() => toggleSubForm(category.id)}
                    disabled={pending}
                  >
                    <Plus className="size-3" />
                    Alt ekle
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-8 gap-1.5 px-3 text-xs"
                    onClick={() => startEdit(category)}
                    disabled={pending}
                  >
                    <Pencil className="size-3" />
                    Düzenle
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-8 gap-1.5 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => startDelete(category.id)}
                    disabled={pending}
                  >
                    <Trash2 className="size-3" />
                    Sil
                  </Button>
                </div>
              </div>

              {/* İnline isim düzenleme */}
              {editingId === category.id ? (
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <Input
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        saveRename(category.id);
                      }
                      if (event.key === "Escape") {
                        setEditingId(null);
                        setEditingName("");
                      }
                    }}
                    autoFocus
                    className="h-8 text-sm"
                  />
                  <Button
                    className="h-8 shrink-0 px-3 text-xs"
                    onClick={() => saveRename(category.id)}
                    disabled={pending || !editingName.trim()}
                  >
                    Kaydet
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-8 shrink-0 px-3 text-xs"
                    onClick={() => { setEditingId(null); setEditingName(""); }}
                    disabled={pending}
                  >
                    İptal
                  </Button>
                </div>
              ) : null}

              {/* Silme onayı */}
              {deleteConfirmId === category.id ? (
                <div className="mt-1 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3">
                  <p className="flex-1 text-sm text-red-800">
                    <strong>"{category.name}"</strong> silinecek. Emin misiniz?
                  </p>
                  <Button
                    className="h-8 shrink-0 bg-red-600 px-3 text-xs hover:bg-red-700"
                    onClick={() => deleteCategory(category.id)}
                    disabled={pending}
                  >
                    Evet, sil
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-8 shrink-0 px-3 text-xs"
                    onClick={() => setDeleteConfirmId(null)}
                    disabled={pending}
                  >
                    İptal
                  </Button>
                </div>
              ) : null}

              {/* Alt kategori ekleme formu */}
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
                        setInlineParentId(null);
                        setInlineName("");
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
                    onClick={() => { setInlineParentId(null); setInlineName(""); }}
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
