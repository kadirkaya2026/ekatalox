"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, LayoutGrid, Palette, Sparkles, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StorefrontThemePreview } from "@/components/dashboard/storefront-theme-preview";
import type {
  HomepageBlock,
  StorefrontFooterStyleKey,
  StorefrontHeaderStyleKey,
  StorefrontLayoutKey,
  StorefrontProductCardStyle,
  StorefrontThemeKey,
  TenantPlan,
  TenantStorefrontSettings,
} from "@/lib/types";
import { THEME_OPTIONS } from "@/lib/storefront/theme-catalog";
import { LAYOUT_OPTIONS } from "@/lib/storefront/layout-catalog";
import { FONT_OPTIONS } from "@/lib/storefront/font-catalog";
import {
  BRAND_COLOR_PRESETS,
  FOOTER_STYLE_OPTIONS,
  HEADER_STYLE_OPTIONS,
  PRODUCT_CARD_STYLE_OPTIONS,
} from "@/lib/storefront/appearance-catalog";
import {
  HOMEPAGE_BLOCK_LABELS,
  normalizeHomepageBlocks,
} from "@/lib/storefront/homepage-blocks";
import { hasPlanFeature } from "@/lib/billing/plans";

interface ThemeFormState {
  theme_key: StorefrontThemeKey;
  layout_key: StorefrontLayoutKey;
  brand_primary_color: string;
  brand_accent_color: string;
  font_key: TenantStorefrontSettings["font_key"];
  product_card_style: StorefrontProductCardStyle;
  header_style_key: StorefrontHeaderStyleKey;
  footer_style_key: StorefrontFooterStyleKey;
  homepage_blocks: HomepageBlock[];
}

function toThemeFormState(settings: TenantStorefrontSettings): ThemeFormState {
  return {
    theme_key: settings.theme_key,
    layout_key: settings.layout_key ?? "classic-grid",
    brand_primary_color: settings.brand_primary_color ?? "",
    brand_accent_color: settings.brand_accent_color ?? "",
    font_key: settings.font_key ?? "inter",
    product_card_style: settings.product_card_style ?? "standard",
    header_style_key: settings.header_style_key ?? "standard",
    footer_style_key: settings.footer_style_key ?? "standard",
    homepage_blocks: normalizeHomepageBlocks(settings.homepage_blocks),
  };
}

export function TenantThemeForm({
  initialStorefrontSettings,
  tenantPlan,
}: {
  initialStorefrontSettings: TenantStorefrontSettings;
  tenantPlan: TenantPlan;
}) {
  const [form, setForm] = useState<ThemeFormState>(
    toThemeFormState(initialStorefrontSettings),
  );
  const [savePending, startSaveTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const router = useRouter();
  const canUseAdvancedAppearance = hasPlanFeature(tenantPlan, "advanced_appearance");
  const canEditHomepageBlocks = hasPlanFeature(tenantPlan, "homepage_blocks_editor");

  const previewTitle = initialStorefrontSettings.storefront_title ?? "";
  const previewLogoUrl = initialStorefrontSettings.logo_url;

  function updateField<K extends keyof ThemeFormState>(key: K, value: ThemeFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveMessage(null);
  }

  function moveHomepageBlock(blockId: HomepageBlock["id"], direction: "up" | "down") {
    setForm((current) => {
      const blocks = [...current.homepage_blocks].sort((a, b) => a.order - b.order);
      const index = blocks.findIndex((block) => block.id === blockId);
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || targetIndex < 0 || targetIndex >= blocks.length) {
        return current;
      }
      const reordered = [...blocks];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      return {
        ...current,
        homepage_blocks: reordered.map((block, orderIndex) => ({
          ...block,
          order: orderIndex + 1,
        })),
      };
    });
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveMessage(null);

    startSaveTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme_key: form.theme_key,
          layout_key: form.layout_key,
          brand_primary_color: form.brand_primary_color || null,
          brand_accent_color: form.brand_accent_color || null,
          ...(canUseAdvancedAppearance
            ? {
                font_key: form.font_key,
                product_card_style: form.product_card_style,
                header_style_key: form.header_style_key,
                footer_style_key: form.footer_style_key,
              }
            : {}),
          ...(canEditHomepageBlocks ? { homepage_blocks: form.homepage_blocks } : {}),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSaveMessage(result.error ?? "Tema ayarları kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings) {
        setForm(toThemeFormState(result.storefrontSettings));
      }

      setSaveMessage("Tema ayarları kaydedildi.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={save}>
      <Card className="p-5">
        <div className="space-y-8">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Palette className="size-4 text-emerald-700" />
              <span>Marka renkleri</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Birincil renk
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={form.brand_primary_color || "#059669"}
                    onChange={(event) => updateField("brand_primary_color", event.target.value)}
                    className="h-11 w-16 cursor-pointer p-1"
                  />
                  <Input
                    value={form.brand_primary_color}
                    onChange={(event) => updateField("brand_primary_color", event.target.value)}
                    placeholder="#059669"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Vurgu rengi
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={form.brand_accent_color || "#10b981"}
                    onChange={(event) => updateField("brand_accent_color", event.target.value)}
                    className="h-11 w-16 cursor-pointer p-1"
                  />
                  <Input
                    value={form.brand_accent_color}
                    onChange={(event) => updateField("brand_accent_color", event.target.value)}
                    placeholder="#10b981"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {BRAND_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    updateField("brand_primary_color", preset.primary);
                    updateField("brand_accent_color", preset.accent);
                  }}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Palette className="size-4 text-emerald-700" />
              <span>Hazır tema seçimi</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {THEME_OPTIONS.map((theme) => {
                const selected = form.theme_key === theme.key;
                return (
                  <button
                    key={theme.key}
                    type="button"
                    onClick={() => updateField("theme_key", theme.key)}
                    className={[
                      "rounded-2xl border p-4 text-left transition",
                      selected
                        ? "border-emerald-500 bg-emerald-50 shadow-sm ring-1 ring-emerald-500/30"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <StorefrontThemePreview
                      themeKey={theme.key}
                      layoutKey={form.layout_key}
                      storefrontTitle={previewTitle}
                      logoUrl={previewLogoUrl}
                      brandPrimaryColor={form.brand_primary_color || null}
                      brandAccentColor={form.brand_accent_color || null}
                    />
                    <p className="mt-4 text-sm font-semibold text-slate-900">{theme.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{theme.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <LayoutGrid className="size-4 text-emerald-700" />
              <span>Vitrin düzeni</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {LAYOUT_OPTIONS.map((layout) => {
                const selected = form.layout_key === layout.key;
                return (
                  <button
                    key={layout.key}
                    type="button"
                    onClick={() => updateField("layout_key", layout.key)}
                    className={[
                      "rounded-2xl border p-4 text-left transition",
                      selected
                        ? "border-emerald-500 bg-emerald-50 shadow-sm ring-1 ring-emerald-500/30"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <StorefrontThemePreview
                      themeKey={form.theme_key}
                      layoutKey={layout.key}
                      storefrontTitle={previewTitle}
                      logoUrl={previewLogoUrl}
                      brandPrimaryColor={form.brand_primary_color || null}
                      brandAccentColor={form.brand_accent_color || null}
                    />
                    <p className="mt-4 text-sm font-semibold text-slate-900">{layout.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{layout.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {canUseAdvancedAppearance ? (
            <>
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Type className="size-4 text-emerald-700" />
                  <span>Font, kart ve header</span>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <OptionPicker
                    label="Font"
                    options={FONT_OPTIONS.map((option) => ({
                      key: option.key,
                      title: option.title,
                      description: option.description,
                    }))}
                    value={form.font_key}
                    onChange={(value) => updateField("font_key", value as ThemeFormState["font_key"])}
                  />
                  <OptionPicker
                    label="Ürün kart stili"
                    options={PRODUCT_CARD_STYLE_OPTIONS}
                    value={form.product_card_style}
                    onChange={(value) =>
                      updateField("product_card_style", value as StorefrontProductCardStyle)
                    }
                  />
                  <OptionPicker
                    label="Header stili"
                    options={HEADER_STYLE_OPTIONS}
                    value={form.header_style_key}
                    onChange={(value) =>
                      updateField("header_style_key", value as StorefrontHeaderStyleKey)
                    }
                  />
                  <OptionPicker
                    label="Footer stili"
                    options={FOOTER_STYLE_OPTIONS}
                    value={form.footer_style_key}
                    onChange={(value) =>
                      updateField("footer_style_key", value as StorefrontFooterStyleKey)
                    }
                  />
                </div>
              </div>
            </>
          ) : null}

          {canEditHomepageBlocks ? (
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles className="size-4 text-emerald-700" />
                <span>Ana sayfa blokları</span>
              </div>
              <div className="space-y-3">
                {form.homepage_blocks
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((block, index, blocks) => (
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
                              updateField(
                                "homepage_blocks",
                                form.homepage_blocks.map((item) =>
                                  item.id === block.id
                                    ? { ...item, visible: event.target.checked }
                                    : item,
                                ),
                              );
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
                          disabled={index === blocks.length - 1}
                          onClick={() => moveHomepageBlock(block.id, "down")}
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6">
            {saveMessage ? <p className="text-sm text-emerald-700">{saveMessage}</p> : null}
          </div>
          <Button type="submit" disabled={savePending}>
            {savePending ? "Kaydediliyor..." : "Görünüm ayarlarını kaydet"}
          </Button>
        </div>
      </Card>
    </form>
  );
}

function OptionPicker<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ key: T; title: string; description: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <div className="grid gap-2">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={[
              "rounded-xl border px-3 py-2 text-left transition",
              value === option.key
                ? "border-emerald-500 bg-emerald-50"
                : "border-slate-200 bg-white hover:bg-slate-50",
            ].join(" ")}
          >
            <p className="text-sm font-semibold text-slate-900">{option.title}</p>
            <p className="text-xs text-slate-500">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
