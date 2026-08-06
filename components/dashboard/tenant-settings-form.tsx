"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  buildPlanChangeHref,
  formatEffectiveProductLimit,
  formatProductLimit,
  getPlanLabel,
  getPlanRank,
  isLegacyPlan,
  LEGACY_PLAN_OPTIONS,
  NEW_PLAN_OPTIONS,
  PLAN_PRICING,
} from "@/lib/billing/plans";
import { resolveMembershipPeriod } from "@/lib/billing/membership";
import { isTrialTenant } from "@/lib/billing/trial";
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

function PlanChangeSection({ tenant }: { tenant: Tenant }) {
  const currentPlan = tenant.plan ?? "baslangic";
  const onTrial = isTrialTenant(tenant);
  // Bir tenant kendi track'i (eski veya yeni plan seti) içinde üst pakete
  // geçer; deneme hesabı her zaman yeni plan setinden başlar.
  const track = onTrial || !isLegacyPlan(currentPlan) ? NEW_PLAN_OPTIONS : LEGACY_PLAN_OPTIONS;
  // Deneme hesabı tüm paketleri seçebilir; normal hesap yalnızca üst
  // paketlere geçiş talep edebilir (alt pakete geçiş sunulmaz).
  const targetPlans = track.filter((plan) =>
    onTrial ? true : getPlanRank(plan.id) > getPlanRank(currentPlan),
  );

  return (
    <div className="mt-1 space-y-3">
      <p className="font-medium text-slate-900">
        {getPlanLabel(currentPlan)} •{" "}
        {formatEffectiveProductLimit(currentPlan, tenant.product_limit_addon)} ürün
        {tenant.product_limit_addon ? (
          <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            +{formatProductLimit(tenant.product_limit_addon)} hediye
          </span>
        ) : null}
        {onTrial ? (
          <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            Deneme sürümü
          </span>
        ) : null}
      </p>
      {targetPlans.length === 0 ? (
        <p className="text-xs text-slate-500">
          En üst paketi kullanıyorsunuz.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            {onTrial
              ? "Paket seçin, WhatsApp üzerinden bize iletin; hesabınızı aynı gün seçtiğiniz pakete geçirelim."
              : "Üst pakete geçmek için seçim yapın; talebiniz WhatsApp üzerinden bize iletilir."}
          </p>
          {targetPlans.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{plan.name}</p>
                <p className="text-xs text-slate-500">
                  {PLAN_PRICING[plan.id].price} {PLAN_PRICING[plan.id].unit} •{" "}
                  {formatProductLimit(plan.maxProductLimit)} ürün
                </p>
              </div>
              <a
                href={buildPlanChangeHref({
                  companyName: tenant.company_name,
                  subdomain: tenant.subdomain,
                  currentPlan,
                  targetPlan: plan.id,
                  isTrial: onTrial,
                })}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                WhatsApp ile talep et
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type TenantSettingsTab = "membership" | "orders" | "password";

const TENANT_SETTINGS_TABS: Array<{ key: TenantSettingsTab; label: string }> = [
  { key: "membership", label: "Üyelik Bilgileri" },
  { key: "orders", label: "Sipariş Yönlendirme" },
  { key: "password", label: "Şifre Değiştir" },
];

export function TenantSettingsForm({
  tenant,
  profile,
  forcePasswordChange,
}: {
  tenant: Tenant;
  profile: Profile;
  forcePasswordChange?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TenantSettingsTab>(
    forcePasswordChange ? "password" : "membership",
  );
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
  const router = useRouter();

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
      router.refresh();
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
  // Deneme hesabında 14 günlük pencere, paket onaylıysa kayıtlı dönem,
  // eski kayıtlarda created_at + 1 yıl gösterilir.
  const membership = resolveMembershipPeriod(tenant);
  const startDate = membership.start;
  const expiryDate = membership.end;
  const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / 86_400_000);
  // Deneme hesabının geri sayım uyarısı panel banner'ında zaten var.
  const nearExpiry = !membership.isTrial && daysLeft <= 90 && daysLeft > 0;

  const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap border-b border-slate-100">
        {TENANT_SETTINGS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition sm:px-5",
              activeTab === tab.key
                ? "border-emerald-500 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {activeTab === "membership" ? (
          <div>
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
                <dt className="text-slate-500">Paket</dt>
                <dd>
                  <PlanChangeSection tenant={tenant} />
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
          </div>
        ) : null}

        {activeTab === "orders" ? (
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Sipariş yönlendirme</h2>
            <p className="mt-1 text-sm text-slate-600">
              Müşteriler sepetten siparişi WhatsApp ile iletir. Numara ve yönlendirme modunu
              buradan yönetin.
            </p>
            <form onSubmit={save} className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    Siparişler kayıtlı WhatsApp numarasına yönlendirilsin
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Kapalıyken müşteri WhatsApp&apos;ta alıcıyı kendisi seçer; mesaj önceden
                    doldurulur.
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
          </div>
        ) : null}

        {activeTab === "password" ? (
          <div>
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
          </div>
        ) : null}
      </div>
    </Card>
  );
}
