"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SettingsSectionHeader } from "@/components/dashboard/settings-section-header";
import {
  CART_FORM_FIELD_KEYS,
  CART_FORM_LABEL_MAX_LENGTH,
  resolveCartFormConfig,
  type CartFormConfig,
  type CartFormFieldKey,
} from "@/lib/storefront/cart-form-config";
import type { TenantBusinessType, TenantStorefrontSettings } from "@/lib/types";

// Panelde gösterilen alan adları ve vitrindeki varsayılan etiketler (TR).
// Vitrin başka dildeyse varsayılan etiket o dilde gelir; bayi özel etiket
// yazarsa her dilde aynen o metin görünür.
const FIELD_META: Record<
  CartFormFieldKey,
  { title: string; defaultLabel: string; hint: string }
> = {
  customer_name: {
    title: "Müşteri / Cari Adı",
    defaultLabel: "Müşteri Adı / Cari Adı",
    hint: "Siparişi kimin verdiğini gösterir; fişe ve WhatsApp mesajına yazılır.",
  },
  customer_phone: {
    title: "Telefon",
    defaultLabel: "Telefon Numarası",
    hint: "Görünürse müşteri kaydı ve sipariş takibi telefonla eşleşir. Girilen numara biçim kontrolünden geçer.",
  },
  customer_address: {
    title: "Adres",
    defaultLabel: "Teslimat Adresi",
    hint: "Teslimat yapmayan işletmelerde isteğe bağlı bırakılabilir veya tamamen gizlenebilir.",
  },
  order_note: {
    title: "Sipariş Notu",
    defaultLabel: "Sipariş Notu",
    hint: "Müşterinin serbest metin notu.",
  },
};

export function TenantCartFormSettings({
  initialStorefrontSettings,
  businessType,
}: {
  initialStorefrontSettings: TenantStorefrontSettings;
  businessType: TenantBusinessType | null;
}) {
  const [config, setConfig] = useState<CartFormConfig>(() =>
    resolveCartFormConfig(initialStorefrontSettings.cart_form_config, businessType),
  );
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function updateField(key: CartFormFieldKey, patch: Partial<CartFormConfig[CartFormFieldKey]>) {
    setConfig((current) => {
      const next = { ...current[key], ...patch };
      // Gizlenen alan zorunlu kalamaz.
      if (!next.is_visible) next.is_required = false;
      return { ...current, [key]: next };
    });
    setMessage(null);
    setError(null);
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_form_config: config }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(result.error ?? "Sepet ayarları kaydedilemedi.");
        return;
      }

      setMessage("Sepet ayarları kaydedildi. Vitrin birkaç saniye içinde güncellenir.");
      router.refresh();
    });
  }

  function resetToDefaults() {
    setConfig(resolveCartFormConfig(null, businessType));
    setMessage(null);
    setError(null);
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card className="space-y-5 p-6">
        <SettingsSectionHeader icon={ClipboardList} title="Sipariş formu alanları" />
        <p className="-mt-2 text-sm text-muted-foreground">
          Müşteri sepeti onaylarken hangi bilgiler istensin? Her alan için görünürlük, zorunluluk
          ve vitrinde görünecek etiketi belirleyin.
        </p>

        <div className="divide-y divide-border rounded-2xl border border-border">
          {CART_FORM_FIELD_KEYS.map((key) => {
            const field = config[key];
            const meta = FIELD_META[key];
            return (
              <div key={key} className="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{meta.title}</p>
                    <p className="text-xs text-muted-foreground">{meta.hint}</p>
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">
                      Vitrinde görünecek etiket
                    </span>
                    <Input
                      value={field.label ?? ""}
                      onChange={(event) => updateField(key, { label: event.target.value || null })}
                      placeholder={meta.defaultLabel}
                      maxLength={CART_FORM_LABEL_MAX_LENGTH}
                      disabled={!field.is_visible}
                    />
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      Boş bırakılırsa varsayılan metin (&quot;{meta.defaultLabel}&quot;) kullanılır.
                    </span>
                  </label>
                </div>
                <div className="flex flex-row gap-4 md:flex-col md:items-end md:justify-center">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border"
                      checked={field.is_visible}
                      onChange={(event) => updateField(key, { is_visible: event.target.checked })}
                    />
                    Göster
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border"
                      checked={field.is_required}
                      disabled={!field.is_visible}
                      onChange={(event) => updateField(key, { is_required: event.target.checked })}
                    />
                    Zorunlu
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Ödeme yöntemi seçimi bu ayardan etkilenmez. Gizlenen bir alan zorunlu olamaz; zorunlu
          alanlar boşken sipariş hem vitrinde hem sunucuda engellenir.
        </p>

        <div className="min-h-6">
          <InlineAlert message={message} onExpire={() => setMessage(null)} />
          <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </Button>
          <Button type="button" variant="secondary" onClick={resetToDefaults} disabled={pending}>
            Varsayılana dön
          </Button>
        </div>
      </Card>
    </form>
  );
}
