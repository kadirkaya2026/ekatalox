"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SettingsSectionHeader } from "@/components/dashboard/settings-section-header";
import {
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_PROVIDERS,
  PROVIDER_CREDENTIAL_FIELDS,
  PROVIDER_KEY_HELP,
  type PaymentProvider,
} from "@/lib/payments/providers";
import { cn } from "@/lib/utils";

export interface OnlineProviderSummary {
  provider: PaymentProvider;
  is_test: boolean;
  key_hint: string | null;
  verified_at: string | null;
  last_error: string | null;
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn("relative inline-flex h-7 w-12 shrink-0 rounded-full transition", on ? "bg-emerald-600" : "bg-slate-300")}
    >
      <span className={cn("absolute top-1 size-5 rounded-full bg-white shadow-sm transition", on ? "left-6" : "left-1")} />
    </button>
  );
}

function CheckRow({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className={cn("mt-0.5 font-bold", ok ? "text-emerald-600" : "text-amber-600")}>{ok ? "✓" : "!"}</span>
      <span className="text-slate-700">{children}</span>
    </li>
  );
}

// Ayarlar → Ödeme → Online ödeme (0185, A modeli): mağaza kendi iyzico /
// PayTR / Paynet hesabının anahtarlarını girer; para doğrudan mağazaya geçer.
export function TenantOnlinePaymentCard({
  summary,
  legalProblems,
  installmentsEnabled,
  setInstallmentsEnabled,
  paytrNotifyUrl,
  paynetEgressIp,
}: {
  summary: OnlineProviderSummary | null;
  legalProblems: string[];
  installmentsEnabled: boolean;
  setInstallmentsEnabled: (value: boolean) => void;
  paytrNotifyUrl: string;
  paynetEgressIp: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [provider, setProvider] = useState<PaymentProvider>(summary?.provider ?? "iyzico");
  const [isTest, setIsTest] = useState(summary?.is_test ?? false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const savedForThisProvider = summary?.provider === provider;
  const verified = Boolean(summary?.verified_at) && savedForThisProvider;

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/tenant/settings/online-payment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, is_test: isTest, credentials: values }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "Anahtarlar kaydedilemedi.");
        return;
      }
      setValues({});
      if (result.verified) setMessage("Anahtarlar doğrulandı ve kaydedildi.");
      else setError(`Anahtarlar kaydedildi ama doğrulanamadı: ${result.error ?? "bilinmeyen hata"}`);
      router.refresh();
    });
  }

  function remove() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/tenant/settings/online-payment", { method: "DELETE" });
      if (!response.ok) {
        setError("Bağlantı kaldırılamadı.");
        return;
      }
      setValues({});
      setMessage("Online ödeme bağlantısı kaldırıldı.");
      router.refresh();
    });
  }

  async function copyNotifyUrl() {
    try {
      await navigator.clipboard.writeText(paytrNotifyUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card className="p-5">
      <SettingsSectionHeader icon={Globe} title="Online ödeme (iyzico / PayTR / Paynet)" />
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Müşteriniz sepette &quot;Online Öde&quot;yi seçince kartıyla ödeme kuruluşunun güvenli sayfasında öder. Para
          doğrudan sizin üye işyeri hesabınıza geçer; komisyonu ve hakediş süresini kendi sözleşmeniz belirler. Kart
          bilgisi eKatalox&apos;a hiç gelmez.
        </p>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Online ödemeyi açmak için gerekenler</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            <CheckRow ok={!legalProblems.length}>
              Yasal bilgiler ve sözleşmeler{" "}
              {legalProblems.length ? (
                <>
                  eksik ({legalProblems.length} alan) ·{" "}
                  <a href="/settings/legal" className="font-semibold text-emerald-700 underline underline-offset-2">
                    Tamamla
                  </a>
                </>
              ) : (
                <span className="text-emerald-700">tamam</span>
              )}
            </CheckRow>
            <CheckRow ok={Boolean(summary?.verified_at)}>
              Ödeme kuruluşu anahtarları{" "}
              {summary?.verified_at ? (
                <span className="text-emerald-700">
                  doğrulandı ({PAYMENT_PROVIDER_LABELS[summary.provider]}
                  {summary.is_test ? ", test modu" : ""})
                </span>
              ) : summary ? (
                <span className="text-amber-700">doğrulanamadı</span>
              ) : (
                <span className="text-slate-500">girilmedi</span>
              )}
            </CheckRow>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            İkisi de tamamsa yukarıdaki &quot;Online Ödeme&quot; anahtarını açıp ödeme ayarlarını kaydedin.
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Ödeme kuruluşu</p>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_PROVIDERS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setProvider(key);
                  setValues({});
                }}
                aria-pressed={provider === key}
                className={cn(
                  "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                  provider === key
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                )}
              >
                {PAYMENT_PROVIDER_LABELS[key]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">{PROVIDER_KEY_HELP[provider]}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {PROVIDER_CREDENTIAL_FIELDS[provider].map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Lock className="size-3.5" /> {field.label}
              </span>
              <Input
                type="password"
                autoComplete="off"
                value={values[field.key] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
                placeholder={
                  savedForThisProvider
                    ? `Kayıtlı${summary?.key_hint ? ` (${summary.key_hint})` : ""} — değiştirmek için yazın`
                    : ""
                }
              />
            </label>
          ))}
        </div>

        {provider === "paytr" ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">PayTR panelinde Bildirim URL&apos;ini tanımlayın</p>
            <p className="mt-1 text-xs">
              PayTR Mağaza Paneli → Destek &amp; Kurulum → Ayarlar → Bildirim URL alanına bu adresi yapıştırın. Bu
              olmadan ödemeler siparişe &quot;Ödendi&quot; olarak işlenmez.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-2 py-1.5 text-xs">{paytrNotifyUrl}</code>
              <Button type="button" variant="secondary" onClick={copyNotifyUrl}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
        ) : null}

        {provider === "paynet" ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Paynet sabit IP izni ister</p>
            <p className="mt-1 text-xs">
              {paynetEgressIp
                ? `Paynet panelinde (veya müşteri temsilcinizden) şu IP adresine API izni verin: ${paynetEgressIp}`
                : "eKatalox'un Paynet IP adresi henüz tanımlı değil; kurulum için destekle iletişime geçin."}
            </p>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Test modu</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Açıkken kuruluşun test ortamı kullanılır, gerçek para çekilmez. Test anahtarlarıyla deneyin, sonra
              kapatıp canlı anahtarları girin.
            </p>
          </div>
          <Toggle on={isTest} onClick={() => setIsTest((value) => !value)} />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Taksit seçenekleri açık olsun</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Kapalıysa yalnız tek çekim. Taksit oranlarını kuruluşun panelinden belirlersiniz. (Ödeme ayarlarını
              kaydet ile kaydedilir.)
            </p>
          </div>
          <Toggle on={installmentsEnabled} onClick={() => setInstallmentsEnabled(!installmentsEnabled)} />
        </div>

        {summary?.last_error && !verified ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">Son doğrulama hatası: {summary.last_error}</p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6 space-y-1">
            <InlineAlert message={message} onExpire={() => setMessage(null)} />
            <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />
          </div>
          <div className="flex gap-2">
            {summary ? (
              <Button type="button" variant="secondary" disabled={pending} onClick={remove}>
                Bağlantıyı kaldır
              </Button>
            ) : null}
            <Button type="button" disabled={pending} onClick={save}>
              {pending ? "Doğrulanıyor..." : "Anahtarları kaydet ve doğrula"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
