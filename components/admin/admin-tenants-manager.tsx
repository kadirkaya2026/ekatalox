"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  formatEffectiveProductLimit,
  formatPlanSummary,
  formatProductLimit,
  formatVisitorLimit,
  getPlanLabel,
  PLAN_OPTIONS,
} from "@/lib/billing/plans";
import { getPriceListDisplayName, normalizePriceListName } from "@/lib/price-lists/constants";
import type { AccessCode, TenantPlan, TenantWithRelations } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

function getTrialBadge(trialEndsAt: string | null | undefined) {
  if (!trialEndsAt) {
    return null;
  }

  const diffMs = new Date(trialEndsAt).getTime() - Date.now();
  const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  if (daysLeft <= 0) {
    return { label: "Deneme süresi doldu", className: "bg-rose-50 text-rose-700" };
  }

  return {
    label: `Deneme — ${daysLeft} gün kaldı`,
    className: "bg-amber-50 text-amber-700",
  };
}

export function AdminTenantsManager({
  initialTenants,
}: {
  initialTenants: TenantWithRelations[];
}) {
  const [tenants, setTenants] = useState(initialTenants);
  const [planDrafts, setPlanDrafts] = useState<Record<string, TenantPlan>>({});
  const [giftDrafts, setGiftDrafts] = useState<Record<string, number>>({});
  const [addonDrafts, setAddonDrafts] = useState<Record<string, number>>({});
  const [productAddonDrafts, setProductAddonDrafts] = useState<Record<string, number>>({});
  const [codeDrafts, setCodeDrafts] = useState<Record<string, string>>({});
  const [priceListDrafts, setPriceListDrafts] = useState<Record<string, string>>({});
  const [editingAccessCodeId, setEditingAccessCodeId] = useState<string | null>(null);
  const [editDrafts, setEditDrafts] = useState<
    Record<string, { password_code: string; price_list_id: string }>
  >({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const totals = useMemo(
    () => ({
      total: tenants.length,
      active: tenants.filter((tenant) => tenant.status === "active").length,
      suspended: tenants.filter((tenant) => tenant.status === "suspended").length,
    }),
    [tenants],
  );

  function updateTenantPlan(id: string) {
    const plan = planDrafts[id] ?? tenants.find((tenant) => tenant.id === id)?.plan;

    if (!plan) {
      setMessage("Paket seçin.");
      return;
    }

    setMessage(null);

    startTransition(async () => {
      // Süper admin paket atadığında deneme süresi de sona erdirilir.
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, end_trial: true }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Tenant paketi güncellenemedi.");
        return;
      }

      setTenants((current) =>
        current.map((tenant) =>
          tenant.id === id ? { ...tenant, ...result.tenant } : tenant,
        ),
      );
      setMessage("Tenant paketi güncellendi.");
    });
  }

  function updateVisitorAddon(id: string) {
    const tenant = tenants.find((t) => t.id === id);
    const addon = addonDrafts[id] ?? tenant?.visitor_limit_addon ?? 0;
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor_limit_addon: addon }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Ek ziyaretçi kotası güncellenemedi.");
        return;
      }

      setTenants((current) =>
        current.map((t) => (t.id === id ? { ...t, ...result.tenant } : t)),
      );
      setMessage("Ek ziyaretçi kotası güncellendi.");
    });
  }

  function updateProductAddon(id: string) {
    const tenant = tenants.find((t) => t.id === id);
    const addon = productAddonDrafts[id] ?? tenant?.product_limit_addon ?? 0;
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_limit_addon: addon }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Hediye ürün kapasitesi güncellenemedi.");
        return;
      }

      setTenants((current) =>
        current.map((t) => (t.id === id ? { ...t, ...result.tenant } : t)),
      );
      setMessage("Hediye ürün kapasitesi güncellendi.");
    });
  }

  function addGiftMonths(id: string) {
    const months = giftDrafts[id] ?? 1;
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gift_months: months }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Hediye ay eklenemedi.");
        return;
      }

      setTenants((current) =>
        current.map((tenant) =>
          tenant.id === id ? { ...tenant, ...result.tenant } : tenant,
        ),
      );
      setMessage(`Üyeliğe ${months} ay hediye eklendi.`);
    });
  }

  function toggleTenantTrial(id: string, action: "start" | "end") {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "start" ? { start_trial: true } : { end_trial: true },
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Deneme durumu güncellenemedi.");
        return;
      }

      setTenants((current) =>
        current.map((tenant) =>
          tenant.id === id ? { ...tenant, ...result.tenant } : tenant,
        ),
      );
      setMessage(
        action === "start"
          ? "Hesap 14 günlük deneme süresine alındı."
          : "Deneme süresi sonlandırıldı.",
      );
    });
  }

  function toggleTenantStatus(id: string, status: "active" | "suspended") {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Tenant durumu güncellenemedi.");
        return;
      }

      setTenants((current) =>
        current.map((tenant) =>
          tenant.id === id ? { ...tenant, status: result.tenant.status } : tenant,
        ),
      );
      setMessage("Tenant durumu güncellendi.");
    });
  }

  function deleteTenant(id: string, companyName: string) {
    const confirmed = window.confirm(
      `${companyName} tenantını ve bağlı verilerini kalıcı olarak silmek istediğinize emin misiniz?`,
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Tenant silinemedi.");
        return;
      }

      setTenants((current) => current.filter((tenant) => tenant.id !== id));
      setMessage("Tenant ve bağlı verileri silindi.");
    });
  }

  function createAccessCode(tenantId: string) {
    const password_code = codeDrafts[tenantId]?.trim();
    const tenant = tenants.find((entry) => entry.id === tenantId);
    const price_list_id =
      priceListDrafts[tenantId] ?? tenant?.price_lists?.[0]?.id ?? "";

    if (!password_code) {
      setMessage("Şifre kodu giriniz.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/access-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          password_code,
          price_list_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Şifre eklenemedi.");
        return;
      }

      setTenants((current) =>
        current.map((tenant) =>
          tenant.id === tenantId
            ? {
                ...tenant,
                access_codes: [
                  result.accessCode as AccessCode,
                  ...(tenant.access_codes ?? []),
                ],
              }
            : tenant,
        ),
      );
      setCodeDrafts((current) => ({ ...current, [tenantId]: "" }));
      setMessage("Şifre eklendi.");
    });
  }

  function deleteAccessCode(tenantId: string, accessCodeId: string) {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/access-codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: accessCodeId }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Şifre silinemedi.");
        return;
      }

      setTenants((current) =>
        current.map((tenant) =>
          tenant.id === tenantId
            ? {
                ...tenant,
                access_codes: (tenant.access_codes ?? []).filter(
                  (accessCode) => accessCode.id !== accessCodeId,
                ),
              }
            : tenant,
        ),
      );
      setMessage("Şifre kaldırıldı.");
    });
  }

  function startEditingAccessCode(accessCode: AccessCode) {
    setEditingAccessCodeId(accessCode.id);
    setEditDrafts((current) => ({
      ...current,
      [accessCode.id]: {
        password_code: accessCode.password_code,
        price_list_id: accessCode.price_list_id,
      },
    }));
  }

  function cancelEditingAccessCode() {
    setEditingAccessCodeId(null);
  }

  function updateAccessCode(tenantId: string, accessCodeId: string) {
    const draft = editDrafts[accessCodeId];
    const password_code = draft?.password_code.trim();

    if (!password_code) {
      setMessage("Şifre kodu giriniz.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/access-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: accessCodeId,
          password_code,
          price_list_id: draft.price_list_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Şifre güncellenemedi.");
        return;
      }

      setTenants((current) =>
        current.map((tenant) =>
          tenant.id === tenantId
            ? {
                ...tenant,
                access_codes: (tenant.access_codes ?? []).map((accessCode) =>
                  accessCode.id === accessCodeId
                    ? (result.accessCode as AccessCode)
                    : accessCode,
                ),
              }
            : tenant,
        ),
      );
      setEditingAccessCodeId(null);
      setMessage("Şifre güncellendi.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Toplam tenant</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totals.total}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Aktif tenant</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{totals.active}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Askıya alınan tenant</p>
          <p className="mt-2 text-3xl font-bold text-slate-700">{totals.suspended}</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Yeni tenant oluştur</h2>
            <p className="mt-1 text-sm text-slate-600">
              Ad soyad, telefon (opsiyonel) ve alt alan adıyla hızlı kurulum yapın.
            </p>
          </div>
          <Button asChild href="/admin/tenants/new">
            Yeni Tenant Oluştur
          </Button>
        </div>
      </Card>

      {message ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4">
        {tenants.map((tenant) => (
          <Card key={tenant.id} className="p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {tenant.company_name}
                  </h3>
                  <Badge
                    className={cn(
                      tenant.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {tenant.status === "active" ? "Aktif" : "Askıda"}
                  </Badge>
                  {(() => {
                    const trialBadge = getTrialBadge(tenant.trial_ends_at);
                    return trialBadge ? (
                      <Badge className={trialBadge.className}>
                        {trialBadge.label}
                      </Badge>
                    ) : null;
                  })()}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {tenant.subdomain}.ekatalox.com •{" "}
                  {formatPlanSummary(tenant.plan ?? "baslangic")}
                </p>
                {tenant.custom_domain ? (
                  <p className="mt-1 text-sm text-slate-600">
                    Özel alan adı: {tenant.custom_domain}
                  </p>
                ) : null}
                <p className="mt-1 text-sm text-slate-500">
                  WhatsApp: {tenant.whatsapp_number} • Açılış: {formatDate(tenant.created_at)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    toggleTenantTrial(
                      tenant.id,
                      tenant.trial_ends_at ? "end" : "start",
                    )
                  }
                  disabled={pending}
                  className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                >
                  {tenant.trial_ends_at ? "Denemeyi sonlandır" : "Denemeye al"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    toggleTenantStatus(
                      tenant.id,
                      tenant.status === "active" ? "suspended" : "active",
                    )
                  }
                  disabled={pending}
                >
                  {tenant.status === "active" ? "Askıya al" : "Yeniden aç"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => deleteTenant(tenant.id, tenant.company_name)}
                  disabled={pending}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                >
                  Tamamen sil
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Paket yönetimi</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={planDrafts[tenant.id] ?? tenant.plan ?? "baslangic"}
                    onChange={(event) =>
                      setPlanDrafts((current) => ({
                        ...current,
                        [tenant.id]: event.target.value as TenantPlan,
                      }))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  >
                    {PLAN_OPTIONS.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} — {formatProductLimit(plan.maxProductLimit)} ürün
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    onClick={() => updateTenantPlan(tenant.id)}
                    disabled={
                      pending ||
                      (planDrafts[tenant.id] ?? tenant.plan ?? "baslangic") ===
                        (tenant.plan ?? "baslangic")
                    }
                  >
                    Paketi güncelle
                  </Button>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  Mevcut: {getPlanLabel(tenant.plan ?? "baslangic")} •{" "}
                  {formatEffectiveProductLimit(tenant.plan ?? "baslangic", tenant.product_limit_addon ?? 0)} ürün
                  {tenant.product_limit_addon ? (
                    <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      +{formatProductLimit(tenant.product_limit_addon)} hediye
                    </span>
                  ) : null}
                  {tenant.plan_expires_at ? (
                    <> • Üyelik bitişi: {formatDate(tenant.plan_expires_at)}</>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Ziyaretçi kotası: {formatVisitorLimit(tenant.plan ?? "baslangic", tenant.visitor_limit_addon ?? 0)} / ay
                  {tenant.visitor_quota_exceeded ? (
                    <span className="ml-2 inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                      Kota doldu
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  Kullanım: {formatProductLimit(tenant.product_count ?? 0)} ürün yüklü •{" "}
                  {formatProductLimit(tenant.monthly_visitor_count ?? 0)} ziyaretçi (bu ay)
                </p>
                <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="Ek ziyaretçi (ör. 25000)"
                    value={String(addonDrafts[tenant.id] ?? tenant.visitor_limit_addon ?? 0)}
                    onChange={(event) =>
                      setAddonDrafts((current) => ({
                        ...current,
                        [tenant.id]: Math.max(0, Number(event.target.value) || 0),
                      }))
                    }
                    className="max-w-[220px]"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => updateVisitorAddon(tenant.id)}
                    disabled={
                      pending ||
                      (addonDrafts[tenant.id] ?? tenant.visitor_limit_addon ?? 0) ===
                        (tenant.visitor_limit_addon ?? 0)
                    }
                  >
                    Ek kotayı güncelle
                  </Button>
                </div>
                <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
                  <Input
                    type="number"
                    min={0}
                    step={50}
                    placeholder="Hediye ürün (ör. 250)"
                    value={String(productAddonDrafts[tenant.id] ?? tenant.product_limit_addon ?? 0)}
                    onChange={(event) =>
                      setProductAddonDrafts((current) => ({
                        ...current,
                        [tenant.id]: Math.max(0, Number(event.target.value) || 0),
                      }))
                    }
                    className="max-w-[220px]"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => updateProductAddon(tenant.id)}
                    disabled={
                      pending ||
                      (productAddonDrafts[tenant.id] ?? tenant.product_limit_addon ?? 0) ===
                        (tenant.product_limit_addon ?? 0)
                    }
                  >
                    Hediye kapasiteyi güncelle
                  </Button>
                </div>
                <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
                  <select
                    value={giftDrafts[tenant.id] ?? 1}
                    onChange={(event) =>
                      setGiftDrafts((current) => ({
                        ...current,
                        [tenant.id]: Number(event.target.value),
                      }))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  >
                    {[1, 2, 3, 6, 12].map((months) => (
                      <option key={months} value={months}>
                        +{months} ay
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    onClick={() => addGiftMonths(tenant.id)}
                    disabled={pending}
                    className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
                  >
                    Hediye ay ekle
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Şifre yönetimi</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(tenant.access_codes ?? []).map((accessCode) => {
                    const isEditing = editingAccessCodeId === accessCode.id;
                    const draft = editDrafts[accessCode.id];

                    if (isEditing && draft) {
                      return (
                        <div
                          key={accessCode.id}
                          className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center"
                        >
                          <Input
                            placeholder="1111"
                            value={draft.password_code}
                            onChange={(event) =>
                              setEditDrafts((current) => ({
                                ...current,
                                [accessCode.id]: {
                                  ...current[accessCode.id],
                                  password_code: event.target.value,
                                },
                              }))
                            }
                            className="sm:max-w-[140px]"
                          />
                          <select
                            value={draft.price_list_id}
                            onChange={(event) =>
                              setEditDrafts((current) => ({
                                ...current,
                                [accessCode.id]: {
                                  ...current[accessCode.id],
                                  price_list_id: event.target.value,
                                },
                              }))
                            }
                            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                          >
                            {(tenant.price_lists ?? []).map((list) => (
                              <option key={list.id} value={list.id}>
                                {getPriceListDisplayName(list)}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <Button
                              className="px-3 py-2"
                              onClick={() => updateAccessCode(tenant.id, accessCode.id)}
                              disabled={pending}
                            >
                              Kaydet
                            </Button>
                            <Button
                              className="px-3 py-2"
                              variant="secondary"
                              onClick={cancelEditingAccessCode}
                              disabled={pending}
                            >
                              İptal
                            </Button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={accessCode.id}
                        className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm shadow-sm"
                      >
                        <span className="font-semibold text-slate-900">
                          {accessCode.password_code}
                        </span>
                        <span className="text-slate-500">
                          {accessCode.price_list_name
                            ? normalizePriceListName(accessCode.price_list_name)
                            : "Fiyat listesi"}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEditingAccessCode(accessCode)}
                          className="text-slate-400 transition hover:text-slate-900"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAccessCode(tenant.id, accessCode.id)}
                          className="text-slate-400 transition hover:text-slate-900"
                        >
                          Sil
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Yeni şifre ekle</p>
                <div className="mt-4 grid gap-3">
                  <Input
                    placeholder="1111"
                    value={codeDrafts[tenant.id] ?? ""}
                    onChange={(event) =>
                      setCodeDrafts((current) => ({
                        ...current,
                        [tenant.id]: event.target.value,
                      }))
                    }
                  />
                  <select
                    value={priceListDrafts[tenant.id] ?? tenant.price_lists?.[0]?.id ?? ""}
                    onChange={(event) =>
                      setPriceListDrafts((current) => ({
                        ...current,
                        [tenant.id]: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  >
                    {(tenant.price_lists ?? []).map((list) => (
                      <option key={list.id} value={list.id}>
                        {getPriceListDisplayName(list)}
                      </option>
                    ))}
                  </select>
                  <Button onClick={() => createAccessCode(tenant.id)} disabled={pending}>
                    Şifre kaydet
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}