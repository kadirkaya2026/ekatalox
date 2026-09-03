"use client";

import { useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { ProductDescriptionEditor } from "@/components/dashboard/product-description-editor";
import { ProductImageFields } from "@/components/dashboard/product-image-fields";
import { ProductPriceFields } from "@/components/dashboard/product-price-fields";
import type { CategoryNode } from "@/lib/categories/tree";
import {
  buildProductFormFromProduct,
  toProductFormData,
  useProductForm,
} from "@/lib/hooks/use-product-form";
import { supportedCurrencyCodes } from "@/lib/products/constants";
import type { PriceList, Product, Tenant } from "@/lib/types";

export function ProductEditModal({
  product,
  flatCategories,
  priceLists,
  tenant,
  onClose,
  onSaved,
  onError,
}: {
  product: Product;
  flatCategories: CategoryNode[];
  priceLists: PriceList[];
  tenant: Tenant;
  onClose: () => void;
  onSaved: (updated: Product) => void;
  onError: (message: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const { form, updateField, updateListPrice, updateListDiscount, handleImageSelect, handleImageRemove, discountPreview } =
    useProductForm(() => buildProductFormFromProduct(product, priceLists), {
      onImageResult: (message) => {
        if (message) {
          onError(message);
        }
      },
    });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch(`/api/tenant/products/${product.id}`, {
        method: "PATCH",
        body: toProductFormData(form),
      });

      let result: { error?: string; product?: Product } = {};
      try {
        result = await response.json();
      } catch {
        onError(
          response.status === 413
            ? "Resim dosyası çok büyük. Daha küçük bir dosya ile tekrar deneyin."
            : "Sunucu yanıtı okunamadı. Lütfen tekrar deneyin.",
        );
        return;
      }

      if (!response.ok) {
        onError(result.error ?? "Ürün güncellenemedi.");
        return;
      }

      onSaved(result.product as Product);
    });
  }

  return (
    <Modal open onClose={onClose} title={`${product.product_name} • Düzenle`}>
      <form onSubmit={handleSubmit} className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={form.category_id}
            onChange={(event) => updateField("category_id", event.target.value)}
            className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground"
          >
            <option value="">Kategori seçin</option>
            {flatCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {"— ".repeat(category.depth)}
                {category.name}
              </option>
            ))}
          </select>
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
          <select
            value={form.currency}
            onChange={(event) => updateField("currency", event.target.value)}
            className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground"
          >
            {supportedCurrencyCodes.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
          <div className="md:col-span-2">
            <Input
              value={form.purchase_price}
              onChange={(event) => updateField("purchase_price", event.target.value)}
              placeholder="Alış fiyatı (maliyet)"
              inputMode="decimal"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Müşteriye gösterilmez; kâr hesabı için.
            </p>
          </div>
        </div>

          <ProductPriceFields
            priceLists={priceLists}
            values={form.listPrices}
            onChange={updateListPrice}
            discountValues={form.listDiscounts}
            onDiscountChange={updateListDiscount}
            showDiscounts={form.is_discount_active}
          />

        <PlanFeatureGate feature="product_discount" plan={tenant.plan} companyName={tenant.company_name}>
          <div className="rounded-xl border border-border bg-muted/60 px-4 py-3">
            <label className="flex items-center gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={form.is_discount_active}
                onChange={(event) => updateField("is_discount_active", event.target.checked)}
              />
              İndirim uygula
            </label>
            {form.is_discount_active ? (
              <p className="mt-2 text-sm text-muted-foreground">
                İndirimli fiyatı her fiyat listesi için yukarıdaki alanlara ayrı ayrı
                girin. Boş bıraktığınız listede indirim uygulanmaz.
              </p>
            ) : null}
          </div>
        </PlanFeatureGate>

        {/* Paket / koli adedi market tipi hesaplarda girilmiyor (kullanıcı
            isteği, 4 Eyl 2026) — toptancı/genel tipte gösterilir. */}
        {tenant.business_type !== "market" ? (
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
        ) : null}

        <ProductImageFields
          images={[form.image, form.image2, form.image3]}
          existingUrls={[product.image_url, product.image_url_2, product.image_url_3]}
          removedSlots={[form.removeImage, form.removeImage2, form.removeImage3]}
          onSelect={(slot, file) => handleImageSelect(slot, file)}
          onRemove={(slot) => handleImageRemove(slot)}
        />

        <label className="flex items-center gap-3 rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={form.is_in_stock}
            onChange={(event) => updateField("is_in_stock", event.target.checked)}
          />
          Stokta görünsün
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={form.is_recommended}
            onChange={(event) => updateField("is_recommended", event.target.checked)}
          />
          Sepet önerilerinde göster (manuel modda)
        </label>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" disabled={pending}>
            Kaydet
          </Button>
        </div>
      </form>
    </Modal>
  );
}
