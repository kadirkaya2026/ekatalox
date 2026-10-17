"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, Globe, Landmark, type LucideIcon } from "lucide-react";
import {
  TenantOnlinePaymentCard,
  type OnlineProviderSummary,
} from "@/components/dashboard/tenant-online-payment-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SettingsSectionHeader } from "@/components/dashboard/settings-section-header";
import { hasPlanFeature, type TenantPlan } from "@/lib/billing/plans";
import {
  formatIban,
  isValidIban,
  normalizeIban,
  resolvePaymentMethods,
} from "@/lib/storefront/payment-methods";
import type { PaymentMethodToggles, TenantStorefrontSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

type MethodKey = keyof PaymentMethodToggles;

const METHODS: Array<{ key: MethodKey; title: string; body: string; icon: LucideIcon }> = [
  { key: "cash", title: "Nakit", body: "Teslimatta veya elden ödeme.", icon: Banknote },
  {
    key: "transfer",
    title: "Havale / EFT",
    body: "Müşteri IBAN'ınıza gönderir; IBAN ve sipariş no fişin altında yazar.",
    icon: Landmark,
  },
  {
    key: "card",
    title: "Kredi Kartı",
    body: "Kartla ödeme (POS). Taksit ve vade farkı Ödeme Kampanyaları'ndan.",
    icon: CreditCard,
  },
  {
    key: "online",
    title: "Online Ödeme",
    body: "Kendi iyzico / PayTR / Paynet hesabınızla sitede kartla ödeme. Ayarları aşağıda.",
    icon: Globe,
  },
];

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50",
        on ? "bg-emerald-600" : "bg-slate-300",
      )}
    >
      <span className={cn("absolute top-1 size-5 rounded-full bg-white shadow-sm transition", on ? "left-6" : "left-1")} />
    </button>
  );
}

export function TenantPaymentMethodsForm({
  storefrontSettings,
  plan,
  legalProblems,
  onlineProvider,
  onlineProblems,
  paytrNotifyUrl,
  paynetEgressIp,
}: {
  storefrontSettings: TenantStorefrontSettings;
  plan: TenantPlan;
  /** Yasal Bilgiler eksikleri (0178); boşsa tamam. */
  legalProblems: string[];
  /** Online ödeme (0185): kayıtlı sağlayıcı özeti (anahtarsız) ve açma engelleri. */
  onlineProvider: OnlineProviderSummary | null;
  onlineProblems: string[];
  paytrNotifyUrl: string;
  paynetEgressIp: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [methods, setMethods] = useState<PaymentMethodToggles>(() => resolvePaymentMethods(storefrontSettings));
  const [iban, setIban] = useState(formatIban(storefrontSettings.bank_iban));
  const [holder, setHolder] = useState(storefrontSettings.bank_account_holder ?? "");
  const [bankName, setBankName] = useState(storefrontSettings.bank_name ?? "");

  const online = storefrontSettings.online_payment_settings ?? {};
  const [installmentsEnabled, setInstallmentsEnabled] = useState(online.installments_enabled ?? true);
  const canUseOnline = hasPlanFeature(plan, "online_payment");
  const onlineReady = onlineProblems.length === 0;

  function toggle(key: MethodKey) {
    if (key === "online" && !onlineReady && !methods.online) return;
    setMethods((current) => ({ ...current, [key]: !current[key] }));
    setMessage(null);
    setError(null);
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!methods.cash && !methods.transfer && !methods.card && !(methods.online && onlineReady)) {
      setError("En az bir ödeme yöntemi açık olmalı.");
      return;
    }
    const normalizedIban = normalizeIban(iban);
    if (normalizedIban && !isValidIban(normalizedIban)) {
      setError("IBAN geçersiz görünüyor. TR ile başlayan 26 karakterlik IBAN'ı kontrol edin.");
      return;
    }
    if (methods.transfer && (!normalizedIban || !holder.trim())) {
      setError("Havale / EFT'yi açmak için IBAN ve hesap sahibinin adını girin.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/tenant/settings/payment-methods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_methods: { ...methods, online: methods.online && onlineReady },
          bank_iban: normalizedIban || null,
          bank_account_holder: holder.trim() || null,
          bank_name: bankName.trim() || null,
          ...(canUseOnline
            ? {
                online_payment_settings: {
                  provider: onlineProvider?.provider ?? null,
                  installments_enabled: installmentsEnabled,
                  commission_to_customer: online.commission_to_customer ?? false,
                },
              }
            : {}),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "Ödeme ayarları kaydedilemedi.");
        return;
      }
      setMessage("Ödeme ayarları kaydedildi.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card className="p-5">
        <SettingsSectionHeader icon={CreditCard} title="Ödeme yöntemleri" />
        <p className="mb-4 text-sm text-slate-500">
          Müşterileriniz sepette yalnız açık olan yöntemleri görür. İstediğiniz kadarını açabilirsiniz.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {METHODS.map((method) => {
            const Icon = method.icon;
            const isOnline = method.key === "online";
            const on = methods[method.key];
            return (
              <div
                key={method.key}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-2xl border p-4",
                  on ? "border-emerald-300 bg-emerald-50/60" : "border-slate-200 bg-white",
                )}
              >
                <div className="flex gap-3">
                  <Icon className={cn("mt-0.5 size-5 shrink-0", on ? "text-emerald-700" : "text-slate-500")} />
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      {method.title}
                      {isOnline && !onlineReady ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                          {canUseOnline ? "Kurulum gerekli" : "Kurumsal"}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{method.body}</p>
                  </div>
                </div>
                <Toggle on={on} onClick={() => toggle(method.key)} disabled={isOnline && !onlineReady && !on} />
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <SettingsSectionHeader icon={Landmark} title="Havale / EFT bilgileri" />
        <p className="mb-4 text-sm text-slate-500">
          Müşteri Havale / EFT seçerse bu bilgiler sepette ve sipariş fişinin en altında, sipariş numarasıyla
          birlikte yazar.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">IBAN</span>
            <Input
              value={iban}
              onChange={(event) => {
                setIban(event.target.value.toUpperCase());
                setError(null);
              }}
              onBlur={() => setIban(formatIban(iban))}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              inputMode="text"
              autoComplete="off"
              className="font-mono tracking-wide"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Hesap sahibi (ad soyad / ünvan)</span>
            <Input value={holder} onChange={(event) => setHolder(event.target.value)} placeholder="Örn. Kadir Kaya" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Banka <span className="font-normal text-slate-400">(opsiyonel)</span>
            </span>
            <Input value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Örn. Ziraat Bankası" />
          </label>
        </div>
      </Card>

      {canUseOnline ? (
        <TenantOnlinePaymentCard
          summary={onlineProvider}
          legalProblems={legalProblems}
          installmentsEnabled={installmentsEnabled}
          setInstallmentsEnabled={setInstallmentsEnabled}
          paytrNotifyUrl={paytrNotifyUrl}
          paynetEgressIp={paynetEgressIp}
        />
      ) : (
        <Card className="p-5">
          <SettingsSectionHeader icon={Globe} title="Online ödeme (iyzico / PayTR / Paynet)" />
          <p className="text-sm text-slate-500">
            Online ödeme Kurumsal pakette sunulur. Nakit, Havale / EFT ve Kredi Kartı tüm paketlerde kullanılabilir.
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-6 space-y-1">
          <InlineAlert message={message} onExpire={() => setMessage(null)} />
          <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor..." : "Ödeme ayarlarını kaydet"}
        </Button>
      </div>
    </form>
  );
}
