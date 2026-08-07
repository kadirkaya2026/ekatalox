"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CalendarDays, Globe, ImageUp, LoaderCircle, Moon, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TenantStorefrontSettings } from "@/lib/types";
import {
  STOREFRONT_LOCALES,
  type StorefrontLocale,
} from "@/lib/storefront/i18n/dictionary";
import {
  allowedFaviconMimeTypes,
  allowedLogoMimeTypes,
  maxFaviconFileSizeBytes,
  maxLogoFileSizeBytes,
} from "@/lib/validators/storefront-settings";
import { cn, formatDateSlashTr } from "@/lib/utils";

const STOREFRONT_LOCALE_LABELS: Record<StorefrontLocale, string> = {
  tr: "Türkçe",
  de: "Almanca (Deutsch)",
  en: "İngilizce (English)",
  ru: "Rusça (Русский)",
};

type SiteIdentityTab =
  | "brand"
  | "tabTitle"
  | "locale"
  | "favicon"
  | "priceDate"
  | "themeToggle";

const SITE_IDENTITY_TABS: Array<{ key: SiteIdentityTab; label: string }> = [
  { key: "brand", label: "Logo, Başlık ve Açıklama" },
  { key: "tabTitle", label: "Tarayıcı Sekme Başlığı" },
  { key: "locale", label: "Vitrin Dili" },
  { key: "favicon", label: "Favicon" },
  { key: "priceDate", label: "Fiyat Güncelleme Tarihi" },
  { key: "themeToggle", label: "Gece/Gündüz Modu" },
];

export function TenantSiteIdentityForm({
  initialStorefrontSettings,
}: {
  initialStorefrontSettings: TenantStorefrontSettings;
}) {
  const [activeTab, setActiveTab] = useState<SiteIdentityTab>("brand");
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
  const [defaultLocale, setDefaultLocale] = useState<StorefrontLocale>(
    initialStorefrontSettings.default_locale ?? "tr",
  );
  const [priceUpdateDate, setPriceUpdateDate] = useState(
    initialStorefrontSettings.price_update_date ?? "",
  );
  const [isPriceUpdateDateVisible, setIsPriceUpdateDateVisible] = useState(
    initialStorefrontSettings.is_price_update_date_visible ?? false,
  );
  const [isThemeToggleVisible, setIsThemeToggleVisible] = useState(
    initialStorefrontSettings.is_theme_toggle_visible ?? true,
  );
  const [logoPending, startLogoTransition] = useTransition();
  const [storefrontSavePending, startStorefrontSaveTransition] = useTransition();
  const [faviconPending, startFaviconTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [localePending, startLocaleTransition] = useTransition();
  const [priceDateSavePending, startPriceDateSaveTransition] = useTransition();
  const [themeTogglePending, startThemeToggleTransition] = useTransition();
  const router = useRouter();
  const [logoMessage, setLogoMessage] = useState<string | null>(null);
  const [storefrontSaveMessage, setStorefrontSaveMessage] = useState<string | null>(null);
  const [faviconMessage, setFaviconMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [localeMessage, setLocaleMessage] = useState<string | null>(null);
  const [priceDateSaveMessage, setPriceDateSaveMessage] = useState<string | null>(null);
  const [themeToggleSaveMessage, setThemeToggleSaveMessage] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState<string | null>(null);
  const [storefrontTitleError, setStorefrontTitleError] = useState<string | null>(null);
  const [storefrontDescriptionError, setStorefrontDescriptionError] = useState<string | null>(
    null,
  );
  const [titleError, setTitleError] = useState<string | null>(null);
  const [priceDateError, setPriceDateError] = useState<string | null>(null);

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

  function saveDefaultLocale(nextLocale: StorefrontLocale) {
    setDefaultLocale(nextLocale);
    setLocaleMessage(null);

    startLocaleTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_locale: nextLocale }),
      });

      const result = await response.json();

      if (!response.ok) {
        setLocaleMessage(result.error ?? "Vitrin dili kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings?.default_locale) {
        setDefaultLocale(result.storefrontSettings.default_locale as StorefrontLocale);
      }

      setLocaleMessage("Vitrin dili kaydedildi.");
      router.refresh();
    });
  }

  function savePriceUpdateDate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPriceDateSaveMessage(null);
    setPriceDateError(null);

    if (isPriceUpdateDateVisible && !priceUpdateDate) {
      setPriceDateError("Vitrinde göstermek için fiyat güncelleme tarihi zorunludur.");
      return;
    }

    startPriceDateSaveTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_update_date: priceUpdateDate || null,
          is_price_update_date_visible: isPriceUpdateDateVisible,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setPriceDateSaveMessage(result.error ?? "Vitrin ayarları kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings) {
        setPriceUpdateDate(result.storefrontSettings.price_update_date ?? "");
        setIsPriceUpdateDateVisible(
          result.storefrontSettings.is_price_update_date_visible ?? false,
        );
      }

      setPriceDateSaveMessage("Vitrin ayarları kaydedildi.");
      router.refresh();
    });
  }

  function saveThemeToggleVisible(nextValue: boolean) {
    setIsThemeToggleVisible(nextValue);
    setThemeToggleSaveMessage(null);

    startThemeToggleTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_theme_toggle_visible: nextValue }),
      });

      const result = await response.json();

      if (!response.ok) {
        setThemeToggleSaveMessage(result.error ?? "Ayar kaydedilemedi.");
        setIsThemeToggleVisible(!nextValue);
        return;
      }

      if (result.storefrontSettings) {
        setIsThemeToggleVisible(result.storefrontSettings.is_theme_toggle_visible ?? true);
      }

      setThemeToggleSaveMessage("Ayar kaydedildi.");
      router.refresh();
    });
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap border-b border-slate-100">
        {SITE_IDENTITY_TABS.map((tab) => (
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
      {activeTab === "brand" ? (
      <div>
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
      </div>
      ) : null}

      {activeTab === "tabTitle" ? (
      <div>
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
      </div>
      ) : null}

      {activeTab === "locale" ? (
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Globe className="size-4 text-emerald-700" />
          <span>Vitrin dili</span>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Mağazanıza ilk kez gelen (henüz dil seçmemiş) ziyaretçiye vitrin hangi dilde
          açılsın? Ziyaretçi dilerse header&apos;daki dil seçiciyle kendi tarayıcısında
          farklı bir dile geçebilir; bu ayar yalnızca varsayılanı belirler. Yalnızca sabit
          arayüz metinleri (Sepete Ekle, Sepetim vb.) çevrilir — ürün adı/açıklaması siz ne
          yazdıysanız aynen görünür.
        </p>

        <div className="flex flex-wrap gap-2">
          {STOREFRONT_LOCALES.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={localePending}
              onClick={() => saveDefaultLocale(option.value)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                defaultLocale === option.value
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/40"
              }`}
            >
              {STOREFRONT_LOCALE_LABELS[option.value]}
            </button>
          ))}
        </div>

        <div className="mt-3 min-h-6">
          {localePending ? (
            <p className="text-sm text-slate-500">Kaydediliyor...</p>
          ) : localeMessage ? (
            <p className="text-sm text-emerald-700">{localeMessage}</p>
          ) : null}
        </div>
      </div>
      ) : null}

      {activeTab === "favicon" ? (
      <div>
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
      </div>
      ) : null}

      {activeTab === "priceDate" ? (
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <CalendarDays className="size-4 text-emerald-700" />
          <span>Fiyat Güncelleme Tarihi</span>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Vitrin anasayfasında logo yanındaki mağaza adının altında fiyat güncelleme
          tarihini gösterebilirsiniz.
        </p>

        <form onSubmit={savePriceUpdateDate} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Fiyat güncelleme tarihi
            </label>
            <Input
              type="date"
              value={priceUpdateDate}
              onChange={(event) => {
                setPriceUpdateDate(event.target.value);
                setPriceDateSaveMessage(null);
                setPriceDateError(null);
              }}
            />
            {priceDateError ? (
              <p className="mt-2 text-sm text-amber-700">{priceDateError}</p>
            ) : (
              <p className="mt-2 text-xs text-slate-400">
                Tarih, vitrinde gg/aa/yyyy formatında gösterilir.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Vitrinde göster</p>
                <p className="mt-1 text-sm text-slate-500">
                  Açıkken tarih, mağaza adının altında görünür.
                </p>
                {isPriceUpdateDateVisible && priceUpdateDate ? (
                  <p className="mt-2 text-sm text-slate-600">
                    Önizleme: Fiyat Güncelleme Tarihi :{" "}
                    {formatDateSlashTr(priceUpdateDate)}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPriceUpdateDateVisible((current) => !current);
                  setPriceDateSaveMessage(null);
                  setPriceDateError(null);
                }}
                aria-pressed={isPriceUpdateDateVisible}
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                  isPriceUpdateDateVisible ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition ${
                    isPriceUpdateDateVisible ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6">
              {priceDateSaveMessage ? (
                <p
                  className={`text-sm ${
                    priceDateSaveMessage.includes("kaydedildi")
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {priceDateSaveMessage}
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={priceDateSavePending}>
              {priceDateSavePending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </div>
      ) : null}

      {activeTab === "themeToggle" ? (
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Moon className="size-4 text-emerald-700" />
          <span>Gece/Gündüz Modu</span>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Vitrin üst menüsünde müşterilerin gece/gündüz modu arasında geçiş yapabildiği
          butonu açıp kapatabilirsiniz.
        </p>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Vitrinde göster</p>
              <p className="mt-1 text-sm text-slate-500">
                Açıkken müşteriler vitrin üst menüsünden tema değiştirebilir.
              </p>
            </div>
            <button
              type="button"
              onClick={() => saveThemeToggleVisible(!isThemeToggleVisible)}
              disabled={themeTogglePending}
              aria-pressed={isThemeToggleVisible}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                isThemeToggleVisible ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition ${
                  isThemeToggleVisible ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="min-h-6 mt-3">
          {themeToggleSaveMessage ? (
            <p
              className={`text-sm ${
                themeToggleSaveMessage.includes("kaydedildi")
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
            >
              {themeToggleSaveMessage}
            </p>
          ) : null}
        </div>
      </div>
      ) : null}
      </div>
    </Card>
  );
}
