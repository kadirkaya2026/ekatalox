"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  isReservedSubdomain,
  RESERVED_SUBDOMAIN_MESSAGE,
} from "@/lib/tenancy/reserved-subdomains";
import type { AccessCode, MaxProductLimit, TenantWithRelations } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

interface NewTenantForm {
  company_name: string;
  subdomain: string;
  max_product_limit: MaxProductLimit;
  whatsapp_number: string;
  tenant_admin_email: string;
  tenant_admin_full_name: string;
}

const defaultForm: NewTenantForm = {
  company_name: "",
  subdomain: "",
  max_product_limit: 300,
  whatsapp_number: "",
  tenant_admin_email: "",
  tenant_admin_full_name: "",
};

function getSubdomainMessage(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (isReservedSubdomain(normalized)) {
    return RESERVED_SUBDOMAIN_MESSAGE;
  }

  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return "Alt alan adı yalnız küçük harf, rakam ve tire içerebilir.";
  }

  return null;
}

export function AdminTenantsManager({
  initialTenants,
}: {
  initialTenants: TenantWithRelations[];
}) {
  const [tenants, setTenants] = useState(initialTenants);
  const [form, setForm] = useState<NewTenantForm>(defaultForm);
  const [codeDrafts, setCodeDrafts] = useState<Record<string, string>>({});
  const [tierDrafts, setTierDrafts] = useState<Record<string, 1 | 2 | 3>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    subdomain: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const totals = useMemo(
    () => ({
      total: tenants.length,
      active: tenants.filter((tenant) => tenant.status === "active").length,
      suspended: tenants.filter((tenant) => tenant.status === "suspended").length,
    }),
    [tenants],
  );
  const subdomainMessage = getSubdomainMessage(form.subdomain);

  function handleCreateTenant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (subdomainMessage) {
      setMessage(subdomainMessage);
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Tenant oluşturulamadı.");
        return;
      }

      setTenants((current) => [result.tenant as TenantWithRelations, ...current]);
      if (result.tenantAdmin) {
        setCreatedCredentials({
          email: result.tenantAdmin.email,
          password: result.tenantAdmin.temporaryPassword,
          subdomain: result.tenant.subdomain,
        });
      }
      setForm(defaultForm);
      setMessage("Yeni tenant oluşturuldu.");
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

  function createAccessCode(tenantId: string) {
    const password_code = codeDrafts[tenantId]?.trim();
    const price_tier_level = tierDrafts[tenantId] ?? 1;

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
          price_tier_level,
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Yeni tenant oluştur</h2>
            <p className="mt-1 text-sm text-slate-600">
              Alt alan adı, ürün limiti ve WhatsApp numarasıyla hızlı kurulum yapın.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCreateTenant}
          className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4"
        >
          <Input
            placeholder="Firma adı"
            value={form.company_name}
            onChange={(event) =>
              setForm((current) => ({ ...current, company_name: event.target.value }))
            }
          />
          <Input
            placeholder="subdomain"
            value={form.subdomain}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                subdomain: event.target.value.toLowerCase(),
              }))
            }
          />
          <select
            value={form.max_product_limit}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                max_product_limit: Number(event.target.value) as MaxProductLimit,
              }))
            }
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
          >
            <option value={300}>300 ürün</option>
            <option value={500}>500 ürün</option>
            <option value={1000}>1000 ürün</option>
          </select>
          <Input
            placeholder="90555..."
            value={form.whatsapp_number}
            onChange={(event) =>
              setForm((current) => ({ ...current, whatsapp_number: event.target.value }))
            }
          />
          <Input
            type="email"
            placeholder="tenant-admin@firma.com"
            value={form.tenant_admin_email}
            onChange={(event) =>
              setForm((current) => ({ ...current, tenant_admin_email: event.target.value }))
            }
          />
          <Input
            placeholder="Tenant admin adı"
            value={form.tenant_admin_full_name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                tenant_admin_full_name: event.target.value,
              }))
            }
          />
          <div className="md:col-span-2 xl:col-span-4">
            <p className="mb-3 text-sm text-slate-500">
              Ayrılmış kelimeler: admin, app, www, api, ekatalox, assets
            </p>
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor..." : "Tenant oluştur"}
            </Button>
          </div>
        </form>
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
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {tenant.subdomain}.ekatalox.com • Limit: {tenant.max_product_limit} ürün
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  WhatsApp: {tenant.whatsapp_number} • Açılış: {formatDate(tenant.created_at)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
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
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Şifre yönetimi</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(tenant.access_codes ?? []).map((accessCode) => (
                    <div
                      key={accessCode.id}
                      className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm shadow-sm"
                    >
                      <span className="font-semibold text-slate-900">
                        {accessCode.password_code}
                      </span>
                      <span className="text-slate-500">Katman {accessCode.price_tier_level}</span>
                      <button
                        type="button"
                        onClick={() => deleteAccessCode(tenant.id, accessCode.id)}
                        className="text-slate-400 transition hover:text-slate-900"
                      >
                        Sil
                      </button>
                    </div>
                  ))}
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
                    value={tierDrafts[tenant.id] ?? 1}
                    onChange={(event) =>
                      setTierDrafts((current) => ({
                        ...current,
                        [tenant.id]: Number(event.target.value) as 1 | 2 | 3,
                      }))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  >
                    <option value={1}>Katman 1 • Toptancı</option>
                    <option value={2}>Katman 2 • Bayi</option>
                    <option value={3}>Katman 3 • Telefoncu</option>
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

      {createdCredentials ? (
        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-900">
            Tenant admin hesabı oluşturuldu
          </p>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-900">Giriş adresi:</span>{" "}
              {createdCredentials.email}
            </p>
            <p>
              <span className="font-medium text-slate-900">Geçici şifre:</span>{" "}
              {createdCredentials.password}
            </p>
            <p>
              <span className="font-medium text-slate-900">Panel:</span>{" "}
              app.ekatalox.com
            </p>
            <p>
              <span className="font-medium text-slate-900">Mağaza:</span>{" "}
              {createdCredentials.subdomain}.ekatalox.com
            </p>
            <p className="pt-2 text-amber-700">
              Bu şifre yalnız bir kez gösterilir. Lütfen şimdi kaydedin.
            </p>
          </div>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => setCreatedCredentials(null)}>
              Kapat
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}