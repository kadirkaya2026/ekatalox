"use client";

import { useState, useTransition } from "react";
import { LayoutGrid, LoaderCircle, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StorefrontThemePreview } from "@/components/dashboard/storefront-theme-preview";
import type { StorefrontLayoutKey, StorefrontThemeKey, TenantStorefrontSettings } from "@/lib/types";
import { THEME_OPTIONS } from "@/lib/storefront/theme-catalog";
import { LAYOUT_OPTIONS } from "@/lib/storefront/layout-catalog";

interface ThemeFormState {
  storefront_description: string;
  theme_key: StorefrontThemeKey;
  layout_key: StorefrontLayoutKey;
}

function toThemeFormState(settings: TenantStorefrontSettings): ThemeFormState {
  return {
    storefront_description: settings.storefront_description ?? "",
    theme_key: settings.theme_key,
    layout_key: settings.layout_key ?? "classic-grid",
  };
}

export function TenantThemeForm({
  initialStorefrontSettings,
}: {
  initialStorefrontSettings: TenantStorefrontSettings;
}) {
  const [form, setForm] = useState<ThemeFormState>(
    toThemeFormState(initialStorefrontSettings),
  );
  const [savePending, startSaveTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ThemeFormState, string>>>({});

  const previewTitle = initialStorefrontSettings.storefront_title ?? "";
  const previewLogoUrl = initialStorefrontSettings.logo_url;

  function updateField<K extends keyof ThemeFormState>(key: K, value: ThemeFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveMessage(null);
    setErrors((current) => ({ ...current, [key]: undefined }));
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
          storefront_description: form.storefront_description,
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
    });
  }

  return (
    <form onSubmit={save}>
      <Card className="p-5">
        <div className="space-y-8">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                    />
                    <p className="mt-4 text-sm font-semibold text-slate-900">{layout.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{layout.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Kısa açıklama
            </label>
            <Textarea
              value={form.storefront_description}
              onChange={(event) => updateField("storefront_description", event.target.value)}
              placeholder="Mağazanızı 1-2 cümle ile anlatın."
            />
            {errors.storefront_description ? (
              <p className="mt-2 text-sm text-amber-700">{errors.storefront_description}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6">
            {saveMessage ? (
              <p className="text-sm text-emerald-700">{saveMessage}</p>
            ) : null}
          </div>
          <Button type="submit" disabled={savePending}>
            {savePending ? "Kaydediliyor..." : "Tema ayarlarını kaydet"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
