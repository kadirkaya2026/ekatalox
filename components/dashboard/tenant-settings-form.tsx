"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Profile, Tenant } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function TenantSettingsForm({
  tenant,
  profile,
  forcePasswordChange,
}: {
  tenant: Tenant;
  profile: Profile;
  forcePasswordChange?: boolean;
}) {
  const [whatsapp, setWhatsapp] = useState(tenant.whatsapp_number);
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();
  const supabase = createSupabaseBrowserClient();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp_number: whatsapp }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Ayar kaydedilemedi.");
        return;
      }

      setMessage("WhatsApp yönlendirme numarası güncellendi.");
    });
  }

  function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);

    if (!supabase) {
      setPasswordMessage("Supabase yapılandırması eksik.");
      return;
    }

    if (password.length < 8) {
      setPasswordMessage("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    if (password !== passwordRepeat) {
      setPasswordMessage("Şifre tekrar alanı eşleşmiyor.");
      return;
    }

    startPasswordTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setPasswordMessage(error.message);
        return;
      }

      const response = await fetch("/api/tenant/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        setPasswordMessage(result.error ?? "Şifre güncellenemedi.");
        return;
      }

      setPassword("");
      setPasswordRepeat("");
      setPasswordMessage("Şifreniz güncellendi.");
      if (forcePasswordChange) {
        window.location.href = "https://app.ekatalox.com/";
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Tenant bilgileri</h2>
        <dl className="mt-5 space-y-4 text-sm text-slate-600">
          <div>
            <dt className="text-slate-500">Firma</dt>
            <dd className="mt-1 font-medium text-slate-900">{tenant.company_name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Alt alan adı</dt>
            <dd className="mt-1 font-medium text-slate-900">{tenant.subdomain}.ekatalox.com</dd>
          </div>
          <div>
            <dt className="text-slate-500">Paket limiti</dt>
            <dd className="mt-1 font-medium text-slate-900">{tenant.max_product_limit} ürün</dd>
          </div>
          <div>
            <dt className="text-slate-500">Durum</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {tenant.status === "active" ? "Aktif" : "Askıda"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Rol</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {profile.role === "tenant_admin" ? "Tenant Admin" : profile.role}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">Sipariş yönlendirme</h2>
          <p className="mt-1 text-sm text-slate-600">
            Storefront sepetindeki WhatsApp siparişleri bu numaraya yönlendirilir.
          </p>
          <form onSubmit={save} className="mt-5 space-y-4">
            <Input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            {message ? (
              <p className="text-sm text-emerald-700">{message}</p>
            ) : null}
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">Şifre değiştir</h2>
          <p className="mt-1 text-sm text-slate-600">
            {forcePasswordChange
              ? "İlk giriş güvenliği için geçici şifrenizi hemen değiştirin."
              : "Panel giriş şifrenizi buradan güncelleyebilirsiniz."}
          </p>
          <form onSubmit={changePassword} className="mt-5 space-y-4">
            <Input
              type="password"
              placeholder="Yeni şifre"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Input
              type="password"
              placeholder="Yeni şifre tekrar"
              value={passwordRepeat}
              onChange={(event) => setPasswordRepeat(event.target.value)}
            />
            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? "Şifre güncelleniyor..." : "Şifreyi güncelle"}
            </Button>
            {passwordMessage ? (
              <p className="text-sm text-emerald-700">{passwordMessage}</p>
            ) : null}
          </form>
        </Card>
      </div>
    </div>
  );
}