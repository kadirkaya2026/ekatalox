"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { FileSpreadsheet, ImagePlus, PencilLine, Plus, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, TableWrapper } from "@/components/ui/table";
import { parseProductsCsv } from "@/lib/csv/parse-products";
import type { Product, Tenant } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

interface ProductFormState {
  sku_code: string;
  product_name: string;
  price_tier_1: string;
  price_tier_2: string;
  price_tier_3: string;
  is_in_stock: boolean;
  image: File | null;
}

const emptyForm: ProductFormState = {
  sku_code: "",
  product_name: "",
  price_tier_1: "",
  price_tier_2: "",
  price_tier_3: "",
  is_in_stock: true,
  image: null,
};

function toFormData(form: ProductFormState) {
  const formData = new FormData();
  formData.set("sku_code", form.sku_code);
  formData.set("product_name", form.product_name);
  formData.set("price_tier_1", form.price_tier_1 || "0");
  formData.set("price_tier_2", form.price_tier_2 || "0");
  formData.set("price_tier_3", form.price_tier_3 || "0");
  formData.set("is_in_stock", String(form.is_in_stock));

  if (form.image) {
    formData.set("image", form.image);
  }

  return formData;
}

function productToForm(product: Product): ProductFormState {
  return {
    sku_code: product.sku_code,
    product_name: product.product_name,
    price_tier_1: String(product.price_tier_1),
    price_tier_2: String(product.price_tier_2),
    price_tier_3: String(product.price_tier_3),
    is_in_stock: product.is_in_stock,
    image: null,
  };
}

export function ProductsManager({
  tenant,
  initialProducts,
}: {
  tenant: Tenant;
  initialProducts: Product[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [createForm, setCreateForm] = useState<ProductFormState>(emptyForm);
  const [editForm, setEditForm] = useState<ProductFormState>(emptyForm);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [csvSummary, setCsvSummary] = useState<{
    totalRows: number;
    errors: string[];
    csvText: string;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const usage = useMemo(
    () => ({
      total: products.length,
      limit: tenant.max_product_limit,
      remaining: Math.max(tenant.max_product_limit - products.length, 0),
    }),
    [products.length, tenant.max_product_limit],
  );

  function updateCreateField<Key extends keyof ProductFormState>(
    key: Key,
    value: ProductFormState[Key],
  ) {
    setCreateForm((current) => ({ ...current, [key]: value }));
  }

  function updateEditField<Key extends keyof ProductFormState>(
    key: Key,
    value: ProductFormState[Key],
  ) {
    setEditForm((current) => ({ ...current, [key]: value }));
  }

  function handleCsvSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setCsvSummary(null);
      return;
    }

    file.text().then((csvText) => {
      const parsed = parseProductsCsv(csvText);
      setCsvSummary({
        totalRows: parsed.rows.length,
        errors: parsed.errors,
        csvText,
      });
    });
  }

  function importCsv() {
    if (!csvSummary?.csvText) {
      setMessage("Önce bir CSV seçin.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/tenant/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: csvSummary.csvText }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "CSV içeri aktarılamadı.");
        return;
      }

      if (result.products) {
        setProducts(result.products as Product[]);
      }

      setMessage(`CSV içeri alındı. ${result.count ?? 0} satır işlendi.`);
      setCsvSummary(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  }

  function createProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/products", {
        method: "POST",
        body: toFormData(createForm),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Ürün eklenemedi.");
        return;
      }

      setProducts((current) => [result.product as Product, ...current]);
      setCreateForm(emptyForm);
      setMessage("Yeni ürün eklendi.");
    });
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setEditForm(productToForm(product));
  }

  function updateProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProduct) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/tenant/products/${editingProduct.id}`, {
        method: "PATCH",
        body: toFormData(editForm),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Ürün güncellenemedi.");
        return;
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === editingProduct.id ? (result.product as Product) : item,
        ),
      );
      setEditingProduct(null);
      setMessage("Ürün güncellendi.");
    });
  }

  function toggleStock(product: Product) {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/tenant/products/toggle-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          is_in_stock: !product.is_in_stock,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Stok güncellenemedi.");
        return;
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? { ...item, is_in_stock: result.product.is_in_stock }
            : item,
        ),
      );
      setMessage("Stok durumu güncellendi.");
    });
  }

  const renderStockBadge = (product: Product) => (
    <Badge
      className={cn(
        product.is_in_stock
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500",
      )}
    >
      {product.is_in_stock ? "Stokta var" : "Stok kapalı"}
    </Badge>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Toplam ürün</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{usage.total}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Paket limiti</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{usage.limit}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Kalan kapasite</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{usage.remaining}</p>
        </Card>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <Plus className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">+ Yeni Ürün</h2>
              <p className="text-sm text-slate-600">
                Tekil ürün ekleyin, fiyat katmanlarını ve stok durumunu tanımlayın.
              </p>
            </div>
          </div>

          <form onSubmit={createProduct} className="mt-5 grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="SKU kodu"
                value={createForm.sku_code}
                onChange={(event) => updateCreateField("sku_code", event.target.value)}
              />
              <Input
                placeholder="Ürün adı"
                value={createForm.product_name}
                onChange={(event) => updateCreateField("product_name", event.target.value)}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Input
                type="number"
                step="0.01"
                placeholder="Toptancı"
                value={createForm.price_tier_1}
                onChange={(event) => updateCreateField("price_tier_1", event.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Bayi"
                value={createForm.price_tier_2}
                onChange={(event) => updateCreateField("price_tier_2", event.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Telefoncu"
                value={createForm.price_tier_3}
                onChange={(event) => updateCreateField("price_tier_3", event.target.value)}
              />
            </div>

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
              <ImagePlus className="size-4 text-emerald-700" />
              <span>
                {createForm.image ? createForm.image.name : "Ürün fotoğrafı yükle"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  updateCreateField("image", event.target.files?.[0] ?? null)
                }
              />
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={createForm.is_in_stock}
                onChange={(event) =>
                  updateCreateField("is_in_stock", event.target.checked)
                }
              />
              Stokta görünsün
            </label>

            <Button type="submit" disabled={pending || usage.remaining <= 0}>
              {pending ? "Kaydediliyor..." : "Yeni ürünü kaydet"}
            </Button>
          </form>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">CSV içe aktarma</h2>
              <p className="text-sm text-slate-600">
                Beklenen kolonlar: sku_code, product_name, image_url, fiyatlar ve is_in_stock.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              <Upload className="size-4 text-emerald-700" />
              <span>CSV dosyası seç</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleCsvSelect}
              />
            </label>

            {csvSummary ? (
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Önizleme: {csvSummary.totalRows} satır
                </p>
                {csvSummary.errors.length ? (
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {csvSummary.errors.map((error) => (
                      <li key={error}>• {error}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-emerald-700">
                    Dosya başarılı şekilde parse edildi.
                  </p>
                )}

                <Button
                  className="mt-4"
                  onClick={importCsv}
                  disabled={pending || csvSummary.errors.length > 0}
                >
                  CSV&apos;yi içeri al
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Mevcut ürünler</h2>
          <p className="mt-1 text-sm text-slate-600">
            Masaüstünde tablo, mobilde kart düzeni ile hızlı yönetim.
          </p>
        </div>

        <TableWrapper>
          <Table>
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Ürün</th>
                <th className="px-4 py-3">Stok</th>
                <th className="px-4 py-3">Katman 1</th>
                <th className="px-4 py-3">Katman 2</th>
                <th className="px-4 py-3">Katman 3</th>
                <th className="px-4 py-3 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-slate-100">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-slate-100">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.product_name}
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{product.product_name}</p>
                        <p className="text-sm text-slate-500">{product.sku_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">{renderStockBadge(product)}</td>
                  <td className="px-4 py-4 text-base font-semibold text-slate-900">
                    {formatCurrency(Number(product.price_tier_1))}
                  </td>
                  <td className="px-4 py-4 text-base font-semibold text-slate-900">
                    {formatCurrency(Number(product.price_tier_2))}
                  </td>
                  <td className="px-4 py-4 text-base font-semibold text-slate-900">
                    {formatCurrency(Number(product.price_tier_3))}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => toggleStock(product)}>
                        {product.is_in_stock ? "Stoğu kapat" : "Stoğu aç"}
                      </Button>
                      <Button variant="secondary" onClick={() => openEdit(product)}>
                        <PencilLine className="size-4" />
                        Düzenle
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>

        <div className="grid gap-4 p-4 md:hidden">
          {products.map((product) => (
            <Card key={product.id} className="p-4">
              <div className="flex gap-3">
                <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-slate-100">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.product_name}
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{product.product_name}</p>
                  <p className="mt-1 text-sm text-slate-500">{product.sku_code}</p>
                  <div className="mt-3">{renderStockBadge(product)}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                <div>
                  <p className="text-xs text-slate-500">Katman 1</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCurrency(Number(product.price_tier_1))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Katman 2</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCurrency(Number(product.price_tier_2))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Katman 3</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCurrency(Number(product.price_tier_3))}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => toggleStock(product)}
                >
                  {product.is_in_stock ? "Stoğu kapat" : "Stoğu aç"}
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => openEdit(product)}
                >
                  Düzenle
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Modal
        open={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        title={editingProduct ? `${editingProduct.product_name} • Düzenle` : "Ürün Düzenle"}
      >
        <form onSubmit={updateProduct} className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="SKU kodu"
              value={editForm.sku_code}
              onChange={(event) => updateEditField("sku_code", event.target.value)}
            />
            <Input
              placeholder="Ürün adı"
              value={editForm.product_name}
              onChange={(event) => updateEditField("product_name", event.target.value)}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Input
              type="number"
              step="0.01"
              value={editForm.price_tier_1}
              onChange={(event) => updateEditField("price_tier_1", event.target.value)}
            />
            <Input
              type="number"
              step="0.01"
              value={editForm.price_tier_2}
              onChange={(event) => updateEditField("price_tier_2", event.target.value)}
            />
            <Input
              type="number"
              step="0.01"
              value={editForm.price_tier_3}
              onChange={(event) => updateEditField("price_tier_3", event.target.value)}
            />
          </div>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            <ImagePlus className="size-4 text-emerald-700" />
            <span>{editForm.image ? editForm.image.name : "Yeni fotoğraf seç"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => updateEditField("image", event.target.files?.[0] ?? null)}
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={editForm.is_in_stock}
              onChange={(event) => updateEditField("is_in_stock", event.target.checked)}
            />
            Stokta görünsün
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditingProduct(null)}>
              İptal
            </Button>
            <Button type="submit" disabled={pending}>
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}