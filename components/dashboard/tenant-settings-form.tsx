"use client";

import { useState, useTransition } from "react";
import { ShoppingCart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Profile, Tenant, TenantStorefrontSettings } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function TenantSettingsForm({
  tenant,
  profile,
  storefrontSettings,
  forcePasswordChange,
}: {
  tenant: Tenant;
  profile: Profile;
  storefrontSettings: TenantStorefrontSettings;
  forcePasswordChange?: boolean;
}) {
  const [whatsapp, setWhatsapp] = useState(tenant.whatsapp_number);
  const [discountThreshold, setDiscountThreshold] = useState(
    String(storefrontSettings.discount_threshold ?? 0),
  );
  const [discountPercentage, setDiscountPercentage] = useState(
    String(storefrontSettings.discount_percentage ?? 0),
  );
  const [isDiscountActive, setIsDiscountActive] = useState(
    storefrontSettings.is_discount_active ?? false,
  );
  const [discountConditionNote, setDiscountConditionNote] = useState(
    storefrontSettings.discount_condition_note ?? "",
  );
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [discountMessage, setDiscountMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [discountThresholdError, setDiscountThresholdError] = useState<string | null>(
    null,
  );
  const [discountPercentageError, setDiscountPercentageError] = useState<string | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const [discountPending, startDiscountTransition] = useTransition();
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

  function saveDiscountSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDiscountMessage(null);
    setDiscountThresholdError(null);
    setDiscountPercentageError(null);

    const parsedThreshold = Number(discountThreshold);
    const parsedPercentage = Number(discountPercentage);

    if (!Number.isFinite(parsedThreshold) || parsedThreshold < 0) {
      setDiscountThresholdError("Baraj tutarı sıfırdan küçük olamaz.");
      return;
    }

    if (
      !Number.isFinite(parsedPercentage) ||
      parsedPercentage < 0 ||
      parsedPercentage > 100
    ) {
      setDiscountPercentageError("İskonto oranı 0 ile 100 arasında olmalıdır.");
      return;
    }

    if (isDiscountActive && parsedThreshold <= 0) {
      setDiscountThresholdError(
        "Kampanyayı yayına almak için baraj tutarı 0'dan büyük olmalıdır.",
      );
      return;
    }

    if (isDiscountActive && parsedPercentage <= 0) {
      setDiscountPercentageError(
        "Kampanyayı yayına almak için iskonto oranı 0'dan büyük olmalıdır.",
      );
      return;
    }

    startDiscountTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discount_threshold: parsedThreshold,
          discount_percentage: parsedPercentage,
          is_discount_active: isDiscountActive,
          discount_condition_note: discountConditionNote.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setDiscountMessage(result.error ?? "İskonto ayarları kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings) {
        setDiscountThreshold(String(result.storefrontSettings.discount_threshold ?? 0));
        setDiscountPercentage(
          String(result.storefrontSettings.discount_percentage ?? 0),
        );
        setIsDiscountActive(Boolean(result.storefrontSettings.is_discount_active));
      }

      setDiscountMessage("Sepet ve iskonto ayarları kaydedildi.");
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
            <dt className="text-slate-500">Paket limiti</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {tenant.max_product_limit} ürün
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
            Müşterilerinizin sepetindeki ürünleri WhatsApp ile bu numaraya yönlendirilir.
          </p>
          <form onSubmit={save} className="mt-5 space-y-4">
            <Input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          </form>
        </Card>

        <Card className="overflow-hidden border-slate-200 p-0">
          <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_42%),linear-gradient(135deg,#f8fafc_0%,#ffffff_45%,#ecfeff_100%)] px-5 py-5">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <ShoppingCart className="size-5" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  <Sparkles className="size-3.5" />
                  Sepet & İskonto Ayarları
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">
                  Barajlı akıllı iskonto motoru
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Esnafı sepette daha fazla ürün eklemeye teşvik eden barajı ve indirim
                  oranını buradan yönetin. Sistem storefront ve WhatsApp sipariş
                  metnine otomatik yansır.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={saveDiscountSettings} className="space-y-5 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Baraj tutarı
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={discountThreshold}
                  onChange={(event) => {
                    setDiscountThreshold(event.target.value);
                    setDiscountMessage(null);
                    setDiscountThresholdError(null);
                  }}
                  placeholder="1000"
                />
                {discountThresholdError ? (
                  <p className="mt-2 text-sm text-amber-700">{discountThresholdError}</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">
                    Ham satış para birimiyle girin. Örn: 1000 USD.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  İskonto oranı (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  inputMode="decimal"
                  value={discountPercentage}
                  onChange={(event) => {
                    setDiscountPercentage(event.target.value);
                    setDiscountMessage(null);
                    setDiscountPercentageError(null);
                  }}
                  placeholder="10"
                />
                {discountPercentageError ? (
                  <p className="mt-2 text-sm text-amber-700">{discountPercentageError}</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">
                    Baraj geçildiğinde uygulanacak indirim yüzdesi.
                  </p>
                )}
              </div>
            </div>


            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                İskonto şart notu <span className="text-slate-400 font-normal">(opsiyonel)</span>
              </label>
              <textarea
                rows={3}
                maxLength={300}
                value={discountConditionNote}
                onChange={(event) => {
                  setDiscountConditionNote(event.target.value);
                  setDiscountMessage(null);
                }}
                placeholder="Örn: Bu indirim sadece nakit alımlarda geçerlidir."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Müşteri sepette bu notu görür; WhatsApp sipariş metnine de eklenir.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Kampanyayı aktif et</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Aktifken storefront’ta canlı baraj mesajı görünür ve uygun sepetlere
                    otomatik iskonto uygulanır.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsDiscountActive((current) => !current);
                    setDiscountMessage(null);
                  }}
                  aria-pressed={isDiscountActive}
                  className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                    isDiscountActive ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
                      isDiscountActive ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-6">
                {discountMessage ? (
                  <p className="text-sm text-emerald-700">{discountMessage}</p>
                ) : null}
              </div>
              <Button type="submit" disabled={discountPending}>
                {discountPending ? "Kaydediliyor..." : "İskonto ayarlarını kaydet"}
              </Button>
            </div>
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
