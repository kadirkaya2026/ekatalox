"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SettingsSectionHeader } from "@/components/dashboard/settings-section-header";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/inline-alert";

const PRODUCT_COUNT_OPTIONS = [4, 8, 12, 16, 20, 24];

export function BestSellersSettings({
  initialIsVisible,
  initialTitle,
  initialProductCount,
}: {
  initialIsVisible: boolean;
  initialTitle: string;
  initialProductCount: number;
}) {
  const [isVisible, setIsVisible] = useState(initialIsVisible);
  const [title, setTitle] = useState(initialTitle);
  const [productCount, setProductCount] = useState(initialProductCount);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!title.trim()) {
      setError("Bölüm başlığı boş olamaz.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_best_sellers_visible: isVisible,
          best_sellers_title: title.trim(),
          best_sellers_product_count: productCount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Ayarlar kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings) {
        setIsVisible(Boolean(result.storefrontSettings.is_best_sellers_visible));
        setTitle(result.storefrontSettings.best_sellers_title ?? title);
        setProductCount(result.storefrontSettings.best_sellers_product_count ?? productCount);
      }

      setMessage("Ayarlar kaydedildi.");
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <SettingsSectionHeader icon={TrendingUp} title="En çok satanlar bölümü" />
      <p className="mb-4 text-sm text-slate-500">
        Ürün listesi elle seçilmez — anasayfada, «Öne Çıkan Bölümler»in hemen altında, son 30 gün
        içinde ziyaretçiler tarafından gerçekten en çok sepete eklenen ürünler otomatik olarak
        gösterilir ve her gün kendiliğinden güncellenir.
      </p>

      <form onSubmit={save} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Anasayfada göster</p>
              <p className="mt-1 text-sm text-slate-500">
                Kapalıyken bölüm anasayfada hiç görünmez.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsVisible((current) => !current);
                setMessage(null);
                setError(null);
              }}
              aria-pressed={isVisible}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                isVisible ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
                  isVisible ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-5">
          <div className="max-w-xs flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">Bölüm başlığı</label>
            <Input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setMessage(null);
                setError(null);
              }}
              placeholder="Örn. En Çok Satanlar"
              maxLength={60}
            />
          </div>

          <div className="w-40">
            <label className="mb-2 block text-sm font-medium text-slate-700">Ürün sayısı</label>
            <select
              value={productCount}
              onChange={(event) => {
                setProductCount(Number(event.target.value));
                setMessage(null);
                setError(null);
              }}
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              {PRODUCT_COUNT_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count} ürün
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6">
            <InlineAlert message={message} onExpire={() => setMessage(null)} />
            <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
