"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, Globe, Landmark, Lock, type LucideIcon } from "lucide-react";
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
    body: "iyzico / PayTR ile sitede kartla ödeme. Entegrasyon tamamlanınca açılacak.",
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
}: {
  storefrontSettings: TenantStorefrontSettings;
  plan: TenantPlan;
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
  const [provider, setProvider] = useState<"iyzico" | "paytr" | null>(online.provider ?? null);
  const [installmentsEnabled, setInstallmentsEnabled] = useState(online.installments_enabled ?? true);
  const [commissionToCustomer, setCommissionToCustomer] = useState(online.commission_to_customer ?? false);
  const canUseOnline = hasPlanFeature(plan, "online_payment");

  function toggle(key: MethodKey) {
    if (key === "online") return;
    setMethods((current) => ({ ...current, [key]: !current[key] }));
    setMessage(null);
    setError(null);
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!methods.cash && !methods.transfer && !methods.card) {
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
          payment_methods: { ...methods, online: false },
          bank_iban: normalizedIban || null,
          bank_account_holder: holder.trim() || null,
          bank_name: bankName.trim() || null,
          ...(canUseOnline
            ? {
                online_payment_settings: {
                  provider,
                  installments_enabled: installmentsEnabled,
                  commission_to_customer: commissionToCustomer,
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
                      {isOnline ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                          Yakında
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{method.body}</p>
                  </div>
                </div>
                <Toggle on={on} onClick={() => toggle(method.key)} disabled={isOnline} />
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

      <Card className="p-5">
        <SettingsSectionHeader icon={Globe} title="Online ödeme (iyzico / PayTR)" />
        {canUseOnline ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Sanal POS entegrasyonu tamamlandığında buraya sağlayıcınızın API anahtarlarını girip online ödemeyi
              açabileceksiniz. Tercihlerinizi şimdiden kaydedebilirsiniz.
            </p>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Sağlayıcı</p>
              <div className="flex flex-wrap gap-2">
                {(["iyzico", "paytr"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setProvider((current) => (current === key ? null : key))}
                    aria-pressed={provider === key}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                      provider === key
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                    )}
                  >
                    {key === "iyzico" ? "iyzico" : "PayTR"}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Lock className="size-3.5" /> API anahtarı
                </span>
                <Input disabled placeholder="Entegrasyon tamamlanınca açılacak" />
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Lock className="size-3.5" /> Gizli anahtar
                </span>
                <Input disabled placeholder="Entegrasyon tamamlanınca açılacak" />
              </label>
            </div>
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Taksit seçenekleri açık olsun</p>
                <p className="mt-0.5 text-xs text-slate-500">Kapalıysa online ödemede yalnız tek çekim sunulur.</p>
              </div>
              <Toggle on={installmentsEnabled} onClick={() => setInstallmentsEnabled((value) => !value)} />
            </div>
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Komisyon müşteriye yansıtılsın</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Açıksa sağlayıcının taksit/komisyon farkı sepet toplamına eklenir; kapalıysa siz üstlenirsiniz.
                </p>
              </div>
              <Toggle on={commissionToCustomer} onClick={() => setCommissionToCustomer((value) => !value)} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Online ödeme (iyzico / PayTR) Kurumsal pakette sunulacak. Nakit, Havale / EFT ve Kredi Kartı tüm
            paketlerde kullanılabilir.
          </p>
        )}
      </Card>

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
