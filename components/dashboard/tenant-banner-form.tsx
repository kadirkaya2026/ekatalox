"use client";

import { useEffect, useState, useTransition } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BannerItem, TenantStorefrontSettings } from "@/lib/types";
import {
  allowedBannerMimeTypes,
  maxBannerFileSizeBytes,
  requiredBannerHeight,
  requiredBannerWidth,
} from "@/lib/validators/storefront-settings";

function loadImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      reject(new Error("Banner görselinin çözünürlüğü okunamadı."));
      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;
  });
}

function createEmptyBanner(index: number): BannerItem {
  return {
    id: `banner-${Date.now()}-${index}`,
    title: "",
    description: "",
    image_url: "",
    cta_label: null,
    cta_href: null,
    background_color: index % 2 === 0 ? "#0f172a" : "#065f46",
  };
}

function BannerOrderInput({
  displayOrder,
  maxOrder,
  disabled,
  bannerLabel,
  onCommit,
}: {
  displayOrder: number;
  maxOrder: number;
  disabled?: boolean;
  bannerLabel: string;
  onCommit: (targetOrder: number) => void;
}) {
  const [draft, setDraft] = useState(String(displayOrder));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraft(String(displayOrder));
    }
  }, [displayOrder, isEditing]);

  function commit() {
    const parsed = Number.parseInt(draft, 10);

    if (!Number.isFinite(parsed) || parsed < 1 || parsed > maxOrder) {
      setDraft(String(displayOrder));
      setIsEditing(false);
      return;
    }

    onCommit(parsed);
    setIsEditing(false);
  }

  function cancel() {
    setDraft(String(displayOrder));
    setIsEditing(false);
  }

  return (
    <input
      type="number"
      min={1}
      max={maxOrder}
      inputMode="numeric"
      value={draft}
      disabled={disabled}
      aria-label={`${bannerLabel} sırası`}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={() => setIsEditing(true)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }

        if (event.key === "Escape") {
          event.preventDefault();
          cancel();
        }
      }}
      className="w-14 shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-center text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

export function TenantBannerForm({
  initialStorefrontSettings,
}: {
  initialStorefrontSettings: TenantStorefrontSettings;
}) {
  const [bannerItems, setBannerItems] = useState<BannerItem[]>(
    (initialStorefrontSettings.banner_items ?? []).map((banner) => ({
      ...banner,
      cta_label: null,
      cta_href: null,
    })),
  );
  const [bannerUploadState, setBannerUploadState] = useState<
    Record<string, { pending?: boolean; message?: string | null }>
  >({});
  const [savePending, startSaveTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [bannerItemsError, setBannerItemsError] = useState<string | null>(null);

  function updateBannerField(
    bannerId: string,
    key: keyof BannerItem,
    value: BannerItem[keyof BannerItem],
  ) {
    setBannerItems((current) =>
      current.map((banner) =>
        banner.id === bannerId ? { ...banner, [key]: value } : banner,
      ),
    );
    setSaveMessage(null);
    setBannerItemsError(null);
  }

  function addBanner() {
    setBannerItems((current) => [...current, createEmptyBanner(current.length)]);
    setSaveMessage(null);
  }

  function handleSetBannerOrder(bannerId: string, targetOrder: number) {
    const sourceIndex = bannerItems.findIndex((banner) => banner.id === bannerId);

    if (sourceIndex < 0) {
      return;
    }

    const targetIndex =
      Math.min(Math.max(1, Math.floor(targetOrder)), bannerItems.length) - 1;

    if (targetIndex === sourceIndex) {
      return;
    }

    setBannerItems(arrayMove(bannerItems, sourceIndex, targetIndex));
    setSaveMessage(null);
    setBannerItemsError(null);
  }

  function setBannerUploadStatus(
    bannerId: string,
    nextState: { pending?: boolean; message?: string | null },
  ) {
    setBannerUploadState((current) => ({
      ...current,
      [bannerId]: { ...current[bannerId], ...nextState },
    }));
  }

  async function removeBanner(bannerId: string) {
    const targetBanner = bannerItems.find((banner) => banner.id === bannerId);

    if (targetBanner?.image_url?.startsWith("http")) {
      setBannerUploadStatus(bannerId, { pending: true, message: null });

      const response = await fetch("/api/tenant/settings/banner-image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: targetBanner.image_url }),
      });

      const result = await response.json();

      if (!response.ok) {
        setBannerUploadStatus(bannerId, {
          pending: false,
          message: result.error ?? "Banner görseli silinemedi.",
        });
        return;
      }
    }

    setBannerItems((current) => current.filter((banner) => banner.id !== bannerId));
    setBannerUploadState((current) => {
      const nextState = { ...current };
      delete nextState[bannerId];
      return nextState;
    });
    setSaveMessage(null);
  }

  async function handleBannerFileChange(bannerId: string, file: File | null) {
    if (!file) return;

    if (!allowedBannerMimeTypes.includes(file.type as (typeof allowedBannerMimeTypes)[number])) {
      setBannerUploadStatus(bannerId, {
        pending: false,
        message: "Banner yalnız PNG, JPEG veya WEBP olabilir.",
      });
      return;
    }

    if (file.size > maxBannerFileSizeBytes) {
      setBannerUploadStatus(bannerId, {
        pending: false,
        message: "Banner görseli en fazla 2MB olabilir.",
      });
      return;
    }

    try {
      const dimensions = await loadImageDimensions(file);

      if (
        dimensions.width !== requiredBannerWidth ||
        dimensions.height !== requiredBannerHeight
      ) {
        setBannerUploadStatus(bannerId, {
          pending: false,
          message: `Banner görseli tam olarak ${requiredBannerWidth}x${requiredBannerHeight}px olmalıdır.`,
        });
        return;
      }
    } catch (error) {
      setBannerUploadStatus(bannerId, {
        pending: false,
        message:
          error instanceof Error
            ? error.message
            : "Banner görselinin çözünürlüğü okunamadı.",
      });
      return;
    }

    const previousImageUrl =
      bannerItems.find((banner) => banner.id === bannerId)?.image_url ?? null;

    setBannerUploadStatus(bannerId, { pending: true, message: null });

    const formData = new FormData();
    formData.set("image", file);
    if (previousImageUrl) {
      formData.set("previous_image_url", previousImageUrl);
    }

    const response = await fetch("/api/tenant/settings/banner-image", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      setBannerUploadStatus(bannerId, {
        pending: false,
        message: result.error ?? "Banner görseli yüklenemedi.",
      });
      return;
    }

    updateBannerField(bannerId, "image_url", result.image_url as string);
    setBannerUploadStatus(bannerId, { pending: false, message: "Banner görseli yüklendi." });
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveMessage(null);
    setBannerItemsError(null);

    startSaveTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banner_items: bannerItems.map((banner) => ({
            ...banner,
            cta_label: null,
            cta_href: null,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSaveMessage(result.error ?? "Banner ayarları kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings?.banner_items) {
        setBannerItems(
          (result.storefrontSettings.banner_items as BannerItem[]).map((banner) => ({
            ...banner,
            cta_label: null,
            cta_href: null,
          })),
        );
      }

      setSaveMessage("Banner ayarları kaydedildi.");
    });
  }

  return (
    <form onSubmit={save}>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Banner / kampanya alanı</h2>
            <p className="mt-1 text-sm text-slate-600">
              Carousel alanı için kampanya, duyuru veya indirim kartları ekleyin.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={addBanner}
            disabled={bannerItems.length >= 6}
          >
            <Plus className="size-4" />
            Banner ekle
          </Button>
        </div>

        {bannerItems.length > 1 ? (
          <p className="mt-4 text-sm text-slate-600">
            Her banner&apos;ın solundaki sıra numarasını değiştirerek vitrin carousel sırasını
            ayarlayın. Değişiklikler <strong>Banner ayarlarını kaydet</strong> ile kalıcı olur.
          </p>
        ) : null}

        <div className="mt-6 space-y-4">
          {bannerItems.length ? (
            bannerItems.map((banner, index) => (
              <div
                key={banner.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        Sıra
                      </span>
                      <BannerOrderInput
                        displayOrder={index + 1}
                        maxOrder={bannerItems.length}
                        disabled={bannerItems.length <= 1 || savePending}
                        bannerLabel={`Banner ${index + 1}`}
                        onCommit={(targetOrder) =>
                          handleSetBannerOrder(banner.id, targetOrder)
                        }
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Banner #{index + 1}</p>
                      <p className="text-xs text-slate-500">
                        Zorunlu ölçü: 1200x400 px • Maksimum dosya boyutu: 2MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { void removeBanner(banner.id); }}
                    className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="grid gap-3">
                  <Input
                    value={banner.title ?? ""}
                    onChange={(event) =>
                      updateBannerField(banner.id, "title", event.target.value)
                    }
                    placeholder="Banner başlığı"
                  />
                  <Textarea
                    value={banner.description ?? ""}
                    onChange={(event) =>
                      updateBannerField(banner.id, "description", event.target.value)
                    }
                    placeholder="Banner açıklaması"
                    className="min-h-24"
                  />
                  <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        handleBannerFileChange(banner.id, event.target.files?.[0] ?? null);
                        event.target.value = "";
                      }}
                    />
                    <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
                      <div className="relative aspect-[3/1] overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        {banner.image_url ? (
                          <Image
                            src={banner.image_url}
                            alt={`Banner ${index + 1} önizleme`}
                            fill
                            className="object-cover"
                            sizes="180px"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-center text-xs text-slate-400">
                            1200x400 önizleme
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {bannerUploadState[banner.id]?.pending
                            ? "Banner yükleniyor..."
                            : "Banner görselini bilgisayarınızdan yükleyin"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Harici link gerekmez • Sadece 1200x400 px • PNG, JPEG veya WEBP •
                          Maksimum 2MB
                        </p>
                        {bannerUploadState[banner.id]?.message ? (
                          <p className="mt-2 text-sm text-emerald-700">
                            {bannerUploadState[banner.id]?.message}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      value={banner.background_color ?? ""}
                      onChange={(event) =>
                        updateBannerField(banner.id, "background_color", event.target.value)
                      }
                      placeholder="#0f172a"
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              Henüz banner eklenmedi. İsterseniz boş bırakabilirsiniz; storefront tarafında alan
              şık bir placeholder olarak görünür.
            </div>
          )}
        </div>

        {bannerItemsError ? (
          <p className="mt-3 text-sm text-amber-700">{bannerItemsError}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6">
            {saveMessage ? (
              <p className="text-sm text-emerald-700">{saveMessage}</p>
            ) : null}
          </div>
          <Button type="submit" disabled={savePending}>
            {savePending ? "Kaydediliyor..." : "Banner ayarlarını kaydet"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
