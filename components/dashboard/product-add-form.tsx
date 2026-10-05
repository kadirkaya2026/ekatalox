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
  const { form, updateField, updateListPrice, updateListDiscount, handleImageSelect, discountPreview } =
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

        <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
          <FormSection
            title="Temel bilgiler"
            description="Bayinin ürünü bulup tanıdığı bilgiler."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Kategori" hint="Ürün katalogda bu kategorinin altında listelenir.">
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
              </Field>
              <Field
                label="Model No"
                hint="Ürünün kimliği. Bayi bu kodla arar; Excel ile güncellemede ürün bu kodla eşleşir."
              >
                <Input
                  placeholder="Model No"
                  value={form.sku_code}
                  onChange={(event) => updateField("sku_code", event.target.value)}
                />
              </Field>
              <Field label="Ürün adı" className="md:col-span-2">
                <Input
                  placeholder="Ürün adı"
                  value={form.product_name}
                  onChange={(event) => updateField("product_name", event.target.value)}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection
            title="Açıklama"
            description="Katalogda ürünün Detaylar sekmesinde görünür. Kalın yazı, madde listesi ve tablo kullanabilirsiniz."
          >
            <ProductDescriptionEditor
              value={form.description}
              onChange={(value) => updateField("description", value)}
            />
          </FormSection>

          <FormSection
            title="Fotoğraflar"
            description="En fazla 3 görsel. İlk görsel katalogdaki ürün kartında görünür."
          >
            <div className="max-w-2xl">
              <ProductImageFields
                images={[form.image, form.image2, form.image3]}
                onSelect={(slot, file) => handleImageSelect(slot, file)}
                onRemove={(slot) => handleImageSelect(slot, null)}
              />
            </div>
          </FormSection>

          <FormSection
            title="Fiyatlar"
            description="Her fiyat listesi için adet fiyatını girin. Bayi kataloğa girdiğinde yalnız kendi listesinin fiyatını görür."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Para birimi">
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
              </Field>
              <Field
                label="Alış fiyatı (maliyet)"
                hint="Müşteriye gösterilmez; Satış & Kârlılık raporunda kâr hesabı için kullanılır."
                className="md:col-span-2"
              >
                <Input
                  value={form.purchase_price}
                  onChange={(event) => updateField("purchase_price", event.target.value)}
                  placeholder="Alış fiyatı (maliyet)"
                  inputMode="decimal"
                />
              </Field>
            </div>

            <div className="mt-4">
              <ProductPriceFields
                priceLists={priceLists}
                values={form.listPrices}
                onChange={updateListPrice}
                discountValues={form.listDiscounts}
                onDiscountChange={updateListDiscount}
                showDiscounts={form.is_discount_active}
              />
            </div>

            <PlanFeatureGate
              feature="product_discount"
              plan={tenant.plan}
              companyName={tenant.company_name}
            >
              <div className="mt-4">
                <OptionCheckbox
                  checked={form.is_discount_active}
                  onChange={(checked) => updateField("is_discount_active", checked)}
                  title="İndirim uygula"
                  description={
                    form.is_discount_active
                      ? "İndirimli fiyatı her fiyat listesi için yukarıdaki alanlara ayrı ayrı girin. Boş bıraktığınız listede indirim uygulanmaz."
                      : "Açarsanız her fiyat listesine indirimli fiyat girebilirsiniz; katalogda eski fiyat üstü çizili görünür."
                  }
                />
              </div>
            </PlanFeatureGate>
          </FormSection>

          {/* Paket / koli adedi market tipi hesaplarda girilmiyor (kullanıcı
              isteği, 4 Eyl 2026) — toptancı/genel tipte gösterilir. */}
          {tenant.business_type !== "market" ? (
            <FormSection
              title="Satış birimi"
              description="Girerseniz bayi sepette adet, paket ya da koli seçerek sipariş verir; adedi sistem hesaplar. Bilmiyorsanız boş bırakın."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Paket adedi" hint="Bir pakette kaç adet var?">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Paket adedi"
                    value={form.package_quantity}
                    onChange={(event) => updateField("package_quantity", event.target.value)}
                  />
                </Field>
                <Field label="Koli adedi" hint="Bir kolide kaç adet var?">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Koli adedi"
                    value={form.carton_quantity}
                    onChange={(event) => updateField("carton_quantity", event.target.value)}
                  />
                </Field>
              </div>
            </FormSection>
          ) : null}

          <FormSection title="Stok ve görünürlük">
            <div className="grid gap-3">
              <OptionCheckbox
                checked={form.track_stock ? Number(form.stock_quantity || 0) > 0 : form.is_in_stock}
                disabled={form.track_stock}
                onChange={(checked) => updateField("is_in_stock", checked)}
                title="Stokta görünsün"
                description={
                  form.track_stock
                    ? "Stok takibi açık: adet 0'ın üstündeyse otomatik olarak stokta görünür."
                    : "İşaretliyse ürün katalogda satışa açıktır. Kaldırırsanız ürün “Stokta yok” görünür ve sepete eklenemez."
                }
              />
              <OptionCheckbox
                checked={form.track_stock}
                onChange={(checked) => updateField("track_stock", checked)}
                title="Stok takibi yapılsın"
                description="Elinizdeki adedi girin. Katalogda kalan adet görünür ve bayi bundan fazlasını sepete ekleyemez. Siparişi onayladığınızda stok düşer, iptal ederseniz geri eklenir; 0 olunca ürün “Stokta yok” olur."
              >
                {form.track_stock ? (
                  <label className="mt-3 block max-w-xs text-sm font-medium text-slate-700">
                    Stok adedi
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={form.stock_quantity}
                      onChange={(event) => updateField("stock_quantity", event.target.value)}
                      placeholder="Örn. 120"
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-normal text-foreground"
                    />
                  </label>
                ) : null}
              </OptionCheckbox>
              <OptionCheckbox
                checked={form.is_recommended}
                onChange={(checked) => updateField("is_recommended", checked)}
                title="Sepet önerilerinde göster"
                description="Sepet önerileri ayarı manuel moddaysa bu ürün, bayinin sepetinde önerilen ürünler arasında gösterilir."
              />

              {/* Alkollü ürün bayrağı yalnız market tipi hesaplarda; tekel
                  (is_tekel) mağazalarda bu ürünler vitrinde gizlenir (bkz. 0114). */}
              {tenant.business_type === "market" ? (
                <OptionCheckbox
                  checked={form.is_alcohol}
                  onChange={(checked) => updateField("is_alcohol", checked)}
                  title="Alkollü ürün"
                  description="Tekel mağazalarda vitrinde gösterilmez."
                  tone="amber"
                />
              ) : null}
            </div>
          </FormSection>

          <div className="flex gap-3 border-t border-slate-100 pt-5">
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

/** Formu başlıklı bölümlere ayırır (ürün ekleme ekranı, 6 Eki 2026). */
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 p-4 sm:p-5">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`grid gap-1.5 text-sm ${className ?? ""}`}>
      <span className="font-medium text-slate-700">{label}</span>
      {children}
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

function OptionCheckbox({
  checked,
  disabled,
  onChange,
  title,
  description,
  tone = "slate",
  children,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
  tone?: "slate" | "amber";
  children?: React.ReactNode;
}) {
  return (
    <div
      className={
        tone === "amber"
          ? "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
          : "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
      }
    >
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 accent-emerald-600"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>
          <span className="block text-sm font-semibold text-slate-800">{title}</span>
          <span className="mt-0.5 block text-sm text-slate-500">{description}</span>
        </span>
      </label>
      {children}
    </div>
  );
}
