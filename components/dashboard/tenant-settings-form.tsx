"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { formatPlanSummary } from "@/lib/billing/plans";
import type { Profile, Tenant } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function SettingsToggle({
  pressed,
  disabled,
  onToggle,
  label,
}: {
  pressed: boolean;
  disabled?: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={label}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 rounded-full transition",
        pressed ? "bg-emerald-600" : "bg-slate-300",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-6 rounded-full bg-white shadow transition",
          pressed ? "left-5" : "left-0.5",
        )}
      />
    </button>
  );
}

function CustomDomainSettings({
  tenant,
}: {
  tenant: Tenant;
}) {
  const [customDomain, setCustomDomain] = useState(tenant.custom_domain ?? "");
  const [savedCustomDomain, setSavedCustomDomain] = useState(tenant.custom_domain);
  const [domainMessage, setDomainMessage] = useState<string | null>(null);
  const [domainPending, startDomainTransition] = useTransition();

  function saveCustomDomain(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDomainMessage(null);

    startDomainTransition(async () => {
      const response = await fetch("/api/tenant/domain", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custom_domain: customDomain.trim() || null,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setDomainMessage(result.error ?? "Özel alan adı kaydedilemedi.");
        return;
      }

      const nextDomain = (result.tenant?.custom_domain as string | null | undefined) ?? null;
      setSavedCustomDomain(nextDomain);
      setCustomDomain(nextDomain ?? "");
      setDomainMessage(
        nextDomain
          ? "Özel alan adı kaydedildi. DNS ayarlarını tamamladıktan sonra vitrin bu adresten açılır."
          : "Özel alan adı kaldırıldı.",
      );
    });
  }

  return (
    <form onSubmit={saveCustomDomain} className="mt-3 space-y-3">
      <Input
        value={customDomain}
        onChange={(event) => {
          setCustomDomain(event.target.value);
          setDomainMessage(null);
        }}
        placeholder="katalog.firmaniz.com"
        disabled={domainPending}
      />
      <p className="text-xs leading-5 text-slate-500">
        DNS panelinizde alan adınız için CNAME kaydı oluşturun ve hedef olarak{" "}
        <span className="font-medium text-slate-700">cname.vercel-dns.com</span> veya destek
        ekibinin paylaştığı hedefi kullanın. SSL ve doğrulama tamamlandıktan sonra vitrin bu
        adresten yayına alınır.
      </p>
      {savedCustomDomain ? (
        <p className="text-xs font-medium text-emerald-700">
          Aktif kayıt: {savedCustomDomain}
        </p>
      ) : null}
      <Button type="submit" disabled={domainPending}>
        {domainPending ? "Kaydediliyor..." : "Özel alan adını kaydet"}
      </Button>
      {domainMessage ? (
        <p
          className={cn(
            "text-sm",
            domainMessage.includes("kaydedilemedi") || domainMessage.includes("kaldır")
              ? domainMessage.includes("kaldırıldı")
                ? "text-emerald-700"
                : "text-rose-600"
              : "text-emerald-700",
          )}
        >
          {domainMessage}
        </p>
      ) : null}
    </form>
  );
}

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
  const [isWhatsappOrderDirect, setIsWhatsappOrderDirect] = useState(
    tenant.is_whatsapp_order_direct ?? true,
  );
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
        body: JSON.stringify({
          whatsapp_number: whatsapp,
          is_whatsapp_order_direct: isWhatsappOrderDirect,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "Ayar kaydedilemedi.");
        return;
      }
      setMessage("Sipariş yönlendirme ayarları güncellendi.");
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

  const now = new Date();
  const startDate = new Date(tenant.created_at);
  const expiryDate = new Date(startDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / 86_400_000);
  const nearExpiry = daysLeft <= 90 && daysLeft > 0;

  const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Üyelik bilgileri</h2>
        <dl className="mt-5 space-y-4 text-sm text-slate-600">
          <div>
            <dt className="text-slate-500">Firma</dt>
            <dd className="mt-1 font-medium text-slate-900">{tenant.company_name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Alt alan adı</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {tenant.subdomain}.ekatalox.com
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Özel alan adı</dt>
            <dd className="mt-1">
              <PlanFeatureGate
                feature="custom_domain"
                plan={tenant.plan ?? "baslangic"}
                companyName={tenant.company_name}
              >
                <CustomDomainSettings tenant={tenant} />
              </PlanFeatureGate>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Paket limiti</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {formatPlanSummary(tenant.plan ?? "baslangic")}
            </dd>
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
              {profile.role === "tenant_admin" ? "Yönetici" : profile.role}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Üyelik başlangıcı</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {dateFormatter.format(startDate)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Üyelik bitiş tarihi</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {dateFormatter.format(expiryDate)}
            </dd>
          </div>
        </dl>
        {nearExpiry ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Paket tarihinizin bitmesine çok az kaldı, yenilemek için iletişime geçin.
          </div>
        ) : null}
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">Sipariş yönlendirme</h2>
          <p className="mt-1 text-sm text-slate-600">
            Müşteriler sepetten siparişi WhatsApp ile iletir. Numara ve yönlendirme modunu buradan
            yönetin.
          </p>
          <form onSubmit={save} className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  Siparişler kayıtlı WhatsApp numarasına yönlendirilsin
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Kapalıyken müşteri WhatsApp&apos;ta alıcıyı kendisi seçer; mesaj önceden doldurulur.
                </p>
              </div>
              <SettingsToggle
                label="Siparişler kayıtlı WhatsApp numarasına yönlendirilsin"
                pressed={isWhatsappOrderDirect}
                disabled={pending}
                onToggle={() => setIsWhatsappOrderDirect((current) => !current)}
              />
            </div>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
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
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Yeni şifre tekrar"
              value={passwordRepeat}
              onChange={(e) => setPasswordRepeat(e.target.value)}
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
