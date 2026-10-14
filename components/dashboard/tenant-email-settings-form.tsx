"use client";

import { useState, useTransition } from "react";
import { Lock, Mail, Send, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SettingsSectionHeader } from "@/components/dashboard/settings-section-header";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function patch(body: Record<string, unknown>) {
  const response = await fetch("/api/tenant/settings/email", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "Kaydedilemedi.");
  return result as { contact_email: string | null; order_email_enabled: boolean };
}

export function TenantEmailSettingsForm({
  initialEmail,
  initialOrderEmailEnabled,
  paidPlan,
  planName,
  loginEmail,
  upgradeHref,
}: {
  initialEmail: string;
  initialOrderEmailEnabled: boolean;
  paidPlan: boolean;
  planName: string;
  loginEmail: string | null;
  upgradeHref: string;
}) {
  const [savedEmail, setSavedEmail] = useState(initialEmail);
  const [email, setEmail] = useState(initialEmail);
  const [enabled, setEnabled] = useState(initialOrderEmailEnabled);
  const [pending, startTransition] = useTransition();
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmed = email.trim().toLowerCase();
  const dirty = trimmed !== savedEmail;
  const valid = EMAIL_RE.test(trimmed);
  const active = paidPlan && enabled && Boolean(savedEmail);

  function saveEmail(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (!valid) {
      setError("Geçerli bir e-posta adresi yazın.");
      return;
    }
    const hadEmail = Boolean(savedEmail);
    startTransition(async () => {
      try {
        const result = await patch({ contact_email: trimmed });
        setSavedEmail(result.contact_email ?? "");
        setEmail(result.contact_email ?? "");
        setMessage(hadEmail ? "Bildirim adresi güncellendi." : "Bildirim adresi eklendi.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kaydedilemedi.");
      }
    });
  }

  function toggle() {
    if (!paidPlan || pending) return;
    const next = !enabled;
    setEnabled(next);
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await patch({ order_email_enabled: next });
        setMessage(next ? "Her yeni siparişte e-posta gelecek." : "Sipariş e-postaları kapatıldı.");
      } catch (e) {
        setEnabled(!next);
        setError(e instanceof Error ? e.message : "Kaydedilemedi.");
      }
    });
  }

  async function sendTest() {
    setTesting(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/tenant/settings/email/test", { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Deneme e-postası gönderilemedi.");
      setMessage(`Deneme e-postası ${result.to} adresine gönderildi. Gelen kutusunda yoksa Spam klasörüne bakın.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deneme e-postası gönderilemedi.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <SettingsSectionHeader icon={Mail} title="Bildirim e-posta adresi" />
        <p className="mb-4 text-sm text-slate-500">
          Sipariş e-postaları ve hesap bildirimleri bu adrese gider. Kayıt olurken verdiğiniz adres burada yazılıdır;
          dilediğiniz zaman değiştirebilirsiniz.
          {loginEmail ? (
            <> Panele giriş e-postanız (<span className="font-medium text-slate-700">{loginEmail}</span>) bundan etkilenmez.</>
          ) : null}
        </p>
        <form onSubmit={saveEmail} className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="ornek@firmaniz.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Bildirim e-posta adresi"
            />
            {!savedEmail ? (
              <p className="mt-1.5 text-xs text-amber-700">Kayıtlı bildirim adresi yok; sipariş e-postası gönderilemez.</p>
            ) : null}
          </div>
          <Button type="submit" disabled={pending || !dirty || !trimmed}>
            {savedEmail ? "Adresi güncelle" : "Adresi ekle"}
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <SettingsSectionHeader icon={ShoppingBag} title="Her yeni siparişte e-posta" />
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm text-slate-500">
            Müşteriniz sipariş verdiğinde müşteri bilgileri, ürünler ve toplam tutar e-postanıza da gelir. WhatsApp&apos;a
            gelen PDF fiş aynen devam eder.
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={paidPlan && enabled}
            aria-label="Her yeni siparişte e-posta"
            onClick={toggle}
            disabled={!paidPlan || pending}
            className={cn(
              "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition",
              paidPlan && enabled ? "bg-emerald-600" : "bg-slate-300",
              !paidPlan ? "cursor-not-allowed opacity-60" : "",
            )}
          >
            <span
              className={cn(
                "inline-block size-5 rounded-full bg-white shadow transition",
                paidPlan && enabled ? "translate-x-6" : "translate-x-1",
              )}
            />
          </button>
        </div>

        {!paidPlan ? (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm text-amber-900">
              <Lock className="mt-0.5 size-4 shrink-0" />
              Her siparişte e-posta ücretli paketlerde açılır. Şu anki paketiniz: {planName}. Ücretsiz planda yalnız ilk
              siparişinizde bir kez e-posta gelir.
            </p>
            <a
              href={upgradeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Sparkles className="size-4" /> Paketimi yükselt
            </a>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              {active ? (
                <>
                  Siparişler <span className="font-semibold text-slate-900">{savedEmail}</span> adresine gelecek.
                </>
              ) : !savedEmail ? (
                "Önce yukarıdan bildirim adresini ekleyin."
              ) : (
                "Sipariş e-postaları kapalı."
              )}
            </p>
            <Button variant="secondary" onClick={sendTest} disabled={testing || !savedEmail}>
              <Send className="mr-2 size-4" /> {testing ? "Gönderiliyor…" : "Deneme e-postası gönder"}
            </Button>
          </div>
        )}
      </Card>

      <div className="space-y-2">
        <InlineAlert message={message} onExpire={() => setMessage(null)} duration={7000} />
        <InlineAlert message={error} tone="error" onExpire={() => setError(null)} duration={7000} />
      </div>
    </div>
  );
}
