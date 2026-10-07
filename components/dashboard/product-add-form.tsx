"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Circle, Plus } from "lucide-react";
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

// Ürün ekleme ekranı (6 Eki 2026 yeniden tasarım): solda ürün içeriği
// (bilgiler, açıklama, fotoğraflar, fiyatlar), sağda kaydırırken sabit kalan
// yayın paneli (stok, satış birimi, eksik alan listesi ve kaydet). Kategori
// yoksa ya da yeni gerekiyorsa buradan oluşturulur.
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
  const { form, updateField, updateListPrice, updateListDiscount, handleImageSelect } =
    useProductForm(() => buildEmptyProductForm(priceLists), { onImageResult: setMessage });

  const [categories, setCategories] = useState(initialCategories);
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const flatCategories = useMemo(() => flattenCategoryTree(categoryTree), [categoryTree]);

  const productCount = 0;
  const effectiveLimit = getEffectiveProductLimit(tenant.plan ?? "baslangic", tenant.product_limit_addon);
  const isLimitFull = effectiveLimit <= productCount;

  const checklist = [
    { label: "Ürün adı", done: form.product_name.trim().length >= 2 },
    { label: "Kategori", done: Boolean(form.category_id) },
    { label: "Model No", done: form.sku_code.trim().length > 0 },
    {
      label: "En az bir fiyat",
      done: Object.values(form.listPrices).some((value) => Number(String(value).replace(",", ".")) > 0),
    },
  ];
  const missingCount = checklist.filter((item) => !item.done).length;

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

      <form
        onSubmit={handleSubmit}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div className="grid min-w-0 gap-6">
          <FormCard title="Ürün bilgileri" description="Bayinin ürünü bulup tanıdığı bilgiler.">
            <div className="grid gap-5">
              <Field label="Ürün adı" required>
                <Input
                  placeholder="Örn. Toocki 100W Type-C Örgülü Şarj Kablosu 1 m"
                  aria-label="Ürün adı"
                  value={form.product_name}
                  onChange={(event) => updateField("product_name", event.target.value)}
                />
              </Field>
              <Field label="Marka" hint="İsteğe bağlı. Vitrinde ürün adının üstünde küçük harflerle görünür.">
                <Input
                  placeholder="Örn. Marathon"
                  aria-label="Marka"
                  maxLength={80}
                  value={form.brand}
                  onChange={(event) => updateField("brand", event.target.value)}
                />
              </Field>
              <div className="grid gap-5 md:grid-cols-2">
                <CategoryField
                  categories={flatCategories}
                  value={form.category_id}
                  onChange={(id) => updateField("category_id", id)}
                  onCreated={(category) => {
                    setCategories((current) => [...current, category]);
                    updateField("category_id", category.id);
                  }}
                />
                <Field
                  label="Model No"
                  required
                  hint="Ürünün kimliği. Bayi bu kodla arar; Excel güncellemesinde ürün bu kodla eşleşir."
                >
                  <Input
                    placeholder="Örn. KBL-037"
                    aria-label="Model No"
                    value={form.sku_code}
                    onChange={(event) => updateField("sku_code", event.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Açıklama</span>
                <ProductDescriptionEditor
                  value={form.description}
                  onChange={(value) => updateField("description", value)}
                />
              </div>
            </div>
          </FormCard>

          <FormCard
            title="Fotoğraflar"
            description="En fazla 3 görsel. Ana görsel katalogdaki ürün kartında görünür; diğerleri ürün sayfasında."
          >
            <ProductImageFields
              featured
              images={[form.image, form.image2, form.image3]}
              onSelect={(slot, file) => handleImageSelect(slot, file)}
              onRemove={(slot) => handleImageSelect(slot, null)}
            />
          </FormCard>

          <FormCard
            title="Fiyatlar"
            description="Her fiyat listesi için adet fiyatını girin. Bayi kataloğa kendi şifresiyle girince yalnız bağlı olduğu listenin fiyatını görür."
          >
            <div className="grid gap-5 md:grid-cols-[160px_minmax(0,1fr)]">
              <Field label="Para birimi">
                <Select
                  aria-label="Para birimi"
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
                hint="Bayiye gösterilmez; Satış & Kârlılık raporunda kâr hesabı için kullanılır."
              >
                <Input
                  value={form.purchase_price}
                  onChange={(event) => updateField("purchase_price", event.target.value)}
                  placeholder="İsteğe bağlı"
                  aria-label="Alış fiyatı (maliyet)"
                  inputMode="decimal"
                />
              </Field>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
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
                <ToggleRow
                  checked={form.is_discount_active}
                  onChange={(checked) => updateField("is_discount_active", checked)}
                  title="İndirim uygula"
                  description={
                    form.is_discount_active
                      ? "İndirimli fiyatı her listenin altındaki alana girin. Boş bıraktığınız listede indirim uygulanmaz."
                      : "Açarsanız her fiyat listesine indirimli fiyat girebilirsiniz; katalogda eski fiyat üstü çizili görünür."
                  }
                />
              </div>
            </PlanFeatureGate>
          </FormCard>
        </div>

        <aside className="grid gap-6">
          <FormCard title="Stok ve görünürlük">
            <div className="grid gap-2">
              <ToggleRow
                checked={form.track_stock ? Number(form.stock_quantity || 0) > 0 : form.is_in_stock}
                disabled={form.track_stock}
                onChange={(checked) => updateField("is_in_stock", checked)}
                title="Stokta görünsün"
                description={
                  form.track_stock
                    ? "Stok takibi açık: adet 0'ın üstündeyse otomatik olarak stokta görünür."
                    : "Açıksa ürün satışa açıktır. Kapatırsanız “Stokta yok” görünür ve sepete eklenemez."
                }
              />
              <ToggleRow
                checked={form.track_stock}
                onChange={(checked) => updateField("track_stock", checked)}
                title="Stok takibi yapılsın"
                description="Kalan adet katalogda görünür, bayi fazlasını sepete ekleyemez. Sipariş onaylanınca stok düşer, iptalde geri eklenir; 0 olunca “Stokta yok” olur."
              >
                {form.track_stock ? (
                  <label className="mt-3 grid gap-1.5 text-sm">
                    <span className="font-medium text-slate-700">Stok adedi</span>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      aria-label="Stok adedi"
                      value={form.stock_quantity}
                      onChange={(event) => updateField("stock_quantity", event.target.value)}
                      placeholder="Örn. 120"
                    />
                  </label>
                ) : null}
              </ToggleRow>
              <ToggleRow
                checked={form.is_recommended}
                onChange={(checked) => updateField("is_recommended", checked)}
                title="Sepet önerilerinde göster"
                description="Sepet önerileri ayarı manuel moddaysa bu ürün bayinin sepetinde önerilir."
              />

              {/* Alkollü ürün bayrağı yalnız market tipi hesaplarda; tekel
                  (is_tekel) mağazalarda bu ürünler vitrinde gizlenir (bkz. 0114). */}
              {tenant.business_type === "market" ? (
                <ToggleRow
                  checked={form.is_alcohol}
                  onChange={(checked) => updateField("is_alcohol", checked)}
                  title="Alkollü ürün"
                  description="Tekel mağazalarda vitrinde gösterilmez."
                />
              ) : null}
            </div>
          </FormCard>

          {/* Paket / koli adedi market tipi hesaplarda girilmiyor (kullanıcı
              isteği, 4 Eyl 2026) — toptancı/genel tipte gösterilir. */}
          {tenant.business_type !== "market" ? (
            <FormCard
              title="Satış birimi"
              description="Girerseniz bayi sepette adet, paket ya da koli seçer; toplam adedi sistem hesaplar."
            >
              <div className="grid grid-cols-2 gap-3">
                <Field label="Paket adedi">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Örn. 10"
                    aria-label="Paket adedi"
                    value={form.package_quantity}
                    onChange={(event) => updateField("package_quantity", event.target.value)}
                  />
                </Field>
                <Field label="Koli adedi">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Örn. 200"
                    aria-label="Koli adedi"
                    value={form.carton_quantity}
                    onChange={(event) => updateField("carton_quantity", event.target.value)}
                  />
                </Field>
              </div>
            </FormCard>
          ) : null}

        </aside>

        <div className="sticky bottom-4 z-20 lg:col-span-2">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {missingCount > 0 ? "Kaydetmek için eksikleri tamamlayın" : "Ürün kaydetmeye hazır"}
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-center gap-1.5 text-sm">
                    {item.done ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <Circle className="size-4 text-slate-300" />
                    )}
                    <span className={item.done ? "text-slate-700" : "text-slate-500"}>{item.label}</span>
                  </li>
                ))}
              </ul>
              {message ? (
                <p className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {message}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/dashboard/products")}
              >
                Geri dön
              </Button>
              <Button type="submit" disabled={pending || isLimitFull || missingCount > 0}>
                {pending ? "Kaydediliyor..." : "Yeni ürünü kaydet"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function FormCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid content-start gap-1.5 text-sm">
      <span className="font-medium text-slate-700">
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

/** Kategori seçimi + yerinde yeni kategori oluşturma (hiç kategori yoksa açık gelir). */
function CategoryField({
  categories,
  value,
  onChange,
  onCreated,
}: {
  categories: Array<Category & { depth: number }>;
  value: string;
  onChange: (id: string) => void;
  onCreated: (category: Category) => void;
}) {
  const [creating, setCreating] = useState(categories.length === 0);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function createCategory() {
    setError(null);
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Kategori adı en az 2 harf olmalı.");
      return;
    }
    startSaving(async () => {
      const response = await fetch("/api/tenant/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const result = (await response.json().catch(() => ({}))) as { category?: Category; error?: string };
      if (!response.ok || !result.category) {
        setError(result.error ?? "Kategori oluşturulamadı.");
        return;
      }
      onCreated(result.category);
      setName("");
      setCreating(false);
    });
  }

  return (
    <div className="grid content-start gap-1.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-slate-700">
          Kategori<span className="ml-0.5 text-rose-500">*</span>
        </span>
        {!creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <Plus className="size-3.5" />
            Yeni kategori
          </button>
        ) : null}
      </div>

      {creating ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
          <p className="text-xs text-slate-600">
            {categories.length === 0
              ? "Henüz kategoriniz yok. İlk kategorinizi buradan oluşturun."
              : "Yeni kategori oluşturun; ürün otomatik olarak bu kategoriye eklenir."}
          </p>
          <div className="mt-2 flex gap-2">
            <Input
              autoFocus
              placeholder="Örn. Şarj Kabloları"
              aria-label="Yeni kategori adı"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  createCategory();
                }
              }}
              className="py-2.5"
            />
            <Button type="button" onClick={createCategory} disabled={saving}>
              {saving ? "Ekleniyor..." : "Oluştur"}
            </Button>
          </div>
          {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
          {categories.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setError(null);
              }}
              className="mt-2 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Vazgeç, listeden seç
            </button>
          ) : null}
        </div>
      ) : (
        <Select aria-label="Kategori" value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Kategori seçin</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {"— ".repeat(category.depth)}
              {category.name}
            </option>
          ))}
        </Select>
      )}
      <span className="text-xs text-slate-500">Ürün katalogda bu kategorinin altında listelenir.</span>
    </div>
  );
}

/** Açıklamalı aç-kapa satırı (anahtar görünümlü onay kutusu). */
function ToggleRow({
  checked,
  disabled,
  onChange,
  title,
  description,
  children,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
      <label className={`flex items-start justify-between gap-3 ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
        <span>
          <span className="block text-sm font-semibold text-slate-800">{title}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{description}</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          aria-label={title}
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          aria-hidden
          className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-400 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
        />
      </label>
      {children}
    </div>
  );
}
