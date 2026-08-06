"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImageOff, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import type {
  HomepageBlock,
  StorefrontHeroStyleKey,
  TenantPlan,
  TenantStorefrontSettings,
} from "@/lib/types";
import {
  HOMEPAGE_BLOCK_LABELS,
  normalizeHomepageBlocks,
} from "@/lib/storefront/homepage-blocks";
import {
  allowedHeroImageMimeTypes,
  maxHeroImageFileSizeBytes,
} from "@/lib/validators/storefront-settings";
import { cn } from "@/lib/utils";

const HERO_STYLE_OPTIONS: Array<{
  key: StorefrontHeroStyleKey;
  title: string;
  description: string;
}> = [
  {
    key: "text",
    title: "Sade metin",
    description: "Görsel yok, sadece başlık ve açıklama.",
  },
  {
    key: "image-split",
    title: "Görsel yan yana",
    description: "Solda metin, sağda hero görseli.",
  },
  {
    key: "full-bleed",
    title: "Tam genişlik banner",
    description: "Arka planda büyük görsel, üzerinde başlık.",
  },
];

type HomepageContentTab = "hero" | "blocks";

const HOMEPAGE_CONTENT_TABS: Array<{ key: HomepageContentTab; label: string }> = [
  { key: "hero", label: "Hero Alanı" },
  { key: "blocks", label: "Bölüm Sırası ve Görünürlüğü" },
];

export function TenantHomepageContentForm({
  initialStorefrontSettings,
  tenantPlan,
  companyName,
}: {
  initialStorefrontSettings: TenantStorefrontSettings;
  tenantPlan: TenantPlan;
  companyName: string;
}) {
  const [activeTab, setActiveTab] = useState<HomepageContentTab>("hero");
  const [heroHeading, setHeroHeading] = useState(initialStorefrontSettings.hero_heading ?? "");
  const [heroCtaLabel, setHeroCtaLabel] = useState(
    initialStorefrontSettings.hero_cta_label ?? "",
  );
  const [heroImageUrl, setHeroImageUrl] = useState(
    initialStorefrontSettings.hero_image_url ?? "",
  );
  const [heroStyleKey, setHeroStyleKey] = useState<StorefrontHeroStyleKey>(
    initialStorefrontSettings.hero_style_key ?? "text",
  );
  const [heroImagePending, setHeroImagePending] = useState(false);
  const [heroImageMessage, setHeroImageMessage] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<HomepageBlock[]>(
    normalizeHomepageBlocks(initialStorefrontSettings.homepage_blocks),
  );
  const [savePending, startSaveTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleHeroImageChange(file: File | null) {
    if (!file) return;

    if (!allowedHeroImageMimeTypes.includes(file.type as (typeof allowedHeroImageMimeTypes)[number])) {
      setHeroImageMessage("Hero görseli yalnız PNG, JPEG veya WEBP olabilir.");
      return;
    }

    if (file.size > maxHeroImageFileSizeBytes) {
      setHeroImageMessage("Hero görseli en fazla 3MB olabilir.");
      return;
    }

    setHeroImagePending(true);
    setHeroImageMessage(null);

    const formData = new FormData();
    formData.set("image", file);
    if (heroImageUrl) {
      formData.set("previous_image_url", heroImageUrl);
    }

    const response = await fetch("/api/tenant/settings/hero-image", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      setHeroImagePending(false);
      setHeroImageMessage(result.error ?? "Hero görseli yüklenemedi.");
      return;
    }

    setHeroImageUrl(result.image_url as string);
    setHeroImagePending(false);
    setHeroImageMessage("Hero görseli yüklendi.");
    setSaveMessage(null);
  }

  async function removeHeroImage() {
    if (!heroImageUrl) return;

    setHeroImagePending(true);
    setHeroImageMessage(null);

    const response = await fetch("/api/tenant/settings/hero-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: heroImageUrl }),
    });

    const result = await response.json();

    if (!response.ok) {
      setHeroImagePending(false);
      setHeroImageMessage(result.error ?? "Hero görseli silinemedi.");
      return;
    }

    setHeroImageUrl("");
    setHeroImagePending(false);
    setHeroImageMessage(null);
    setSaveMessage(null);
  }

  const isHeroVisible = blocks.find((block) => block.id === "hero")?.visible ?? true;

  function setHeroVisible(visible: boolean) {
    setBlocks((current) =>
      current.map((block) => (block.id === "hero" ? { ...block, visible } : block)),
    );
    setSaveMessage(null);
  }

  function moveHomepageBlock(blockId: HomepageBlock["id"], direction: "up" | "down") {
    setBlocks((current) => {
      const sorted = [...current].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((block) => block.id === blockId);
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) {
        return current;
      }
      const reordered = [...sorted];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      return reordered.map((block, orderIndex) => ({ ...block, order: orderIndex + 1 }));
    });
    setSaveMessage(null);
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveMessage(null);

    startSaveTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hero_heading: heroHeading,
          hero_cta_label: heroCtaLabel,
          hero_image_url: heroImageUrl || null,
          hero_style_key: heroStyleKey,
          homepage_blocks: blocks,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSaveMessage(result.error ?? "Ana sayfa içerikleri kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings) {
        setHeroHeading(result.storefrontSettings.hero_heading ?? "");
        setHeroCtaLabel(result.storefrontSettings.hero_cta_label ?? "");
        setHeroImageUrl(result.storefrontSettings.hero_image_url ?? "");
        setHeroStyleKey(result.storefrontSettings.hero_style_key ?? "text");
        setBlocks(normalizeHomepageBlocks(result.storefrontSettings.homepage_blocks));
      }

      setSaveMessage("Ana sayfa içerikleri kaydedildi.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap border-b border-slate-100">
          {HOMEPAGE_CONTENT_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition sm:px-5",
                activeTab === tab.key
                  ? "border-emerald-500 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
        {activeTab === "hero" ? (
        <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Sparkles className="size-4 text-emerald-700" />
          <span>Hero alanı</span>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Anasayfanın en üstünde, banner&apos;dan önce gösterilen başlık ve buton. Kısa
          açıklama (Mağaza Kimliği sayfasında) hero alanında da gösterilir.
        </p>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <input
              type="checkbox"
              checked={isHeroVisible}
              onChange={(event) => setHeroVisible(event.target.checked)}
            />
            Ana sayfada hero alanını göster
          </label>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                Hero başlığı
              </label>
              <Input
                value={heroHeading}
                onChange={(event) => {
                  setHeroHeading(event.target.value);
                  setSaveMessage(null);
                }}
                placeholder="Örn. Toptan tedarikte güvenilir partneriniz"
                maxLength={120}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                Hero buton metni
              </label>
              <Input
                value={heroCtaLabel}
                onChange={(event) => {
                  setHeroCtaLabel(event.target.value);
                  setSaveMessage(null);
                }}
                placeholder="Kataloğu incele"
                maxLength={40}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Buton tıklandığında katalog bölümüne kaydırır.
          </p>
        </div>

        <div className="mt-4">
          <PlanFeatureGate
            feature="advanced_appearance"
            plan={tenantPlan}
            companyName={companyName}
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-900">Hero görünümü</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {HERO_STYLE_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setHeroStyleKey(option.key);
                      setSaveMessage(null);
                    }}
                    className={cn(
                      "rounded-xl border p-3 text-left transition",
                      heroStyleKey === option.key
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-slate-300",
                    )}
                  >
                    <p className="text-sm font-semibold text-slate-900">{option.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{option.description}</p>
                  </button>
                ))}
              </div>

              {heroStyleKey !== "text" ? (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-slate-900">Hero görseli</p>
                  {heroImageUrl ? (
                    <div className="relative mb-3 overflow-hidden rounded-xl border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroImageUrl}
                        alt="Hero görseli"
                        className="h-40 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeHeroImage}
                        disabled={heroImagePending}
                        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                        aria-label="Hero görselini kaldır"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mb-3 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400">
                      <ImageOff className="size-6" />
                    </div>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400">
                    {heroImagePending ? "Yükleniyor..." : "Görsel yükle"}
                    <input
                      type="file"
                      accept={allowedHeroImageMimeTypes.join(",")}
                      className="hidden"
                      disabled={heroImagePending}
                      onChange={(event) =>
                        handleHeroImageChange(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  <p className="mt-2 text-xs text-slate-500">
                    PNG, JPEG veya WEBP, en fazla 3MB. Geniş, düşük detaylı görseller en iyi
                    sonucu verir.
                  </p>
                  {heroImageMessage ? (
                    <p className="mt-2 text-xs text-emerald-700">{heroImageMessage}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </PlanFeatureGate>
        </div>
        </div>
        ) : null}

        {activeTab === "blocks" ? (
        <PlanFeatureGate
          feature="homepage_blocks_editor"
          plan={tenantPlan}
          companyName={companyName}
        >
          <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-emerald-700" />
            <h2 className="text-lg font-semibold text-slate-900">Bölüm sırası ve görünürlüğü</h2>
          </div>
          <p className="mt-1 mb-4 text-sm text-slate-600">
            Vitrin ana sayfasındaki bölümlerin sırasını ve görünürlüğünü yönetin.
          </p>
          <div className="space-y-3">
            {blocks
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((block, index, sortedBlocks) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {HOMEPAGE_BLOCK_LABELS[block.id]}
                    </p>
                    <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={block.visible}
                        onChange={(event) => {
                          setBlocks((current) =>
                            current.map((item) =>
                              item.id === block.id
                                ? { ...item, visible: event.target.checked }
                                : item,
                            ),
                          );
                          setSaveMessage(null);
                        }}
                      />
                      Vitrinde göster
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => moveHomepageBlock(block.id, "up")}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={index === sortedBlocks.length - 1}
                      onClick={() => moveHomepageBlock(block.id, "down")}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
          </div>
        </PlanFeatureGate>
        ) : null}
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-6">
          {saveMessage ? <p className="text-sm text-emerald-700">{saveMessage}</p> : null}
        </div>
        <Button type="submit" disabled={savePending}>
          {savePending ? "Kaydediliyor..." : "Ana sayfa içeriklerini kaydet"}
        </Button>
      </div>
    </form>
  );
}
