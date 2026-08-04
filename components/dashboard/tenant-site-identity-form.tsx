"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Globe, ImageUp, LoaderCircle, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TenantStorefrontSettings } from "@/lib/types";
import {
  allowedFaviconMimeTypes,
  allowedLogoMimeTypes,
  maxFaviconFileSizeBytes,
  maxLogoFileSizeBytes,
} from "@/lib/validators/storefront-settings";

export function TenantSiteIdentityForm({
  initialStorefrontSettings,
}: {
  initialStorefrontSettings: TenantStorefrontSettings;
}) {
  const [storefrontTitle, setStorefrontTitle] = useState(
    initialStorefrontSettings.storefront_title ?? "",
  );
  const [storefrontDescription, setStorefrontDescription] = useState(
    initialStorefrontSettings.storefront_description ?? "",
  );
  const [logoUrl, setLogoUrl] = useState(initialStorefrontSettings.logo_url ?? null);
  const [siteTabTitle, setSiteTabTitle] = useState(
    initialStorefrontSettings.site_tab_title ?? "",
  );
  const [faviconUrl, setFaviconUrl] = useState(
    initialStorefrontSettings.site_favicon_url ?? null,
  );
  const [logoPending, startLogoTransition] = useTransition();
  const [storefrontSavePending, startStorefrontSaveTransition] = useTransition();
  const [faviconPending, startFaviconTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const router = useRouter();
  const [logoMessage, setLogoMessage] = useState<string | null>(null);
  const [storefrontSaveMessage, setStorefrontSaveMessage] = useState<string | null>(null);
  const [faviconMessage, setFaviconMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState<string | null>(null);
  const [storefrontTitleError, setStorefrontTitleError] = useState<string | null>(null);
  const [storefrontDescriptionError, setStorefrontDescriptionError] = useState<string | null>(
    null,
  );
  const [titleError, setTitleError] = useState<string | null>(null);

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
        setLogoUrl(result.storefrontSettings.logo_url as string);
      }

      setLogoError(null);
      setLogoMessage("Logo başarıyla güncellendi.");
      router.refresh();
    });
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setLogoMessage(null);
    setLogoError(null);

    if (!file) return;

    if (!allowedLogoMimeTypes.includes(file.type as (typeof allowedLogoMimeTypes)[number])) {
      setLogoError("Logo yalnız PNG, JPEG veya WEBP olabilir.");
      return;
    }

    if (file.size > maxLogoFileSizeBytes) {
      setLogoError("Logo boyutu en fazla 1MB olabilir.");
      return;
    }

    uploadLogo(file);
  }

  function saveStorefrontIdentity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStorefrontSaveMessage(null);
    setStorefrontTitleError(null);
    setStorefrontDescriptionError(null);

    if (storefrontTitle.length > 80) {
      setStorefrontTitleError("Mağaza başlığı en fazla 80 karakter olabilir.");
      return;
    }

    if (storefrontDescription.length > 220) {
      setStorefrontDescriptionError("Açıklama en fazla 220 karakter olabilir.");
      return;
    }

    startStorefrontSaveTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storefront_title: storefrontTitle,
          storefront_description: storefrontDescription,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setStorefrontSaveMessage(result.error ?? "Mağaza kimliği kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings) {
        setStorefrontTitle(result.storefrontSettings.storefront_title ?? "");
        setStorefrontDescription(result.storefrontSettings.storefront_description ?? "");
        if (result.storefrontSettings.logo_url) {
          setLogoUrl(result.storefrontSettings.logo_url);
        }
      }

      setStorefrontSaveMessage("Mağaza kimliği kaydedildi.");
      router.refresh();
    });
  }

  function uploadFavicon(file: File) {
    startFaviconTransition(async () => {
      const formData = new FormData();
      formData.set("favicon", file);

      const response = await fetch("/api/tenant/settings/favicon", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setFaviconMessage(result.error ?? "Favicon yüklenemedi.");
        return;
      }

      if (result.storefrontSettings?.site_favicon_url) {
        setFaviconUrl(result.storefrontSettings.site_favicon_url as string);
      }

      setFaviconError(null);
      setFaviconMessage("Favicon başarıyla güncellendi.");
      router.refresh();
    });
  }

  function handleFaviconChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setFaviconMessage(null);
    setFaviconError(null);

    if (!file) return;

    if (
      !allowedFaviconMimeTypes.includes(
        file.type as (typeof allowedFaviconMimeTypes)[number],
      )
    ) {
      setFaviconError("Favicon yalnız PNG, JPEG, WEBP veya ICO olabilir.");
      return;
    }

    if (file.size > maxFaviconFileSizeBytes) {
      setFaviconError("Favicon boyutu en fazla 512KB olabilir.");
      return;
    }

    uploadFavicon(file);
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveMessage(null);
    setTitleError(null);

    if (siteTabTitle.length > 80) {
      setTitleError("Sekme başlığı en fazla 80 karakter olabilir.");
      return;
    }

    startSaveTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_tab_title: siteTabTitle }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSaveMessage(result.error ?? "Site kimliği kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings) {
        setSiteTabTitle(result.storefrontSettings.site_tab_title ?? "");
      }

      setSaveMessage("Site kimliği kaydedildi.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Store className="size-4 text-emerald-700" />
          <span>Mağaza logosu, başlık ve açıklama</span>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Vitrin header&apos;ında görünecek logo, mağaza adı ve kısa tanıtım metni. Tema
          önizlemelerinde de bu bilgiler kullanılır.
        </p>

        <form onSubmit={saveStorefrontIdentity} className="space-y-4">
          <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-300 hover:bg-emerald-50/40">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleLogoChange}
            />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="Mağaza logo önizlemesi"
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

          {logoError ? <p className="text-sm text-amber-700">{logoError}</p> : null}
          {logoMessage ? <p className="text-sm text-emerald-700">{logoMessage}</p> : null}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Mağaza başlığı
            </label>
            <Input
              value={storefrontTitle}
              onChange={(event) => {
                setStorefrontTitle(event.target.value);
                setStorefrontSaveMessage(null);
                setStorefrontTitleError(null);
              }}
              placeholder="Örn. Lucatech Toptan Teknoloji"
              maxLength={80}
            />
            {storefrontTitleError ? (
              <p className="mt-2 text-sm text-amber-700">{storefrontTitleError}</p>
            ) : null}
            <p className="mt-1 text-xs text-slate-400">{storefrontTitle.length}/80 karakter</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-900">
              Kısa açıklama
            </label>
            <Textarea
              value={storefrontDescription}
              onChange={(event) => {
                setStorefrontDescription(event.target.value);
                setStorefrontSaveMessage(null);
                setStorefrontDescriptionError(null);
              }}
              placeholder="Mağazanızı 1-2 cümle ile anlatın."
              maxLength={220}
            />
            {storefrontDescriptionError ? (
              <p className="mt-2 text-sm text-amber-700">{storefrontDescriptionError}</p>
            ) : null}
            <p className="mt-1 text-xs text-slate-400">
              {storefrontDescription.length}/220 karakter
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6">
              {storefrontSaveMessage ? (
                <p className="text-sm text-emerald-700">{storefrontSaveMessage}</p>
              ) : null}
            </div>
            <Button type="submit" disabled={storefrontSavePending}>
              {storefrontSavePending ? "Kaydediliyor..." : "Mağaza kimliğini kaydet"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Globe className="size-4 text-emerald-700" />
          <span>Tarayıcı sekme başlığı</span>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Müşterileriniz mağazanızı açtığında tarayıcı sekmesinde görünecek metin. Boş
          bırakılırsa mağaza başlığı kullanılır.
        </p>

        <form onSubmit={save} className="space-y-4">
          <div>
            <Input
              value={siteTabTitle}
              onChange={(event) => {
                setSiteTabTitle(event.target.value);
                setSaveMessage(null);
                setTitleError(null);
              }}
              placeholder="Örn. Lucatech Katalog"
              maxLength={80}
            />
            {titleError ? (
              <p className="mt-2 text-sm text-amber-700">{titleError}</p>
            ) : null}
            <p className="mt-1 text-xs text-slate-400">{siteTabTitle.length}/80 karakter</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6">
              {saveMessage ? (
                <p className="text-sm text-emerald-700">{saveMessage}</p>
              ) : null}
            </div>
            <Button type="submit" disabled={savePending}>
              {savePending ? "Kaydediliyor..." : "Sekme başlığını kaydet"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ImageUp className="size-4 text-emerald-700" />
          <span>Favicon (sekme ikonu)</span>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Tarayıcı sekmesinde ve yer imlerinde görünecek küçük ikon. PNG, JPEG, WEBP veya
          ICO formatında, en fazla 512KB.
        </p>

        <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-300 hover:bg-emerald-50/40">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/x-icon,image/vnd.microsoft.icon"
            className="hidden"
            onChange={handleFaviconChange}
          />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
              {faviconUrl ? (
                <Image
                  src={faviconUrl}
                  alt="Favicon önizlemesi"
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-400">
                  ico
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                Favicon seç veya buraya bırak
              </p>
              <p className="mt-1 text-sm text-slate-500">
                PNG, JPEG, WEBP veya ICO • Önerilen boyut: 32x32 veya 64x64 px • Maksimum 512KB
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                {faviconPending ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin text-emerald-700" />
                    Favicon yükleniyor...
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

        {faviconError ? (
          <p className="mt-3 text-sm text-amber-700">{faviconError}</p>
        ) : null}
        {faviconMessage ? (
          <p className="mt-3 text-sm text-emerald-700">{faviconMessage}</p>
        ) : null}
      </Card>
    </div>
  );
}
