"use client";

import { useState, useTransition } from "react";
import { Check, Eye, EyeOff, PackageX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SettingsSectionHeader } from "@/components/dashboard/settings-section-header";
import { InlineAlert } from "@/components/ui/inline-alert";
import { cn } from "@/lib/utils";

const OPTIONS = [
  {
    value: false,
    title: "Sitede görünsün",
    body: "Stokta olmayan ürünler katalogda kalır, üzerinde \"Stokta yok\" yazar ve sepete eklenemez.",
    icon: Eye,
  },
  {
    value: true,
    title: "Sitede görünmesin",
    body: "Stokta olmayan ürünler katalogdan tamamen kalkar. Stoğa aldığınızda kendiliğinden geri gelir.",
    icon: EyeOff,
  },
] as const;

export function TenantStockVisibilityForm({ initialHide }: { initialHide: boolean }) {
  const [hide, setHide] = useState(initialHide);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function choose(next: boolean) {
    if (next === hide || pending) return;
    const previous = hide;
    setHide(next);
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/settings/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hide_out_of_stock: next }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setHide(previous);
        setError(result.error ?? "Stok görünürlüğü ayarı kaydedilemedi.");
        return;
      }

      setMessage(
        next
          ? "Stokta olmayan ürünler artık kataloğunuzda görünmeyecek."
          : "Stokta olmayan ürünler kataloğunuzda \"Stokta yok\" etiketiyle görünecek.",
      );
    });
  }

  return (
    <Card className="p-5">
      <SettingsSectionHeader icon={PackageX} title="Stokta olmayan ürünler sitede görünsün mü?" />
      <p className="mb-4 text-sm text-slate-500">
        Ürünler sayfasında stok durumunu kapattığınız ürünler için geçerlidir. Değişiklik birkaç saniye
        içinde kataloğunuza yansır.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = option.value === hide;
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
