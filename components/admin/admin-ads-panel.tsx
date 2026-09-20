"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_STOREFRONT_ADS_CONFIG,
  type StorefrontAdsConfig,
} from "@/lib/ads/config";
import { cn } from "@/lib/utils";

type SectionKey = "bottom_bar" | "product_card" | "popup" | "order_footer" | "product_detail" | "password_gate";

const SECTIONS: { key: SectionKey; title: string; where: string }[] = [
  { key: "bottom_bar", title: "1. Alt sabit bant", where: "Vitrinin en altında, kaydırınca ekranda kalan siyah şerit. Eski \"eKatalox ile yapıldı\" rozetinin yerine geçer." },
  { key: "product_card", title: "2. Ürün listesinde reklam kartı", where: "Ürün kartlarının arasına, belirlediğiniz sayıda üründe bir reklam kartı girer (grid ve liste görünümünde)." },
  { key: "popup", title: "3. Açılış pop-up'ı", where: "Sayfa açıldıktan belirli saniye sonra ortada küçük pencere. Sepet, ürün detayı veya arama açıkken bekler; sipariş akışını kesmez." },
  { key: "order_footer", title: "4. Sipariş fişi ve WhatsApp mesajı", where: "Sipariş PDF'inin en altında ve toptancıya giden WhatsApp mesajının son satırında. \"#\" karakteri kullanmayın (PDF fontunda yok)." },
  { key: "product_detail", title: "5. Ürün detayı altı", where: "Ürün detay penceresinde açıklamanın altında küçük kutu." },
  { key: "password_gate", title: "6. Şifre giriş ekranı", where: "Bayi şifre girmeden önce gördüğü ekranda, formun altında kutu." },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
          checked ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-600",
        )}
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow transition",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
      <span>{label}</span>
      <span className={cn("text-xs font-normal", checked ? "text-emerald-700" : "text-muted-foreground")}>
        {checked ? "Açık" : "Kapalı"}
      </span>
    </label>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function AdminAdsPanel({ initialConfig }: { initialConfig: StorefrontAdsConfig }) {
  const [config, setConfig] = useState<StorefrontAdsConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch<K extends SectionKey>(key: K, value: Partial<StorefrontAdsConfig[K]>) {
    setConfig((current) => ({ ...current, [key]: { ...current[key], ...value } }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/ads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "Kaydedilemedi.");
        return;
      }
      setMessage("Reklam ayarları kaydedildi. Ücretsiz plandaki vitrinlerde bir sonraki açılışta geçerli.");
    } catch {
      setError("Bağlantı hatası, tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  const activeCount = SECTIONS.filter((section) => config[section.key].enabled).length;

  return (
    <div className="space-y-6">
      <Card className="space-y-5 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Toggle
            checked={config.enabled}
            onChange={(enabled) => setConfig((current) => ({ ...current, enabled }))}
            label="Ana şalter: eKatalox reklamları"
          />
          <p className="text-xs text-muted-foreground">
            {config.enabled ? `${activeCount} / ${SECTIONS.length} yerleşim açık` : "Kapalı: hiçbir vitrinde reklam görünmez"}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Reklam bağlantısı" hint="Reklam tıklanınca açılan adres (ücretsiz kayıt). Hangi vitrinden geldiği utm ile eklenir.">
            <Input value={config.cta_url} onChange={(event) => setConfig({ ...config, cta_url: event.target.value })} />
          </Field>
          <Field label="Mağaza sahibi bağlantısı" hint="'Reklamları kaldırmak için bir paket seçin' satırının adresi.">
            <Input value={config.owner_url} onChange={(event) => setConfig({ ...config, owner_url: event.target.value })} />
          </Field>
          <Field label="Mağaza sahibi satırı" hint="Bant, pop-up ve şifre ekranında küçük yazı. Boş bırakılırsa gösterilmez.">
            <Input value={config.owner_text} onChange={(event) => setConfig({ ...config, owner_text: event.target.value })} />
          </Field>
        </div>
      </Card>

      {SECTIONS.map((section) => {
        const block = config[section.key];
        return (
          <Card key={section.key} className={cn("space-y-4 p-6", !block.enabled && "opacity-70")}>
            <div className="space-y-1">
              <Toggle checked={block.enabled} onChange={(enabled) => patch(section.key, { enabled } as never)} label={section.title} />
              <p className="pl-14 text-xs text-muted-foreground">{section.where}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {section.key === "product_card" ? (
                <Field label="Kaç üründe bir" hint="Örn. 12 = her 12 üründen sonra bir reklam kartı.">
                  <Input
                    type="number"
                    min={4}
                    max={60}
                    value={config.product_card.every_n}
                    onChange={(event) => patch("product_card", { every_n: Number(event.target.value) || 12 })}
                  />
                </Field>
              ) : null}
              {section.key === "popup" ? (
                <>
                  <Field label="Kaç saniye sonra" hint="Sayfa açıldıktan sonra bekleme süresi (0-300).">
                    <Input
                      type="number"
                      min={0}
                      max={300}
                      value={config.popup.delay_seconds}
                      onChange={(event) => patch("popup", { delay_seconds: Number(event.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Günde en fazla kaç kez" hint="Aynı cihazda günde kaç kez gösterilsin (0 = hiç).">
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={config.popup.max_per_day}
                      onChange={(event) => patch("popup", { max_per_day: Number(event.target.value) || 0 })}
                    />
                  </Field>
                </>
              ) : null}
              {"title" in block ? (
                <Field label="Başlık">
                  <Input value={block.title} onChange={(event) => patch(section.key, { title: event.target.value } as never)} />
                </Field>
              ) : null}
              <Field label="Metin" >
                <Textarea
                  className="min-h-20"
                  value={block.text}
                  onChange={(event) => patch(section.key, { text: event.target.value } as never)}
                />
              </Field>
              {"cta_label" in block ? (
                <Field label="Buton yazısı">
                  <Input value={block.cta_label} onChange={(event) => patch(section.key, { cta_label: event.target.value } as never)} />
                </Field>
              ) : null}
            </div>
          </Card>
        );
      })}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setConfig(DEFAULT_STOREFRONT_ADS_CONFIG)}
          disabled={saving}
        >
          Varsayılan metinlere dön
        </Button>
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Kaydet
        </Button>
      </div>

      <InlineAlert message={message} tone="success" onExpire={() => setMessage(null)} />
      <InlineAlert message={error} tone="error" duration={8000} onExpire={() => setError(null)} />
    </div>
  );
}
