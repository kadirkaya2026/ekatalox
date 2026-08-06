"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import type { HomepageBlock, TenantPlan, TenantStorefrontSettings } from "@/lib/types";
import {
  HOMEPAGE_BLOCK_LABELS,
  normalizeHomepageBlocks,
} from "@/lib/storefront/homepage-blocks";
import { cn } from "@/lib/utils";

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
  const [blocks, setBlocks] = useState<HomepageBlock[]>(
    normalizeHomepageBlocks(initialStorefrontSettings.homepage_blocks),
  );
  const [savePending, startSaveTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const router = useRouter();

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
