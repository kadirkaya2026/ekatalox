"use client";

import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getPriceListDisplayName } from "@/lib/price-lists/constants";
import type { PriceList } from "@/lib/types";

// Bayi başvurusu onayı ve Müşteriler → düzenle için ortak form: müşteri
// bilgileri + fiyat listesi + kişiye özel şifre.

export interface DealerCustomerFormValues {
  customer_company: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  customer_address: string;
  price_list_id: string;
  password_code: string;
}

function suggestPassword() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + (bytes[0] % 900000));
}

export function DealerCustomerForm({
  initial,
  priceLists,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: DealerCustomerFormValues;
  priceLists: PriceList[];
  submitLabel: string;
  onSubmit: (values: DealerCustomerFormValues) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<DealerCustomerFormValues>(() => ({
    ...initial,
    password_code: initial.password_code || suggestPassword(),
    price_list_id: initial.price_list_id || priceLists.find((list) => !list.is_catalog_only)?.id || priceLists[0]?.id || "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof DealerCustomerFormValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const message = await onSubmit({ ...values, password_code: values.password_code.trim() });
    setSaving(false);
    if (message) setError(message);
  }

  const label = "block space-y-1.5 text-sm font-medium";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>
          <span>Firma adı</span>
          <Input value={values.customer_company} onChange={set("customer_company")} maxLength={120} />
        </label>
        <label className={label}>
          <span>Yetkili adı *</span>
          <Input value={values.customer_name} onChange={set("customer_name")} maxLength={80} required />
        </label>
        <label className={label}>
          <span>Telefon</span>
          <Input value={values.customer_phone} onChange={set("customer_phone")} maxLength={20} inputMode="tel" />
        </label>
        <label className={label}>
          <span>İl</span>
          <Input value={values.customer_city} onChange={set("customer_city")} maxLength={40} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          <span>Adres</span>
          <Input value={values.customer_address} onChange={set("customer_address")} maxLength={400} />
        </label>
      </div>

      <div className="grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 sm:grid-cols-2 dark:border-emerald-900 dark:bg-emerald-950/30">
        <label className={label}>
          <span>Göreceği fiyat listesi *</span>
          <Select value={values.price_list_id} onChange={set("price_list_id")} required>
            {priceLists.map((list) => (
              <option key={list.id} value={list.id}>
                {getPriceListDisplayName(list)}
              </option>
            ))}
          </Select>
        </label>
        <label className={label}>
          <span>Kişiye özel şifre *</span>
          <div className="flex gap-2">
            <Input
              value={values.password_code}
              onChange={set("password_code")}
              minLength={3}
              maxLength={40}
              required
              autoComplete="off"
              className="font-mono"
            />
            <Button
              type="button"
              variant="secondary"
              title="Rastgele şifre öner"
              onClick={() => setValues((current) => ({ ...current, password_code: suggestPassword() }))}
            >
              <Wand2 className="size-4" />
            </Button>
          </div>
        </label>
        <p className="text-xs leading-5 text-muted-foreground sm:col-span-2">
          Bu şifre yalnız bu müşteriye aittir; başka müşteriye veya ortak liste şifresine verilemez. Müşteri bu şifreyle girince
          sepette ad, telefon ve adres sorulmaz, sipariş fişine otomatik yazılır.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Vazgeç
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
