"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BannerItem, Category } from "@/lib/types";
import {
  allowedBannerMimeTypes,
  maxBannerFileSizeBytes,
  requiredBannerHeight,
  requiredBannerWidth,
  requiredCategoryTileHeight,
  requiredCategoryTileWidth,
} from "@/lib/validators/storefront-settings";
import {
  describePreparedImage,
  prepareUploadImage,
  type PreparedUploadImage,
} from "@/lib/images/prepare-upload-image";

function createEmptyCategoryBanner(categoryId: string): BannerItem {
  return {
    id: `category-banner-${categoryId}`,
    title: "",
    description: null,
    image_url: "",
    cta_label: null,
    cta_href: null,
    background_color: "#0f172a",
  };
}

export function CategoryBannerPanel({
  category,
  depth = 0,
  disabled,
  onSaved,
  onCancel,
}: {
  category: Category;
  depth?: number;
  disabled?: boolean;
  onSaved: (category: Category) => void;
  onCancel: () => void;
}) {
  const initialBanner = category.banner_item ?? createEmptyCategoryBanner(category.id);
  const [banner, setBanner] = useState<BannerItem>(initialBanner);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadPending, setUploadPending] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savePending, startSaveTransition] = useTransition();
  const [removePending, startRemoveTransition] = useTransition();
  const [tileImageUrl, setTileImageUrl] = useState<string | null>(
    category.tile_image_url ?? null,
  );
  const [tileUploadMessage, setTileUploadMessage] = useState<string | null>(null);
  const [tileUploadPending, setTileUploadPending] = useState(false);
  const [tileRemovePending, startTileRemoveTransition] = useTransition();
  const router = useRouter();

  function updateBannerField<K extends keyof BannerItem>(key: K, value: BannerItem[K]) {
    setBanner((current) => ({ ...current, [key]: value }));
    setSaveMessage(null);
  }

  async function handleBannerFileChange(file: File | null) {
    if (!file) return;

    if (!allowedBannerMimeTypes.includes(file.type as (typeof allowedBannerMimeTypes)[number])) {
      setUploadMessage("Banner yalnız PNG, JPEG veya WEBP olabilir.");
      return;
    }

    // Her boyut kabul edilir; 3:1'e kırpılıp küçültülür (15 Eki 2026).
    let prepared: PreparedUploadImage;
    try {
      prepared = await prepareUploadImage(
        file,
        { width: requiredBannerWidth, height: requiredBannerHeight },
        maxBannerFileSizeBytes,
      );
    } catch (error) {
      setUploadMessage(
        error instanceof Error
          ? error.message
          : "Banner görselinin çözünürlüğü okunamadı.",
      );
      return;
    }

    setUploadPending(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.set("image", prepared.file);
    formData.set("category_id", category.id);
    if (banner.image_url) {
      formData.set("previous_image_url", banner.image_url);
    }

    const response = await fetch("/api/tenant/categories/banner-image", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    setUploadPending(false);

    if (!response.ok) {
      setUploadMessage(result.error ?? "Banner görseli yüklenemedi.");
      return;
    }

    updateBannerField("image_url", result.image_url as string);
    setUploadMessage(describePreparedImage(prepared) ?? "Banner görseli yüklendi.");
  }

  async function handleTileFileChange(file: File | null) {
    if (!file) return;

    if (!allowedBannerMimeTypes.includes(file.type as (typeof allowedBannerMimeTypes)[number])) {
      setTileUploadMessage("Görsel yalnız PNG, JPEG veya WEBP olabilir.");
      return;
    }

    let prepared: PreparedUploadImage;
    try {
      prepared = await prepareUploadImage(
        file,
        { width: requiredCategoryTileWidth, height: requiredCategoryTileHeight },
        maxBannerFileSizeBytes,
      );
    } catch (error) {
      setTileUploadMessage(
        error instanceof Error ? error.message : "Görselin çözünürlüğü okunamadı.",
      );
      return;
    }

    setTileUploadPending(true);
    setTileUploadMessage(null);

    const formData = new FormData();
    formData.set("image", prepared.file);
    formData.set("category_id", category.id);

    const response = await fetch("/api/tenant/categories/tile-image", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    setTileUploadPending(false);

    if (!response.ok) {
      setTileUploadMessage(result.error ?? "Görsel yüklenemedi.");
      return;
    }

    setTileImageUrl(result.category.tile_image_url as string);
    setTileUploadMessage(describePreparedImage(prepared) ?? "Kutucuk görseli yüklendi.");
    onSaved(result.category as Category);
    router.refresh();
  }

  function removeTileImage() {
    setTileUploadMessage(null);

    startTileRemoveTransition(async () => {
      const response = await fetch("/api/tenant/categories/tile-image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: category.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        setTileUploadMessage(result.error ?? "Görsel kaldırılamadı.");
        return;
      }

      setTileImageUrl(null);
      setTileUploadMessage("Kutucuk görseli kaldırıldı.");
      onSaved(result.category as Category);
      router.refresh();
    });
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveMessage(null);

    startSaveTransition(async () => {
      const payload = {
        ...banner,
        title: banner.title?.trim() || null,
        description: null,
        cta_label: null,
        cta_href: null,
      };

      const response = await fetch("/api/tenant/categories/banner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: category.id,
          banner_item: payload,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSaveMessage(result.error ?? "Kategori banner ayarları kaydedilemedi.");
        return;
      }

      setSaveMessage("Kategori banner ayarları kaydedildi.");
      onSaved(result.category as Category);
      router.refresh();
    });
  }

  function removeBanner() {
    setSaveMessage(null);

    startRemoveTransition(async () => {
      if (banner.image_url?.startsWith("http")) {
        const response = await fetch("/api/tenant/categories/banner-image", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: banner.image_url,
            category_id: category.id,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setSaveMessage(result.error ?? "Banner görseli silinemedi.");
          return;
        }
      }

      const response = await fetch("/api/tenant/categories/banner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: category.id,
          banner_item: null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSaveMessage(result.error ?? "Kategori banner kaldırılamadı.");
        return;
      }

      setBanner(createEmptyCategoryBanner(category.id));
      setUploadMessage(null);
      setSaveMessage("Kategori banner kaldırıldı.");
      onSaved(result.category as Category);
      router.refresh();
    });
  }

  const hasSavedBanner = Boolean(category.banner_item?.image_url);

  return (
    <form
      onSubmit={save}
      className="mt-1 rounded-xl border border-violet-100 bg-violet-50 p-4"
      style={{ marginLeft: `${depth * 20}px` }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            &quot;{category.name}&quot; kategori banner&apos;ı
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Bu kategoriye tıklandığında vitrinde gösterilir; ayrıca açıksa anasayfadaki kategori
            kutucuğunun görseli olarak da kullanılır. Önerilen ölçü: 2400x800 px (3:1) • Farklı ölçüler otomatik ayarlanır
          </p>
        </div>
        {hasSavedBanner ? (
          <Button
            type="button"
            variant="secondary"
            className="h-8 shrink-0 gap-1.5 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => { void removeBanner(); }}
            disabled={disabled || removePending || savePending || uploadPending}
          >
            <Trash2 className="size-3" />
            {removePending ? "Kaldırılıyor..." : "Banner'ı kaldır"}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3">
        <Input
          value={banner.title ?? ""}
          onChange={(event) => updateBannerField("title", event.target.value)}
          placeholder="Banner başlığı (opsiyonel, görsel alt metni için)"
          disabled={disabled || savePending || removePending}
        />
        <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={disabled || uploadPending || savePending || removePending}
            onChange={(event) => {
              void handleBannerFileChange(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
          <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
            <div className="relative aspect-[3/1] overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {banner.image_url ? (
                <Image
                  src={banner.image_url}
                  alt={`${category.name} banner önizleme`}
                  fill
                  className="object-cover"
                  sizes="180px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-center text-xs text-slate-400">
                  3:1 önizleme
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {uploadPending
                  ? "Banner yükleniyor..."
                  : "Banner görselini bilgisayarınızdan yükleyin"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Her kategori için yalnızca bir banner yüklenebilir.
              </p>
              {uploadMessage ? (
                <p className="mt-2 text-sm text-emerald-700">{uploadMessage}</p>
              ) : null}
            </div>
          </div>
        </label>
        <Input
          value={banner.background_color ?? ""}
          onChange={(event) => updateBannerField("background_color", event.target.value)}
          placeholder="#0f172a"
          disabled={disabled || savePending || removePending}
        />
      </div>

      <div className="mt-5 border-t border-violet-100 pt-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Anasayfa kutucuğu görseli (kare)
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Anasayfadaki kategori kutucuğunda bu kare görsel kullanılır — yukarıdaki geniş
              banner kırpılmadan, ayrı olarak yüklenir. Önerilen ölçü: {requiredCategoryTileWidth * 2}
              x{requiredCategoryTileHeight * 2} px (kare) • Farklı ölçüler otomatik ayarlanır
            </p>
          </div>
          {tileImageUrl ? (
            <Button
              type="button"
              variant="secondary"
              className="h-8 shrink-0 gap-1.5 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={removeTileImage}
              disabled={disabled || tileRemovePending || tileUploadPending}
            >
              <Trash2 className="size-3" />
              {tileRemovePending ? "Kaldırılıyor..." : "Kaldır"}
            </Button>
          ) : null}
        </div>

        <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={disabled || tileUploadPending || tileRemovePending}
            onChange={(event) => {
              void handleTileFileChange(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
          <div className="grid gap-4 md:grid-cols-[96px_minmax(0,1fr)] md:items-center">
            <div className="relative aspect-square size-24 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {tileImageUrl ? (
                <Image
                  src={tileImageUrl}
                  alt={`${category.name} kutucuk önizleme`}
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-center text-[10px] text-slate-400">
                  {requiredCategoryTileWidth}x{requiredCategoryTileHeight}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {tileUploadPending
                  ? "Görsel yükleniyor..."
                  : "Kutucuk görselini bilgisayarınızdan yükleyin"}
              </p>
              <p className="mt-1 text-sm text-slate-500">Yüklenince anında kaydedilir.</p>
              {tileUploadMessage ? (
                <p className="mt-2 text-sm text-emerald-700">{tileUploadMessage}</p>
              ) : null}
            </div>
          </div>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {saveMessage ? (
          <p className="mr-auto text-sm text-emerald-700">{saveMessage}</p>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="h-8 px-3 text-xs"
          onClick={onCancel}
          disabled={disabled || savePending || removePending || uploadPending}
        >
          Kapat
        </Button>
        <Button
          type="submit"
          className="h-8 px-3 text-xs"
          disabled={disabled || savePending || removePending || uploadPending || !banner.image_url}
        >
          {savePending ? "Kaydediliyor..." : "Banner ayarlarını kaydet"}
        </Button>
      </div>
    </form>
  );
}
