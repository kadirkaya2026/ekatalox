"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { COUPON_PERIODS, COUPON_PLAN_IDS, normalizeCouponCode } from "@/lib/admin/self-service";
import { ESNAF_PLANS, formatTry, getPlanPrice, type BillingPeriod } from "@/lib/billing/esnaf-plans";
import type { SignupCoupon, SignupCouponDiscountType } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

type CouponPlanId = (typeof COUPON_PLAN_IDS)[number];

const PERIOD_LABELS: Record<BillingPeriod, string> = { monthly: "Aylık", yearly: "Yıllık" };

interface CouponFormState {
  code: string;
  description: string;
  discount_type: SignupCouponDiscountType;
  discount_value: string;
  applies_to_plans: CouponPlanId[];
  applies_to_periods: BillingPeriod[];
  valid_from: string;
  valid_until: string;
  max_uses: string;
}

const EMPTY_FORM: CouponFormState = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: "",
  applies_to_plans: [],
  applies_to_periods: [],
  valid_from: "",
  valid_until: "",
  max_uses: "",
};

function applyDiscount(price: number, type: SignupCouponDiscountType, value: number) {
  if (!Number.isFinite(value) || value <= 0) return price;
  if (type === "percent") return Math.max(0, Math.round(price * (1 - Math.min(value, 100) / 100)));
  return Math.max(0, Math.round(price - value));
}

function planName(planId: string) {
  return ESNAF_PLANS.find((plan) => plan.planId === planId)?.name ?? planId;
}

function formatDiscount(coupon: SignupCoupon) {
  const value = Number(coupon.discount_value);
  return coupon.discount_type === "percent" ? `%${value.toLocaleString("tr-TR")}` : formatTry(value);
}

function formatScope(list: string[] | null, labeler: (value: string) => string, all: string) {
  if (!list || list.length === 0) return all;
  return list.map(labeler).join(", ");
}

function couponState(coupon: SignupCoupon): { label: string; variant: "success" | "warning" | "neutral" | "danger" } {
  if (!coupon.is_active) return { label: "Pasif", variant: "neutral" };
  const now = Date.now();
  if (coupon.valid_from && new Date(coupon.valid_from).getTime() > now) return { label: "Henüz başlamadı", variant: "warning" };
  if (coupon.valid_until && new Date(coupon.valid_until).getTime() < now) return { label: "Süresi doldu", variant: "danger" };
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) return { label: "Limit doldu", variant: "danger" };
  return { label: "Aktif", variant: "success" };
}

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function AdminCouponsPanel({
  initialCoupons,
  loadError,
}: {
  initialCoupons: SignupCoupon[];
  loadError: string | null;
}) {
  const [coupons, setCoupons] = useState<SignupCoupon[]>(initialCoupons);
  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(initialCoupons.length === 0);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(loadError);

  const discountValue = Number(form.discount_value.replace(",", "."));

  // Canlı önizleme: seçili paket × dönem kombinasyonları (boş = hepsi).
  const preview = useMemo(() => {
    const plans = ESNAF_PLANS.filter(
      (plan) => form.applies_to_plans.length === 0 || form.applies_to_plans.includes(plan.planId as CouponPlanId),
    );
    const periods: BillingPeriod[] = form.applies_to_periods.length ? form.applies_to_periods : [...COUPON_PERIODS];
    const lines: { key: string; label: string; before: number; after: number }[] = [];
    for (const plan of plans) {
      for (const period of periods) {
        const before = getPlanPrice(plan, period);
        lines.push({
          key: `${plan.slug}-${period}`,
          label: `${plan.name} ${PERIOD_LABELS[period].toLocaleLowerCase("tr-TR")}`,
          before,
          after: applyDiscount(before, form.discount_type, discountValue),
        });
      }
    }
    return lines;
  }, [discountValue, form.applies_to_periods, form.applies_to_plans, form.discount_type]);

  function update<K extends keyof CouponFormState>(key: K, value: CouponFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setMessage(null);

    if (!form.code.trim()) {
      setFormError("Kupon kodu girin.");
      return;
    }
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setFormError("İndirim değeri 0'dan büyük olmalı.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: normalizeCouponCode(form.code),
          description: form.description,
          discount_type: form.discount_type,
          discount_value: discountValue,
          applies_to_plans: form.applies_to_plans,
          applies_to_periods: form.applies_to_periods,
          valid_from: form.valid_from,
          valid_until: form.valid_until,
          max_uses: form.max_uses.trim() ? Number(form.max_uses) : null,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setFormError(result.error ?? "Kupon oluşturulamadı.");
        return;
      }
      setCoupons((current) => [result.coupon as SignupCoupon, ...current]);
      setForm(EMPTY_FORM);
      setMessage(`${(result.coupon as SignupCoupon).code} kuponu oluşturuldu.`);
    } catch {
      setFormError("Sunucuya ulaşılamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  async function patchCoupon(coupon: SignupCoupon, patch: Partial<Pick<SignupCoupon, "is_active">>) {
    setBusyId(coupon.id);
    setListError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const result = await response.json();
      if (!response.ok) {
        setListError(result.error ?? "Kupon güncellenemedi.");
        return;
      }
      setCoupons((current) => current.map((item) => (item.id === coupon.id ? (result.coupon as SignupCoupon) : item)));
      setMessage(patch.is_active === false ? `${coupon.code} pasife alındı.` : `${coupon.code} aktifleştirildi.`);
    } catch {
      setListError("Sunucuya ulaşılamadı.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteCoupon(coupon: SignupCoupon) {
    if (!window.confirm(`${coupon.code} kuponu silinsin mi? Bu işlem geri alınamaz.`)) {
      return;
    }
    setBusyId(coupon.id);
    setListError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        setListError(result.error ?? "Kupon silinemedi.");
        return;
      }
      setCoupons((current) => current.filter((item) => item.id !== coupon.id));
      setMessage(`${coupon.code} silindi.`);
    } catch {
      setListError("Sunucuya ulaşılamadı.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Yeni kupon</h2>
            <p className="mt-1 text-xs text-slate-500">
              Paket veya dönem seçilmezse kupon tüm paket ve dönemlerde geçerli olur.
            </p>
          </div>
          <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => setFormOpen((open) => !open)}>
            <Plus className={cn("size-4 transition", formOpen && "rotate-45")} />
            {formOpen ? "Formu gizle" : "Kupon oluştur"}
          </Button>
        </div>

        {formOpen ? (
          <form onSubmit={submit} className="mt-5 space-y-5">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-xs font-medium text-slate-500" htmlFor="coupon-code">
                  Kod
                </label>
                <Input
                  id="coupon-code"
                  value={form.code}
                  onChange={(event) => update("code", normalizeCouponCode(event.target.value))}
                  placeholder="ör. ACILIS20"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={32}
                  className="mt-1.5 font-mono uppercase"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500" htmlFor="coupon-type">
                  İndirim türü
                </label>
                <Select
                  id="coupon-type"
                  value={form.discount_type}
                  onChange={(event) => update("discount_type", event.target.value as SignupCouponDiscountType)}
                  className="mt-1.5"
                >
                  <option value="percent">Yüzde (%)</option>
                  <option value="amount">Tutar (₺)</option>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500" htmlFor="coupon-value">
                  Değer {form.discount_type === "percent" ? "(%)" : "(₺)"}
                </label>
                <Input
                  id="coupon-value"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={form.discount_type === "percent" ? 100 : undefined}
                  step={form.discount_type === "percent" ? 1 : 10}
                  value={form.discount_value}
                  onChange={(event) => update("discount_value", event.target.value)}
                  placeholder={form.discount_type === "percent" ? "ör. 20" : "ör. 5000"}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500" htmlFor="coupon-max">
                  Kullanım limiti
                </label>
                <Input
                  id="coupon-max"
                  type="number"
                  min={1}
                  step={1}
                  value={form.max_uses}
                  onChange={(event) => update("max_uses", event.target.value)}
                  placeholder="Boş = sınırsız"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <label className="text-xs font-medium text-slate-500" htmlFor="coupon-desc">
                  Açıklama
                </label>
                <Input
                  id="coupon-desc"
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder="Nerede dağıtıldı, kim için? (isteğe bağlı)"
                  maxLength={300}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500" htmlFor="coupon-from">
                  Başlangıç
                </label>
                <Input
                  id="coupon-from"
                  type="date"
                  value={form.valid_from}
                  onChange={(event) => update("valid_from", event.target.value)}
                  className="mt-1.5"
                />
                <p className="mt-1 text-[11px] text-slate-400">Boş = hemen</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500" htmlFor="coupon-until">
                  Bitiş
                </label>
                <Input
                  id="coupon-until"
                  type="date"
                  value={form.valid_until}
                  min={form.valid_from || undefined}
                  onChange={(event) => update("valid_until", event.target.value)}
                  className="mt-1.5"
                />
                <p className="mt-1 text-[11px] text-slate-400">Boş = süresiz</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <fieldset>
                <legend className="text-xs font-medium text-slate-500">Geçerli paketler</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ESNAF_PLANS.map((plan) => {
                    const id = plan.planId as CouponPlanId;
                    const checked = form.applies_to_plans.includes(id);
                    return (
                      <label
                        key={plan.slug}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                          checked
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                            : "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="accent-emerald-600"
                          checked={checked}
                          onChange={() => update("applies_to_plans", toggleValue(form.applies_to_plans, id))}
                        />
                        {plan.name}
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Boş = tüm paketler</p>
              </fieldset>
              <fieldset>
                <legend className="text-xs font-medium text-slate-500">Geçerli dönemler</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COUPON_PERIODS.map((period) => {
                    const checked = form.applies_to_periods.includes(period);
                    return (
                      <label
                        key={period}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                          checked
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                            : "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="accent-emerald-600"
                          checked={checked}
                          onChange={() => update("applies_to_periods", toggleValue(form.applies_to_periods, period))}
                        />
                        {PERIOD_LABELS[period]}
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Boş = aylık ve yıllık</p>
              </fieldset>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Önizleme</p>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {preview.map((line) => (
                  <li key={line.key} className="tabular-nums">
                    <span className="text-slate-600 dark:text-slate-300">{line.label}</span>{" "}
                    <span className={cn(line.after !== line.before && "text-slate-400 line-through")}>
                      {formatTry(line.before)}
                    </span>
                    {line.after !== line.before ? (
                      <>
                        {" "}
                        → <span className="font-semibold text-emerald-700">{formatTry(line.after)}</span>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="min-h-5">
                <InlineAlert message={formError} tone="error" />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Kuponu oluştur
              </Button>
            </div>
          </form>
        ) : null}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Kuponlar</h2>
            <p className="mt-1 text-xs text-slate-500">{coupons.length} kupon · en yeni en üstte</p>
          </div>
          <InlineAlert message={message} tone="success" onExpire={() => setMessage(null)} />
        </div>

        {listError ? (
          <p className="mx-5 mt-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {listError}
          </p>
        ) : null}

        {!coupons.length ? (
          <p className="p-5 text-sm text-slate-500">Henüz kupon tanımlanmadı.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-2 text-left">Kod</th>
                  <th className="px-4 py-2 text-left">İndirim</th>
                  <th className="px-4 py-2 text-left">Paketler</th>
                  <th className="px-4 py-2 text-left">Dönemler</th>
                  <th className="px-4 py-2 text-left">Geçerlilik</th>
                  <th className="px-4 py-2 text-right">Kullanım</th>
                  <th className="px-4 py-2 text-left">Durum</th>
                  <th className="px-4 py-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {coupons.map((coupon) => {
                  const state = couponState(coupon);
                  const busy = busyId === coupon.id;
                  return (
                    <tr key={coupon.id} className={cn("align-top", !coupon.is_active && "text-slate-500")}>
                      <td className="px-4 py-2.5">
                        <p className="font-mono text-sm font-semibold text-foreground">{coupon.code}</p>
                        {coupon.description ? (
                          <p className="mt-0.5 max-w-[260px] text-xs text-slate-500">{coupon.description}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap font-semibold tabular-nums">{formatDiscount(coupon)}</td>
                      <td className="px-4 py-2.5">{formatScope(coupon.applies_to_plans, planName, "Tümü")}</td>
                      <td className="px-4 py-2.5">
                        {formatScope(coupon.applies_to_periods, (p) => PERIOD_LABELS[p as BillingPeriod] ?? p, "Aylık, Yıllık")}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs">
                        {formatDate(coupon.valid_from)} → {coupon.valid_until ? formatDate(coupon.valid_until) : "süresiz"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {coupon.used_count.toLocaleString("tr-TR")} / {coupon.max_uses === null ? "∞" : coupon.max_uses.toLocaleString("tr-TR")}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={state.variant}>{state.label}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            className="px-3 py-1.5 text-xs"
                            disabled={busy}
                            onClick={() => patchCoupon(coupon, { is_active: !coupon.is_active })}
                          >
                            {coupon.is_active ? "Pasife al" : "Aktifleştir"}
                          </Button>
                          <Button
                            variant="secondary"
                            className="border-rose-200 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                            disabled={busy || coupon.used_count > 0}
                            title={coupon.used_count > 0 ? "Kullanılmış kupon silinemez" : undefined}
                            onClick={() => deleteCoupon(coupon)}
                          >
                            Sil
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
