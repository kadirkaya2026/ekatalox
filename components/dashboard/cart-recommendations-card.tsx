"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RecommendationMode } from "@/lib/types";
import { cn } from "@/lib/utils";

// Sepetteki "Bunları da beğenebilirsiniz" önerileri. Eskiden Tema & Marka
// Renkleri'nde bir sekmeydi; sepetle ilgili olduğu için Sepet Ayarları'na
// taşındı. Aynı PATCH /api/tenant/settings ile yalnız recommendation_mode kaydeder.
const MODES: Array<{ key: RecommendationMode; title: string; description: string }> = [
  {
    key: "auto",
    title: "Otomatik",
    description: "Sepetteki ürünler hariç, katalogdan otomatik ürün önerilir.",
  },
  {
    key: "manual",
    title: "Manuel (seçtiğim ürünler)",
    description: "Ürün listesinde işaretlediğiniz ürünler önerilir. Ürünler sayfasından işaretleyin.",
  },
];

export function CartRecommendationsCard({ initialMode }: { initialMode: RecommendationMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<RecommendationMode>(initialMode);
  const [saved, setSaved] = useState<RecommendationMode>(initialMode);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendation_mode: mode }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(result.error ?? "Kaydedilemedi.");
        return;
      }
      setSaved(mode);
      setMessage("Sepet önerileri kaydedildi.");
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-emerald-700" />
        <h2 className="text-lg font-semibold text-slate-900">Sepet ürün önerileri</h2>
      </div>
      <p className="mt-1 mb-4 text-sm text-slate-600">
        Müşteri sepetini açınca altta &quot;Bunları da beğenebilirsiniz&quot; alanında hangi ürünlerin
        önerileceğini seçin.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {MODES.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setMode(option.key)}
            className={cn(
              "rounded-xl border px-3 py-3 text-left transition",
              mode === option.key ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50",
            )}
          >
            <p className="text-sm font-semibold text-slate-900">{option.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">{option.description}</p>
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className={cn("text-sm", message?.includes("kaydedildi") ? "text-emerald-700" : "text-rose-600")}>{message}</p>
        <Button type="button" onClick={save} disabled={pending || mode === saved}>
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </Card>
  );
}
