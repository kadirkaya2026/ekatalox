"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ImageUp, LoaderCircle, Palette, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StorefrontThemePreview } from "@/components/dashboard/storefront-theme-preview";
import type { StorefrontThemeKey, TenantStorefrontSettings } from "@/lib/types";
import { THEME_OPTIONS } from "@/lib/storefront/theme-catalog";
import {
  allowedLogoMimeTypes,
  maxLogoFileSizeBytes,
} from "@/lib/validators/storefront-settings";

interface ThemeFormState {
  logo_url: string | null;
  storefront_title: string;
  storefront_description: string;
  theme_key: StorefrontThemeKey;
}

function toThemeFormState(settings: TenantStorefrontSettings): ThemeFormState {
  return {
    logo_url: settings.logo_url,
    storefront_title: settings.storefront_title ?? "",
    storefront_description: settings.storefront_description ?? "",
    theme_key: settings.theme_key,
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
  const [logoPending, startLogoTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [logoMessage, setLogoMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ThemeFormState | "logo", string>>>({});

  function updateField<K extends keyof ThemeFormState>(key: K, value: ThemeFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaveMessage(null);
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function uploadLogo(file: File) {
    startLogoTransition(async () => {
      const formData = new FormData();
      formData.set("logo", file);

      const response = await fetch("/api/tenant/settings/logo", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setLogoMessage(result.error ?? "Logo yüklenemedi.");
        return;
      }

      if (result.storefrontSettings?.logo_url) {
        setForm((current) => ({ ...current, logo_url: result.storefrontSettings.logo_url }));
      }

      setErrors((current) => ({ ...current, logo: undefined }));
      setLogoMessage("Logo başarıyla güncellendi.");
    });
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setLogoMessage(null);
    setErrors((current) => ({ ...current, logo: undefined }));

    if (!file) return;

    if (!allowedLogoMimeTypes.includes(file.type as (typeof allowedLogoMimeTypes)[number])) {
      setErrors({ logo: "Logo yalnız PNG, JPEG veya WEBP olabilir." });
      return;
    }

    if (file.size > maxLogoFileSizeBytes) {
      setErrors({ logo: "Logo boyutu en fazla 1MB olabilir." });
      return;
    }

    uploadLogo(file);
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
          storefront_title: form.storefront_title,
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
              <ImageUp className="size-4 text-emerald-700" />
              <span>Mağaza logosu</span>
            </div>

            <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-300 hover:bg-emerald-50/40">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {form.logo_url ? (
                    <Image
                      src={form.logo_url}
                      alt="Storefront logo önizlemesi"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <Store className="size-8 text-slate-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    Logo seç veya buraya bırak
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    PNG, JPEG veya WEBP • Maksimum 1MB
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                    {logoPending ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin text-emerald-700" />
                        Logo yükleniyor...
                      </>
                    ) : (
                      <>
                        <ImageUp className="size-4 text-emerald-700" />
                        Dosya seç
                      </>
                    )}
                  </div>
                </div>
              </div>
            </label>

            {errors.logo ? (
              <p className="mt-3 text-sm text-amber-700">{errors.logo}</p>
            ) : null}
            {logoMessage ? (
              <p className="mt-3 text-sm text-emerald-700">{logoMessage}</p>
            ) : null}
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
                      storefrontTitle={form.storefront_title}
                      logoUrl={form.logo_url}
                    />
                    <p className="mt-4 text-sm font-semibold text-slate-900">{theme.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{theme.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                Mağaza başlığı
              </label>
              <Input
                value={form.storefront_title}
                onChange={(event) => updateField("storefront_title", event.target.value)}
                placeholder="Örn. Lucatech Toptan Teknoloji"
              />
              {errors.storefront_title ? (
                <p className="mt-2 text-sm text-amber-700">{errors.storefront_title}</p>
              ) : null}
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
