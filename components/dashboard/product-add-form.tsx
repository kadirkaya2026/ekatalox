"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { ProductDescriptionEditor } from "@/components/dashboard/product-description-editor";
import { ProductImageFields } from "@/components/dashboard/product-image-fields";
import { ProductPriceFields } from "@/components/dashboard/product-price-fields";
import { buildCategoryTree, flattenCategoryTree } from "@/lib/categories/tree";
import { buildPackageUpgradeHref, getEffectiveProductLimit } from "@/lib/billing/plans";
import { supportedCurrencyCodes } from "@/lib/products/constants";
import {
  buildEmptyProductForm,
  toProductFormData,
  useProductForm,
} from "@/lib/hooks/use-product-form";
import type { Category, PriceList, Tenant } from "@/lib/types";

export function ProductAddForm({
  tenant,
  initialCategories,
  priceLists,
}: {
  tenant: Tenant;
  initialCategories: Category[];
  priceLists: PriceList[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { form, updateField, updateListPrice, handleImageSelect, discountPreview } =
    useProductForm(() => buildEmptyProductForm(priceLists), { onImageResult: setMessage });

  const categoryTree = useMemo(() => buildCategoryTree(initialCategories), [initialCategories]);
  const flatCategories = useMemo(() => flattenCategoryTree(categoryTree), [categoryTree]);

  const productCount = 0;
  const effectiveLimit = getEffectiveProductLimit(tenant.plan ?? "baslangic", tenant.product_limit_addon);
  const isLimitFull = effectiveLimit <= productCount;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/products", {
        method: "POST",
        body: toProductFormData(form),
      });

      let result: { error?: string } = {};
      try {
        result = await response.json();
      } catch {
        setMessage(
          response.status === 413
            ? "Resim dosyası çok büyük. Daha küçük bir dosya ile tekrar deneyin."
            : "Sunucu yanıtı okunamadı. Lütfen tekrar deneyin.",
        );
        return;
      }

      if (!response.ok) {
        setMessage(result.error ?? "Ürün eklenemedi.");
        return;
      }

      router.push("/dashboard/products");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {isLimitFull ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Paketiniz doldu, yeni ürün ekleyemezsiniz.
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Limitiniz {effectiveLimit} ürüne ulaştı. Paket yükseltebilir
                  veya ürün silerek yeniden yer açabilirsiniz.
                </p>
              </div>
            </div>
            <Button asChild href={buildPackageUpgradeHref(tenant.company_name)}>
              Paketimi Yükseltmek İstiyorum
            </Button>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          {message}
        </div>
      ) : null}

      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
            <Plus className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Yeni Ürün</h2>
            <p className="text-sm text-slate-600">
              Tekil ürün ekleyin, fiyat listelerini ve stok durumunu tanımlayın.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Select
              value={form.category_id}
              onChange={(event) => updateField("category_id", event.target.value)}
            >
              <option value="">Kategori seçin</option>
              {flatCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {"— ".repeat(category.depth)}
                  {category.name}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Model No"
              value={form.sku_code}
              onChange={(event) => updateField("sku_code", event.target.value)}
            />
            <Input
              placeholder="Ürün adı"
              value={form.product_name}
              onChange={(event) => updateField("product_name", event.target.value)}
            />
          </div>

          <ProductDescriptionEditor
            value={form.description}
            onChange={(value) => updateField("description", value)}
          />

          <div className="grid gap-3 md:grid-cols-4">
            <Select
              value={form.currency}
              onChange={(event) => updateField("currency", event.target.value)}
            >
              {supportedCurrencyCodes.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
          </div>

          <ProductPriceFields
            priceLists={priceLists}
            values={form.listPrices}
            onChange={updateListPrice}
          />

          <PlanFeatureGate
            feature="product_discount"
            plan={tenant.plan}
            companyName={tenant.company_name}
          >
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_discount_active}
                  onChange={(event) => updateField("is_discount_active", event.target.checked)}
                />
                İndirim uygula
              </label>
              {form.is_discount_active ? (
                <div className="mt-3 grid gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="İndirimli satış fiyatı"
                    value={form.discount_price}
                    onChange={(event) => updateField("discount_price", event.target.value)}
                  />
                  {discountPreview !== null ? (
                    <p className="text-sm font-medium text-emerald-700">
                      Vitrinde yaklaşık %{discountPreview} indirim görünecek
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">
                      İndirimli fiyat, liste fiyatlarından düşük olmalıdır.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </PlanFeatureGate>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="Paket adedi"
              value={form.package_quantity}
              onChange={(event) => updateField("package_quantity", event.target.value)}
            />
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="Koli adedi"
              value={form.carton_quantity}
              onChange={(event) => updateField("carton_quantity", event.target.value)}
            />
          </div>

          <ProductImageFields
            images={[form.image, form.image2, form.image3]}
            onSelect={(slot, file) => handleImageSelect(slot, file)}
            onRemove={(slot) => handleImageSelect(slot, null)}
          />

          <label className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_in_stock}
              onChange={(event) => updateField("is_in_stock", event.target.checked)}
            />
            Stokta görünsün
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_recommended}
              onChange={(event) => updateField("is_recommended", event.target.checked)}
            />
            Sepet önerilerinde göster (manuel modda)
          </label>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/dashboard/products")}
            >
              Geri dön
            </Button>
            <Button type="submit" disabled={pending || isLimitFull}>
              {pending ? "Kaydediliyor..." : "Yeni ürünü kaydet"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
