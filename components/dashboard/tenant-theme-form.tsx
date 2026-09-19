"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, LayoutGrid, Palette, RotateCcw, Sparkles, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SettingsTabs } from "@/components/dashboard/settings-tabs";
import { Input } from "@/components/ui/input";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { StorefrontThemePreview } from "@/components/dashboard/storefront-theme-preview";
import type {
  ProductImageBackgroundKey,
  RecommendationMode,
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
import { STOREFRONT_THEME_PRESETS, type StorefrontThemePreset } from "@/lib/storefront/theme-presets";
import {
  BRAND_COLOR_PRESETS,
  DEFAULT_STOREFRONT_APPEARANCE,
  FOOTER_STYLE_OPTIONS,
  HEADER_STYLE_OPTIONS,
  PRODUCT_CARD_STYLE_OPTIONS,
  PRODUCT_IMAGE_BACKGROUND_OPTIONS,
} from "@/lib/storefront/appearance-catalog";
import { hasPlanFeature } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

interface ThemeFormState {
  theme_key: StorefrontThemeKey;
  layout_key: StorefrontLayoutKey;
  brand_primary_color: string;
  brand_accent_color: string;
  font_key: TenantStorefrontSettings["font_key"];
  product_card_style: StorefrontProductCardStyle;
  product_image_background: ProductImageBackgroundKey;
  header_style_key: StorefrontHeaderStyleKey;
  footer_style_key: StorefrontFooterStyleKey;
  recommendation_mode: RecommendationMode;
}

type ThemeFormTab = "presets" | "brand" | "theme" | "layout" | "recommendations" | "appearance";

const THEME_FORM_TABS: Array<{
  key: ThemeFormTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "presets", label: "Hazır Paketler", icon: Sparkles },
  { key: "brand", label: "Marka Renkleri", icon: Palette },
  { key: "theme", label: "Hazır Tema", icon: Palette },
  { key: "layout", label: "Vitrin Düzeni", icon: LayoutGrid },
  { key: "recommendations", label: "Sepet Önerileri", icon: Sparkles },
  { key: "appearance", label: "Yazı Tipi ve Stiller", icon: Type },
];

function toThemeFormState(settings: TenantStorefrontSettings): ThemeFormState {
  return {
    theme_key: settings.theme_key,
    layout_key: settings.layout_key ?? "classic-grid",
    brand_primary_color: settings.brand_primary_color ?? "",
    brand_accent_color: settings.brand_accent_color ?? "",
    font_key: settings.font_key ?? "inter",
    product_card_style: settings.product_card_style ?? "standard",
    product_image_background: settings.product_image_background ?? "theme",
    header_style_key: settings.header_style_key ?? "standard",
    footer_style_key: settings.footer_style_key ?? "standard",
    recommendation_mode: settings.recommendation_mode ?? "auto",
  };
}

function buildAppearancePayload(
  form: ThemeFormState,
  options: {
    canUseAdvancedAppearance: boolean;
  },
) {
  return {
    theme_key: form.theme_key,
    layout_key: form.layout_key,
    brand_primary_color: form.brand_primary_color || null,
    brand_accent_color: form.brand_accent_color || null,
    recommendation_mode: form.recommendation_mode,
    ...(options.canUseAdvancedAppearance
      ? {
          font_key: form.font_key,
          product_card_style: form.product_card_style,
          product_image_background: form.product_image_background,
          header_style_key: form.header_style_key,
          footer_style_key: form.footer_style_key,
        }
      : {}),
  };
}

function toDefaultThemeFormState(): ThemeFormState {
  return {
    theme_key: DEFAULT_STOREFRONT_APPEARANCE.theme_key,
    layout_key: DEFAULT_STOREFRONT_APPEARANCE.layout_key,
    brand_primary_color: "",
    brand_accent_color: "",
    font_key: DEFAULT_STOREFRONT_APPEARANCE.font_key,
    product_card_style: DEFAULT_STOREFRONT_APPEARANCE.product_card_style,
    product_image_background: DEFAULT_STOREFRONT_APPEARANCE.product_image_background,
    header_style_key: DEFAULT_STOREFRONT_APPEARANCE.header_style_key,
    footer_style_key: DEFAULT_STOREFRONT_APPEARANCE.footer_style_key,
    recommendation_mode: "auto",
  };
}

export function TenantThemeForm({
  initialStorefrontSettings,
  tenantPlan,
  companyName,
  previewUrl,
  autoApply,
}: {
  initialStorefrontSettings: TenantStorefrontSettings;
  tenantPlan: TenantPlan;
  companyName: string;
  previewUrl?: string;
  autoApply?: {
    preset?: string; theme?: string; layout?: string; header?: string;
    footer?: string; hero?: string; bp?: string; ba?: string;
  } | null;
}) {
  const [form, setForm] = useState<ThemeFormState>(
    toThemeFormState(initialStorefrontSettings),
  );
  const [activeTab, setActiveTab] = useState<ThemeFormTab>("presets");
  const [savePending, startSaveTransition] = useTransition();
  const [resetPending, startResetTransition] = useTransition();
  const [applyingPresetKey, setApplyingPresetKey] = useState<string | null>(null);
  const [applyPending, startApplyTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const router = useRouter();
  const canUseAdvancedAppearance = hasPlanFeature(tenantPlan, "advanced_appearance");

  const previewTitle = initialStorefrontSettings.storefront_title ?? "";
  const previewLogoUrl = initialStorefrontSettings.logo_url;
  // "Önizle": yeni sekmede gerçek mağaza, seçili (kaydedilmemiş) temayla.
  const themePreviewHref = previewUrl
    ? `${previewUrl}&theme=${encodeURIComponent(form.theme_key)}&layout=${encodeURIComponent(form.layout_key)}&header=${encodeURIComponent(form.header_style_key)}&footer=${encodeURIComponent(form.footer_style_key)}${form.brand_primary_color ? `&bp=${encodeURIComponent(form.brand_primary_color)}` : ""}${form.brand_accent_color ? `&ba=${encodeURIComponent(form.brand_accent_color)}` : ""}`
    : null;
  const presetPreviewHref = (key: string) => (previewUrl ? `${previewUrl}&preset=${encodeURIComponent(key)}` : null);

  function updateField<K extends keyof ThemeFormState>(key: K, value: ThemeFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveMessage(null);
  }

  function saveAppearancePayload(
    nextForm: ThemeFormState,
    successMessage: string,
    transition: typeof startSaveTransition,
  ) {
    setSaveMessage(null);

    transition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildAppearancePayload(nextForm, {
            canUseAdvancedAppearance,
          }),
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        setSaveMessage(result.error ?? "Tema ayarları kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings) {
        setForm(toThemeFormState(result.storefrontSettings));
      } else {
        setForm(nextForm);
      }

      setSaveMessage(successMessage);
      router.refresh();
    });
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveAppearancePayload(form, "Tema ayarları kaydedildi.", startSaveTransition);
  }

  function resetAppearance() {
    const confirmed = window.confirm(
      "Marka renkleri ve görünüm ayarları varsayılana dönecek. Devam edilsin mi?",
    );

    if (!confirmed) {
      return;
    }

    saveAppearancePayload(
      toDefaultThemeFormState(),
      "Görünüm ayarları varsayılana sıfırlandı.",
      startResetTransition,
    );
  }

  function applyPreset(preset: StorefrontThemePreset, opts?: { skipConfirm?: boolean }) {
    const confirmed =
      opts?.skipConfirm ||
      window.confirm(
        `"${preset.title}" paketini uygulamak istediğinize emin misiniz? Tema, düzen ve görünüm ayarlarınız bu pakete göre değişecek.`,
      );

    if (!confirmed) {
      return;
    }

    setApplyingPresetKey(preset.key);
    setSaveMessage(null);

    startApplyTransition(async () => {
      const payload = {
        theme_key: preset.settings.theme_key,
        layout_key: preset.settings.layout_key,
        brand_primary_color: null,
        brand_accent_color: null,
        recommendation_mode: form.recommendation_mode,
        ...(canUseAdvancedAppearance
          ? {
              font_key: preset.settings.font_key,
              product_card_style: preset.settings.product_card_style,
              header_style_key: preset.settings.header_style_key,
              footer_style_key: preset.settings.footer_style_key,
              hero_style_key: preset.settings.hero_style_key,
            }
          : {}),
      };

      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setApplyingPresetKey(null);
        setSaveMessage(result.error ?? "Tema paketi uygulanamadı.");
        return;
      }

      if (result.storefrontSettings) {
        setForm(toThemeFormState(result.storefrontSettings));
      }

      setApplyingPresetKey(null);
      setSaveMessage(`"${preset.title}" paketi uygulandı.`);
      router.refresh();
    });
  }

  // Önizleme sekmesinden "Bu temayı uygula" ile gelindiyse (?apply=1) bir kez
  // otomatik uygula, sonra adresi temizle.
  useEffect(() => {
    if (!autoApply) return;
    // Bir mikro görev sonra: effect içinde doğrudan setState kuralına takılmasın.
    const timer = setTimeout(() => {
    const preset = autoApply.preset ? STOREFRONT_THEME_PRESETS.find((x) => x.key === autoApply.preset) : null;
    if (preset) {
      applyPreset(preset, { skipConfirm: true });
    } else {
      const payload: Record<string, unknown> = {};
      if (autoApply.theme) payload.theme_key = autoApply.theme;
      if (autoApply.layout) payload.layout_key = autoApply.layout;
      if (autoApply.bp !== undefined) payload.brand_primary_color = autoApply.bp || null;
      if (autoApply.ba !== undefined) payload.brand_accent_color = autoApply.ba || null;
      if (canUseAdvancedAppearance) {
        if (autoApply.header) payload.header_style_key = autoApply.header;
        if (autoApply.footer) payload.footer_style_key = autoApply.footer;
        if (autoApply.hero) payload.hero_style_key = autoApply.hero;
      }
      if (Object.keys(payload).length) {
        startApplyTransition(async () => {
          const response = await fetch("/api/tenant/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const result = await response.json();
          if (response.ok && result.storefrontSettings) setForm(toThemeFormState(result.storefrontSettings));
          setSaveMessage(response.ok ? "Önizlediğiniz tema uygulandı." : result.error ?? "Tema uygulanamadı.");
          router.refresh();
        });
      }
    }
    router.replace("/settings/theme");
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız ilk açılışta
  }, []);

  return (
    <form onSubmit={save}>
      <div className="space-y-6">
        <Card className="overflow-hidden p-0">
          <SettingsTabs
            tabs={THEME_FORM_TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
            layoutId="theme-form-tab-indicator"
          />

          <div className="p-5">
            {activeTab === "presets" ? (
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-emerald-700" />
                  <h2 className="text-lg font-semibold text-slate-900">Hazır paketler</h2>
                </div>
                <p className="mt-1 mb-4 text-sm text-slate-600">
                  Sektörünüze uygun paketi seçin. <strong>Önizle</strong> ile mağazanız yeni sekmede
                  o temayla, kendi ürünlerinizle açılır; beğenirseniz oradan ya da buradan uygulayın.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {STOREFRONT_THEME_PRESETS.map((preset) => {
                    const isSelected =
                      form.theme_key === preset.settings.theme_key &&
                      form.layout_key === preset.settings.layout_key &&
                      form.header_style_key === preset.settings.header_style_key &&
                      form.footer_style_key === preset.settings.footer_style_key;
                    const isApplying = applyPending && applyingPresetKey === preset.key;
                    const href = presetPreviewHref(preset.key);

                    return (
                      <div
                        key={preset.key}
                        className={cn(
                          "flex flex-col overflow-hidden rounded-2xl border",
                          isSelected
                            ? "border-emerald-500 ring-1 ring-emerald-500/30"
                            : "border-slate-200 bg-white",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- statik küçük resim */}
                        <img
                          src={preset.thumbnailDesktop}
                          alt={`${preset.title} önizleme`}
                          className="h-40 w-full object-cover object-top"
                          loading="lazy"
                        />
                        <div className="flex flex-1 flex-col p-4">
                          <p className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                            {preset.sector}
                          </p>
                          <h3 className="mt-1.5 text-base font-semibold text-slate-900">{preset.title}</h3>
                          <p className="mt-1 flex-1 text-sm leading-6 text-slate-500">{preset.description}</p>
                          <div className="mt-4 flex gap-2">
                            {href ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                              >
                                <ExternalLink className="size-4" />
                                Önizle
                              </a>
                            ) : null}
                            <Button
                              type="button"
                              className="flex-1"
                              variant={isSelected ? "secondary" : "primary"}
                              disabled={applyPending}
                              onClick={() => applyPreset(preset)}
                            >
                              {isApplying ? "Uygulanıyor..." : isSelected ? "Uygulandı" : "Uygula"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {activeTab === "brand" ? (
              <div>
                <div className="flex items-center gap-2">
                  <Palette className="size-5 text-emerald-700" />
                  <h2 className="text-lg font-semibold text-slate-900">Marka renkleri</h2>
                </div>
                <p className="mt-1 mb-4 text-sm text-slate-600">
                  Logonuza uygun renkleri seçin veya hazır paletlerden birini kullanın.
                </p>
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
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Nerede kullanılır: <strong>Sepete ekle</strong> butonları, ürün{" "}
                      <strong>fiyatları</strong>, aktif <strong>kategori</strong> vurguları ve
                      sepet ikonu üzerindeki sayı rozeti.
                    </p>
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
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Nerede kullanılır: ürün kartlarındaki{" "}
                      <strong>varyant/model rozetleri</strong> (ör. &quot;3 Model&quot;, sepete
                      eklenen varyant sayısı).
                    </p>
                  </div>
                </div>

                <BrandColorPreview
                  primary={form.brand_primary_color || "#059669"}
                  accent={form.brand_accent_color || "#10b981"}
                />

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
            ) : null}

            {activeTab === "theme" ? (
              <div>
                <div className="flex items-center gap-2">
                  <Palette className="size-5 text-emerald-700" />
                  <h2 className="text-lg font-semibold text-slate-900">Hazır tema</h2>
                </div>
                <p className="mt-1 mb-4 text-sm text-slate-600">
                  Vitrininizin genel görünümünü belirleyen temayı seçin.
                </p>
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

                <div className="mt-8 border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-semibold text-slate-900">Seçili temayı mağazanızda görün</h3>
                  <p className="mt-1 mb-4 text-sm text-slate-600">
                    Mağazanız yeni sekmede seçtiğiniz temayla, kendi ürünlerinizle açılır. Şifre
                    sorarsa mağaza şifrenizi bir kez girin. Beğenirseniz oradan &quot;Bu temayı uygula&quot; deyin.
                  </p>
                  {themePreviewHref ? (
                    <a
                      href={themePreviewHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      <ExternalLink className="size-4" />
                      Mağazada önizle
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            {activeTab === "layout" ? (
              <div>
                <div className="flex items-center gap-2">
                  <LayoutGrid className="size-5 text-emerald-700" />
                  <h2 className="text-lg font-semibold text-slate-900">Vitrin düzeni</h2>
                </div>
                <p className="mt-1 mb-4 text-sm text-slate-600">
                  Ürünlerin ve kategorilerin vitrinde nasıl dizileceğini seçin.
                </p>
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
            ) : null}

            {activeTab === "recommendations" ? (
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-emerald-700" />
                  <h2 className="text-lg font-semibold text-slate-900">Sepet ürün önerileri</h2>
                </div>
                <p className="mt-1 mb-4 text-sm text-slate-600">
                  &quot;Bunları da beğenebilirsiniz&quot; alanında müşteriye hangi ürünlerin
                  önerileceğini seçin.
                </p>
                <OptionPicker
                  label="Öneri modu"
                  options={[
                    {
                      key: "auto" as RecommendationMode,
                      title: "Otomatik",
                      description: "Sepetteki ürünler hariç, katalogdan otomatik ürün önerilir.",
                    },
                    {
                      key: "manual" as RecommendationMode,
                      title: "Manuel (seçtiğim ürünler)",
                      description:
                        "Ürün listesinde işaretlediğiniz ürünler önerilir. Ürünler yönetimi sayfasından işaretleyin.",
                    },
                  ]}
                  value={form.recommendation_mode}
                  onChange={(value) => updateField("recommendation_mode", value)}
                />
              </div>
            ) : null}

            {activeTab === "appearance" ? (
              <PlanFeatureGate
                feature="advanced_appearance"
                plan={tenantPlan}
                companyName={companyName}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Type className="size-5 text-emerald-700" />
                    <h2 className="text-lg font-semibold text-slate-900">Yazı tipi ve stiller</h2>
                  </div>
                  <p className="mt-1 mb-4 text-sm text-slate-600">
                    Font, ürün kartı, header ve footer stillerini özelleştirin.
                  </p>
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
                      label="Ürün görseli arka planı"
                      options={PRODUCT_IMAGE_BACKGROUND_OPTIONS}
                      value={form.product_image_background}
                      onChange={(value) =>
                        updateField(
                          "product_image_background",
                          value as ProductImageBackgroundKey,
                        )
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
              </PlanFeatureGate>
            ) : null}
          </div>
        </Card>

        <div className="sticky bottom-0 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6">
              {saveMessage ? <p className="text-sm text-emerald-700">{saveMessage}</p> : null}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="secondary"
                disabled={savePending || resetPending}
                onClick={resetAppearance}
              >
                <RotateCcw className="size-4" />
                {resetPending ? "Sıfırlanıyor..." : "Ayarları sıfırla"}
              </Button>
              <Button type="submit" disabled={savePending || resetPending}>
                {savePending ? "Kaydediliyor..." : "Görünüm ayarlarını kaydet"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

// Müşterinin seçtiği renklerin mağazada gerçekte nasıl göründüğünü canlı
// gösteren küçük önizleme; renklerin "nerede kullanılacağını" metinden çok
// daha net anlatır.
function BrandColorPreview({ primary, accent }: { primary: string; accent: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <span
        className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm"
        style={{ backgroundColor: primary }}
      >
        Sepete Ekle
      </span>
      <span className="text-base font-extrabold" style={{ color: primary }}>
        ₺1.250
      </span>
      <span
        className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{ backgroundColor: `${accent}26`, color: accent }}
      >
        3 Model
      </span>
    </div>
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
