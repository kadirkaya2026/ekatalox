"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Plus, Trash2, X, Store, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { Category, Product, StorefrontSection } from "@/lib/types";

const MAX_SECTIONS = 3;

interface SectionWithProducts extends StorefrontSection {
  products: Product[];
}

interface ShowcaseManagerProps {
  tenantId: string;
  initialSections: StorefrontSection[];
  allProducts: Product[];
  allCategories: Category[];
}

export function ShowcaseManager({
  initialSections,
  allProducts,
  allCategories,
}: ShowcaseManagerProps) {
  const [sections, setSections] = useState<SectionWithProducts[]>(
    initialSections.map((s) => ({ ...s, products: [] })),
  );
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SectionWithProducts | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [addProductSection, setAddProductSection] = useState<SectionWithProducts | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [addLoading, setAddLoading] = useState<string | null>(null);

  const categoryNameMap = useMemo(
    () => new Map(allCategories.map((c) => [c.id, c.name])),
    [allCategories],
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLocaleLowerCase("tr-TR");
    const alreadyInSection = new Set(
      (addProductSection?.products ?? []).map((p) => p.id),
    );
    return allProducts.filter((p) => {
      if (alreadyInSection.has(p.id)) return false;
      if (!q) return true;
      return (
        p.product_name.toLocaleLowerCase("tr-TR").includes(q) ||
        (p.sku_code ?? "").toLocaleLowerCase("tr-TR").includes(q)
      );
    });
  }, [allProducts, addProductSection, productSearch]);

  // Load section products on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tenant/showcase");
        if (!res.ok) return;
        const json = await res.json();
        setSections(json.sections ?? []);
      } finally {
        setLoadingInitial(false);
      }
    }
    load();
  }, []);

  async function handleCreateSection() {
    if (!newTitle.trim()) {
      setCreateError("Bölüm başlığı gereklidir.");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/tenant/showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCreateError(json.error ?? "Bölüm oluşturulamadı.");
        return;
      }
      setSections((prev) => [...prev, json.section]);
      setNewTitle("");
      setIsCreateOpen(false);
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDeleteSection() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/tenant/showcase", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!res.ok) return;
      setSections((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleAddProduct(product: Product) {
    if (!addProductSection) return;
    setAddLoading(product.id);
    try {
      const res = await fetch("/api/tenant/showcase/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section_id: addProductSection.id, product_id: product.id }),
      });
      if (!res.ok) return;
      setSections((prev) =>
        prev.map((s) =>
          s.id === addProductSection.id
            ? { ...s, products: [...s.products, product] }
            : s,
        ),
      );
      setAddProductSection((prev) =>
        prev ? { ...prev, products: [...prev.products, product] } : prev,
      );
    } finally {
      setAddLoading(null);
    }
  }

  async function handleRemoveProduct(section: SectionWithProducts, product: Product) {
    const res = await fetch("/api/tenant/showcase/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_id: section.id, product_id: product.id }),
    });
    if (!res.ok) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id === section.id
          ? { ...s, products: s.products.filter((p) => p.id !== product.id) }
          : s,
      ),
    );
  }

  const atMax = sections.length >= MAX_SECTIONS;

  if (loadingInitial) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm text-slate-500">Yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          {sections.length} / {MAX_SECTIONS} bölüm kullanılıyor
        </p>
        <Button
          onClick={() => {
            setNewTitle("");
            setCreateError(null);
            setIsCreateOpen(true);
          }}
          disabled={atMax}
          title={atMax ? "Maksimum 3 bölüm eklenebilir" : undefined}
          className="h-10 rounded-full px-5 text-sm font-semibold"
        >
          <Plus className="mr-2 size-4" />
          Yeni Bölüm Ekle
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
          <p className="text-base font-semibold text-slate-900">Henüz bölüm yok</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            «Yeni Bölüm Ekle» butonuyla anasayfada öne çıkarmak istediğiniz bir bölüm
            oluşturun (örn. En Çok Satanlar, Yeni Ürünler).
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.id}
              className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-900">
                    {section.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {section.products.length} ürün
                    {section.products.length > 8 && (
                      <span className="ml-2 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        8&apos;den fazla — anasayfada «Devamı» butonu görünecek
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    className="h-9 rounded-full px-4 text-sm"
                    onClick={() => {
                      setProductSearch("");
                      setAddProductSection(section);
                    }}
                  >
                    <Plus className="mr-1.5 size-3.5" />
                    Ürün Ekle
                  </Button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(section)}
                    className="flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Bölümü sil"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {section.products.length > 0 ? (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {section.products.map((product) => (
                    <div
                      key={product.id}
                      className="group relative rounded-[1.25rem] border border-slate-200/80 bg-slate-50/80 p-3"
                    >
                      <div className="relative mb-2 aspect-square overflow-hidden rounded-[0.875rem] bg-white">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.product_name}
                            fill
                            className="object-contain p-2"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Store className="size-6 text-slate-300" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(section, product)}
                          className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-white/90 text-slate-500 opacity-0 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                          aria-label="Bölümden çıkar"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                      <p className="line-clamp-2 text-xs font-semibold leading-tight text-slate-800">
                        {product.product_name}
                      </p>
                      {product.sku_code ? (
                        <p className="mt-0.5 truncate text-[10px] text-slate-400">
                          {product.sku_code}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex min-h-[100px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center">
                  <p className="text-sm text-slate-400">
                    Bölüme henüz ürün eklenmedi. «Ürün Ekle» butonunu kullanın.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create section modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Yeni Vitrin Bölümü"
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">Bölüm Başlığı</label>
            <Input
              placeholder="ör. En Çok Satanlar, Yeni Ürünler, Öne Çıkanlar"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (createError) setCreateError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSection();
              }}
              autoFocus
            />
            {createError ? (
              <p className="text-sm text-rose-600">{createError}</p>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Vazgeç
            </Button>
            <Button onClick={handleCreateSection} disabled={createLoading}>
              {createLoading ? "Oluşturuluyor…" : "Oluştur"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete section confirmation modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Bölümü Sil"
      >
        <div className="grid gap-4">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              «{deleteTarget?.title}»
            </span>{" "}
            bölümü ve içindeki tüm ürün atamaları kalıcı olarak silinecek. Bu işlem geri
            alınamaz.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Vazgeç
            </Button>
            <Button
              onClick={handleDeleteSection}
              disabled={deleteLoading}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {deleteLoading ? "Siliniyor…" : "Evet, Sil"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add product to section modal */}
      <Modal
        open={Boolean(addProductSection)}
        onClose={() => setAddProductSection(null)}
        title={`Ürün Ekle — ${addProductSection?.title ?? ""}`}
      >
        <div className="grid gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Ürün adı veya SKU ile ara…"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                {productSearch ? "Eşleşen ürün bulunamadı." : "Tüm ürünler zaten bu bölümde."}
              </p>
            ) : (
              <div className="space-y-1.5">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition hover:border-slate-200 hover:bg-slate-50"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.product_name}
                          fill
                          className="object-contain p-1.5"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Store className="size-5 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {product.product_name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {product.sku_code ? `SKU: ${product.sku_code}` : "SKU yok"}
                        {" · "}
                        {categoryNameMap.get(product.category_id) ?? "Genel"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      disabled={addLoading === product.id}
                      className="shrink-0 rounded-full bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
                    >
                      {addLoading === product.id ? "…" : "Ekle"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setAddProductSection(null)}>
              Kapat
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
