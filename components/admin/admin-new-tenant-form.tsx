"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  isReservedSubdomain,
  normalizeSubdomain,
  RESERVED_SUBDOMAIN_MESSAGE,
} from "@/lib/tenancy/reserved-subdomains";
import type { TenantWithRelations } from "@/lib/types";

interface NewTenantForm {
  full_name: string;
  whatsapp_number: string;
  subdomain: string;
}

const defaultForm: NewTenantForm = {
  full_name: "",
  whatsapp_number: "",
  subdomain: "",
};

function getSubdomainMessage(value: string) {
  const normalized = normalizeSubdomain(value);

  if (!normalized) {
    return "Alt alan adı zorunludur.";
  }

  if (isReservedSubdomain(normalized)) {
    return RESERVED_SUBDOMAIN_MESSAGE;
  }

  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return "Alt alan adı yalnız küçük harf, rakam ve tire içerebilir.";
  }

  return null;
}

// Firma adı ve giriş e-postası alt alan adından otomatik türetilir; admin
// sadece ad soyad, (opsiyonel) telefon ve alt alan adını girer.
function deriveCompanyName(subdomain: string): string {
  return normalizeSubdomain(subdomain)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function deriveEmail(subdomain: string): string {
  return `${normalizeSubdomain(subdomain)}@ekatalox.com`;
}

export function AdminNewTenantForm() {
  const [form, setForm] = useState<NewTenantForm>(defaultForm);
  const [message, setMessage] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    subdomain: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const subdomainMessage = form.subdomain ? getSubdomainMessage(form.subdomain) : null;
  const previewCompanyName = form.subdomain ? deriveCompanyName(form.subdomain) : "";
  const previewEmail = form.subdomain ? deriveEmail(form.subdomain) : "";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const subdomainError = getSubdomainMessage(form.subdomain);
    if (subdomainError) {
      setMessage(subdomainError);
      return;
    }

    if (form.full_name.trim().length < 2) {
      setMessage("Ad soyad zorunludur.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: deriveCompanyName(form.subdomain),
          subdomain: form.subdomain,
          plan: "start",
          whatsapp_number: form.whatsapp_number.trim(),
          tenant_admin_email: deriveEmail(form.subdomain),
          tenant_admin_full_name: form.full_name.trim(),
          is_trial: false,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Tenant oluşturulamadı.");
        return;
      }

      const created = result.tenant as TenantWithRelations;
      if (result.tenantAdmin) {
        setCreatedCredentials({
          email: result.tenantAdmin.email,
          password: result.tenantAdmin.temporaryPassword,
          subdomain: created.subdomain,
        });
      }
      setForm(defaultForm);
      setMessage("Yeni tenant oluşturuldu.");
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Ad Soyad"
            value={form.full_name}
            onChange={(event) =>
              setForm((current) => ({ ...current, full_name: event.target.value }))
            }
          />
          <Input
            placeholder="Telefon No (opsiyonel)"
            value={form.whatsapp_number}
            onChange={(event) =>
              setForm((current) => ({ ...current, whatsapp_number: event.target.value }))
            }
          />
          <div className="md:col-span-2">
            <Input
              placeholder="Alt alan adı (ör. acme-toptan)"
              value={form.subdomain}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  subdomain: event.target.value.toLowerCase(),
                }))
              }
            />
            {subdomainMessage ? (
              <p className="mt-1.5 text-xs text-rose-600">{subdomainMessage}</p>
            ) : null}
          </div>

          {form.subdomain && !subdomainMessage ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 md:col-span-2">
              <p>
                <span className="font-medium text-slate-900">Mağaza:</span>{" "}
                {form.subdomain}.ekatalox.com
              </p>
              <p className="mt-1">
                <span className="font-medium text-slate-900">Firma adı (otomatik):</span>{" "}
                {previewCompanyName}
              </p>
              <p className="mt-1">
                <span className="font-medium text-slate-900">Giriş e-postası (otomatik):</span>{" "}
                {previewEmail}
              </p>
              <p className="mt-1">
                <span className="font-medium text-slate-900">Paket:</span> Start (giriş paketi)
              </p>
            </div>
          ) : null}

          <div className="md:col-span-2">
            <p className="mb-3 text-xs text-slate-500">
              Ayrılmış kelimeler: admin, app, www, api, ekatalox, assets
            </p>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Kaydediliyor..." : "Tenant oluştur"}
              </Button>
              <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
                Vazgeç
              </Link>
            </div>
          </div>
        </form>
      </Card>

      {message ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <Modal
        open={Boolean(createdCredentials)}
        onClose={() => setCreatedCredentials(null)}
        title="Tenant admin hesabı oluşturuldu"
      >
        {createdCredentials ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-900">Giriş adresi:</span>{" "}
                {createdCredentials.email}
              </p>
              <p className="mt-2">
                <span className="font-medium text-slate-900">Geçici şifre:</span>{" "}
                {createdCredentials.password}
              </p>
              <p className="mt-2">
                <span className="font-medium text-slate-900">Panel:</span>{" "}
                app.ekatalox.com
              </p>
              <p className="mt-2">
                <span className="font-medium text-slate-900">Mağaza:</span>{" "}
                {createdCredentials.subdomain}.ekatalox.com
              </p>
            </div>

            <p className="text-sm text-amber-700">
              Bu şifre yalnız bir kez gösterilir. Lütfen şimdi kaydedin ve müşteriye WhatsApp
              üzerinden iletin.
            </p>

            <div className="flex justify-end gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Tenant listesine dön
              </Link>
              <Button variant="secondary" onClick={() => setCreatedCredentials(null)}>
                Kapat
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
