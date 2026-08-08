"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BannerItem, TenantStorefrontSettings } from "@/lib/types";
import {
  allowedBannerMimeTypes,
  maxBannerFileSizeBytes,
  requiredHeroClusterLargeHeight,
  requiredHeroClusterLargeWidth,
  requiredHeroClusterSideHeight,
  requiredHeroClusterSideWidth,
} from "@/lib/validators/storefront-settings";

type Slot = "large" | "side";

const SLOTS: Array<{ slot: Slot; label: string; aspect: string }> = [
  { slot: "large", label: "Büyük görsel (solda)", aspect: "aspect-[3/2]" },
  { slot: "side", label: "Küçük görsel 1 (sağ üst)", aspect: "aspect-[16/9]" },
  { slot: "side", label: "Küçük görsel 2 (sağ alt)", aspect: "aspect-[16/9]" },
];

function requiredDimensionsForSlot(slot: Slot) {
  return slot === "large"
    ? { width: requiredHeroClusterLargeWidth, height: requiredHeroClusterLargeHeight }
    : { width: requiredHeroClusterSideWidth, height: requiredHeroClusterSideHeight };
}

function loadImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      reject(new Error("Görselin çözünürlüğü okunamadı."));
      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;
  });
}

function createEmptyHeroClusterItem(index: number): BannerItem {
  return {
    id: `hero-cluster-${Date.now()}-${index}`,
    title: "",
    description: "",
    image_url: "",
    cta_label: null,
    cta_href: null,
    background_color: index === 0 ? "#0f172a" : "#1d4ed8",
  };
}

export function HeroClusterBannerForm({
  initialStorefrontSettings,
}: {
  initialStorefrontSettings: TenantStorefrontSettings;
}) {
  const initialItems = initialStorefrontSettings.hero_cluster_items ?? [];
  const [items, setItems] = useState<Array<BannerItem | null>>([
    initialItems[0] ?? null,
    initialItems[1] ?? null,
    initialItems[2] ?? null,
  ]);
  const [isVisibleOnMobile, setIsVisibleOnMobile] = useState(
    initialStorefrontSettings.is_hero_cluster_visible_on_mobile,
  );
  const [uploadState, setUploadState] = useState<
    Record<number, { pending?: boolean; message?: string | null }>
  >({});
  const [savePending, startSaveTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const router = useRouter();

  function setUploadStatus(index: number, next: { pending?: boolean; message?: string | null }) {
    setUploadState((current) => ({ ...current, [index]: { ...current[index], ...next } }));
  }

  function updateField(index: number, key: keyof BannerItem, value: BannerItem[keyof BannerItem]) {
    setItems((current) => {
      const next = [...current];
      next[index] = { ...(next[index] ?? createEmptyHeroClusterItem(index)), [key]: value };
      return next;
    });
    setSaveMessage(null);
  }

  async function removeImage(index: number) {
    const current = items[index];
    if (!current?.image_url?.startsWith("http")) {
      updateField(index, "image_url", "");
      return;
    }

    setUploadStatus(index, { pending: true, message: null });

    const response = await fetch("/api/tenant/settings/hero-cluster-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: current.image_url }),
    });

    const result = await response.json();

    if (!response.ok) {
      setUploadStatus(index, { pending: false, message: result.error ?? "Görsel silinemedi." });
      return;
    }

    updateField(index, "image_url", "");
    setUploadStatus(index, { pending: false, message: null });
  }

  async function handleFileChange(index: number, slot: Slot, file: File | null) {
    if (!file) return;

    if (!allowedBannerMimeTypes.includes(file.type as (typeof allowedBannerMimeTypes)[number])) {
      setUploadStatus(index, { pending: false, message: "Görsel yalnız PNG, JPEG veya WEBP olabilir." });
      return;
    }

    if (file.size > maxBannerFileSizeBytes) {
      setUploadStatus(index, { pending: false, message: "Görsel en fazla 2MB olabilir." });
      return;
    }

    const required = requiredDimensionsForSlot(slot);

    try {
      const dimensions = await loadImageDimensions(file);

      if (dimensions.width !== required.width || dimensions.height !== required.height) {
        setUploadStatus(index, {
          pending: false,
          message: `Görsel tam olarak ${required.width}x${required.height}px olmalıdır.`,
        });
        return;
      }
    } catch (error) {
      setUploadStatus(index, {
        pending: false,
        message: error instanceof Error ? error.message : "Görselin çözünürlüğü okunamadı.",
      });
      return;
    }

    const previousImageUrl = items[index]?.image_url || null;
    setUploadStatus(index, { pending: true, message: null });

    const formData = new FormData();
    formData.set("image", file);
    formData.set("slot", slot);
    if (previousImageUrl) {
      formData.set("previous_image_url", previousImageUrl);
    }

    const response = await fetch("/api/tenant/settings/hero-cluster-image", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      setUploadStatus(index, { pending: false, message: result.error ?? "Görsel yüklenemedi." });
      return;
    }

    updateField(index, "image_url", result.image_url as string);
    setUploadStatus(index, { pending: false, message: "Görsel yüklendi." });
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveMessage(null);

    const heroClusterItems = items.filter((item): item is BannerItem => Boolean(item?.image_url));

    startSaveTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hero_cluster_items: heroClusterItems,
          is_hero_cluster_visible_on_mobile: isVisibleOnMobile,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSaveMessage(result.error ?? "Ayarlar kaydedilemedi.");
        return;
      }

      setSaveMessage("Hero cluster ayarları kaydedildi.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={save}>
      <Card className="p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Büyük banner + yan kutucuklar (Hero Cluster)
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Bu bölüm, anasayfa banner carousel&apos;ından farklı bir oran kullanır — bu yüzden
            kendi görsellerini ayrıca yüklemeniz gerekir. En az 2 görsel (büyük + 1 küçük)
            yüklendiğinde bölüm anasayfada görünür.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {SLOTS.map(({ slot, label, aspect }, index) => {
            const item = items[index];
            const required = requiredDimensionsForSlot(slot);

            return (
              <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {label}
                    <span className="ml-2 font-normal text-slate-500">
                      Zorunlu ölçü: {required.width}x{required.height}px
                    </span>
                  </p>
                  {item?.image_url ? (
                    <button
                      type="button"
                      onClick={() => { void removeImage(index); }}
                      className="shrink-0 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3">
                  <Input
                    value={item?.title ?? ""}
                    onChange={(event) => updateField(index, "title", event.target.value)}
                    placeholder="Başlık (opsiyonel)"
                  />
                  <Textarea
                    value={item?.description ?? ""}
                    onChange={(event) => updateField(index, "description", event.target.value)}
                    placeholder="Açıklama (opsiyonel)"
                    className="min-h-20"
                  />
                  <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        void handleFileChange(index, slot, event.target.files?.[0] ?? null);
                        event.target.value = "";
                      }}
                    />
                    <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
                      <div
                        className={cn(
                          "relative overflow-hidden rounded-2xl border border-slate-200 bg-white",
                          aspect,
                        )}
                      >
                        {item?.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={`${label} önizleme`}
                            fill
                            className="object-cover"
                            sizes="180px"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-center text-xs text-slate-400">
                            {required.width}x{required.height} önizleme
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {uploadState[index]?.pending
                            ? "Yükleniyor..."
                            : "Görseli bilgisayarınızdan yükleyin"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Sadece {required.width}x{required.height} px • PNG, JPEG veya WEBP •
                          Maksimum 2MB
                        </p>
                        {uploadState[index]?.message ? (
                          <p className="mt-2 text-sm text-emerald-700">
                            {uploadState[index]?.message}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </label>
                  <Input
                    type="url"
                    value={item?.cta_href ?? ""}
                    onChange={(event) => updateField(index, "cta_href", event.target.value || null)}
                    placeholder="https://... (opsiyonel — tıklanınca açılacak link)"
                  />
                  <Input
                    value={item?.background_color ?? ""}
                    onChange={(event) => updateField(index, "background_color", event.target.value)}
                    placeholder="#0f172a"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <label className="mt-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isVisibleOnMobile}
            onChange={(event) => {
              setIsVisibleOnMobile(event.target.checked);
              setSaveMessage(null);
            }}
            className="size-4 accent-emerald-600"
          />
          Mobilde de göster
        </label>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6">
            {saveMessage ? <p className="text-sm text-emerald-700">{saveMessage}</p> : null}
          </div>
          <Button type="submit" disabled={savePending}>
            {savePending ? "Kaydediliyor..." : "Hero cluster ayarlarını kaydet"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
