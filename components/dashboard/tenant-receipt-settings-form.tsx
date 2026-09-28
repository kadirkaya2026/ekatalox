"use client";

import { useState, useTransition } from "react";
import { Check, FileText, ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SettingsSectionHeader } from "@/components/dashboard/settings-section-header";
import { InlineAlert } from "@/components/ui/inline-alert";
import { cn } from "@/lib/utils";

const OPTIONS = [
  {
    value: true,
    title: "Resimli fiş",
    body: "Her ürünün başında küçük ürün görseli yer alır; hangi ürünün sipariş edildiği tek bakışta anlaşılır.",
    icon: ImageIcon,
  },
  {
    value: false,
    title: "Resimsiz fiş",
    body: "Yalnız ürün adı, model kodu, adet ve tutar yazar; fiş daha sade ve kısa olur.",
    icon: FileText,
  },
] as const;

export function TenantReceiptSettingsForm({ initialShowImages }: { initialShowImages: boolean }) {
  const [showImages, setShowImages] = useState(initialShowImages);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function choose(next: boolean) {
    if (next === showImages || pending) return;
    const previous = showImages;
    setShowImages(next);
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/settings/receipt", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt_show_images: next }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setShowImages(previous);
        setError(result.error ?? "Sipariş fişi ayarı kaydedilemedi.");
        return;
      }

      setMessage(next ? "Fişler artık ürün görselleriyle gidecek." : "Fişler artık görselsiz gidecek.");
    });
  }

  return (
    <Card className="p-5">
      <SettingsSectionHeader icon={FileText} title="Fişte ürün görselleri" />
      <p className="mb-4 text-sm text-slate-500">
        Müşteriniz sipariş verdiğinde size gelen PDF fişin görünümünü seçin. Değişiklik bir sonraki
        siparişten itibaren geçerli olur.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = option.value === showImages;
          const Icon = option.icon;
          return (
            <button
              key={option.title}
              type="button"
              onClick={() => choose(option.value)}
              aria-pressed={selected}
              disabled={pending}
              className={cn(
                "relative rounded-2xl border p-4 text-left transition",
                selected
                  ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                  : "border-slate-200 bg-white hover:border-slate-300",
              )}
            >
              {selected ? (
                <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check className="size-3.5" />
                </span>
              ) : null}
              <Icon className={cn("size-5", selected ? "text-emerald-700" : "text-slate-500")} />
              <p className="mt-3 text-sm font-semibold text-slate-900">{option.title}</p>
              <p className="mt-1 text-sm text-slate-500">{option.body}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        <InlineAlert message={message} onExpire={() => setMessage(null)} />
        <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />
      </div>
    </Card>
  );
}
