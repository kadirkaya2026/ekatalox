"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  ImageUp,
  LoaderCircle,
  Palette,
  Plus,
  Store,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  BannerItem,
  Profile,
  StorefrontThemeKey,
  Tenant,
  TenantStorefrontSettings,
} from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  allowedLogoMimeTypes,
  maxLogoFileSizeBytes,
  storefrontSettingsSchema,
} from "@/lib/validators/storefront-settings";

const storefrontThemes: Array<{
  value: StorefrontThemeKey;
  title: string;
  description: string;
  previewClassName: string;
}> = [
  {
    value: "minimal",
    title: "Minimal",
    description: "Temiz, ferah ve sade e-ticaret vitrin dili.",
    previewClassName: "bg-gradient-to-br from-slate-100 via-white to-slate-50",
  },
  {
    value: "premium-dark",
    title: "Premium Dark",
    description: "Koyu, güçlü ve daha premium teknoloji mağazası hissi.",
    previewClassName: "bg-gradient-to-br from-slate-950 via-slate-800 to-slate-700",
  },
  {
    value: "soft-commerce",
    title: "Soft Commerce",
    description: "Yumuşak tonlar ve sıcak satış deneyimi odaklı görünüm.",
    previewClassName: "bg-gradient-to-br from-amber-50 via-white to-rose-50",
  },
];

interface StorefrontFormState {
  logo_url: string | null;
  storefront_title: string;
  storefront_description: string;
  hero_heading: string;
  hero_cta_label: string;
  theme_key: StorefrontThemeKey;
  banner_items: BannerItem[];
}

function createEmptyBanner(index: number): BannerItem {
  return {
    id: `banner-${Date.now()}-${index}`,
    title: "",
    description: "",
    image_url: "",
    cta_label: "",
    cta_href: "",
    background_color: index % 2 === 0 ? "#0f172a" : "#065f46",
  };
}

function toStorefrontFormState(
  settings: TenantStorefrontSettings,
): StorefrontFormState {
  return {
    logo_url: settings.logo_url,
    storefront_title: settings.storefront_title ?? "",
    storefront_description: settings.storefront_description ?? "",
    hero_heading: settings.hero_heading ?? "",
    hero_cta_label: settings.hero_cta_label ?? "",
    theme_key: settings.theme_key,
    banner_items: settings.banner_items ?? [],
  };
}

function validateStorefrontForm(params: {
  whatsapp_number: string;
  form: StorefrontFormState;
}) {
  return storefrontSettingsSchema.safeParse({
    whatsapp_number: params.whatsapp_number,
    storefront_title: params.form.storefront_title,
    storefront_description: params.form.storefront_description,
    hero_heading: params.form.hero_heading,
    hero_cta_label: params.form.hero_cta_label,
    theme_key: params.form.theme_key,
    banner_items: params.form.banner_items,
  });
}

export function TenantSettingsForm({
  tenant,
  profile,
  initialStorefrontSettings,
  forcePasswordChange,
}: {
  tenant: Tenant;
  profile: Profile;
  initialStorefrontSettings: TenantStorefrontSettings;
  forcePasswordChange?: boolean;
}) {
  const [whatsapp, setWhatsapp] = useState(tenant.whatsapp_number);
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();
  const [logoPending, startLogoTransition] = useTransition();
  const [storefrontPending, startStorefrontTransition] = useTransition();
  const [storefrontMessage, setStorefrontMessage] = useState<string | null>(null);
  const [logoMessage, setLogoMessage] = useState<string | null>(null);
  const [storefrontErrors, setStorefrontErrors] = useState<
    Partial<Record<keyof StorefrontFormState | "logo", string>>
  >({});
  const [storefrontForm, setStorefrontForm] = useState<StorefrontFormState>(
    toStorefrontFormState(initialStorefrontSettings),
  );
  const supabase = createSupabaseBrowserClient();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp_number: whatsapp }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Ayar kaydedilemedi.");
        return;
      }

      setMessage("WhatsApp yönlendirme numarası güncellendi.");
    });
  }

  function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);

    if (!supabase) {
      setPasswordMessage("Supabase yapılandırması eksik.");
      return;
    }

    if (password.length < 8) {
      setPasswordMessage("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    if (password !== passwordRepeat) {
      setPasswordMessage("Şifre tekrar alanı eşleşmiyor.");
      return;
    }

    startPasswordTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setPasswordMessage(error.message);
        return;
      }

      const response = await fetch("/api/tenant/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        setPasswordMessage(result.error ?? "Şifre güncellenemedi.");
        return;
      }

      setPassword("");
      setPasswordRepeat("");
      setPasswordMessage("Şifreniz güncellendi.");
      if (forcePasswordChange) {
        window.location.href = "https://app.ekatalox.com/";
      }
    });
  }

  function updateStorefrontField<Key extends keyof StorefrontFormState>(
    key: Key,
    value: StorefrontFormState[Key],
  ) {
    setStorefrontForm((current) => ({ ...current, [key]: value }));
    setLogoMessage(null);
    setStorefrontMessage(null);
    setStorefrontErrors((current) => ({ ...current, [key]: undefined }));
  }

  function updateBannerField(
    bannerId: string,
    key: keyof BannerItem,
    value: BannerItem[keyof BannerItem],
  ) {
    setStorefrontForm((current) => ({
      ...current,
      banner_items: current.banner_items.map((banner) =>
        banner.id === bannerId ? { ...banner, [key]: value } : banner,
      ),
    }));
    setStorefrontMessage(null);
    setStorefrontErrors((current) => ({ ...current, banner_items: undefined }));
  }

  function addBanner() {
    setStorefrontForm((current) => ({
      ...current,
      banner_items: [...current.banner_items, createEmptyBanner(current.banner_items.length)],
    }));
    setStorefrontMessage(null);
  }

  function removeBanner(bannerId: string) {
    setStorefrontForm((current) => ({
      ...current,
      banner_items: current.banner_items.filter((banner) => banner.id !== bannerId),
    }));
    setStorefrontMessage(null);
  }

  function saveStorefrontSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStorefrontMessage(null);
    setStorefrontErrors({});

    const parsed = validateStorefrontForm({
      whatsapp_number: whatsapp,
      form: storefrontForm,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const field = firstIssue?.path[0];

      if (typeof field === "string") {
        setStorefrontErrors({ [field]: firstIssue.message });
      }

      setStorefrontMessage(firstIssue?.message ?? "Storefront ayarları doğrulanamadı.");
      return;
    }

    startStorefrontTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const result = await response.json();

      if (!response.ok) {
        setStorefrontMessage(result.error ?? "Storefront ayarları kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings) {
        setStorefrontForm(toStorefrontFormState(result.storefrontSettings));
      }

      if (result.tenant?.whatsapp_number) {
        setWhatsapp(result.tenant.whatsapp_number);
      }

      setStorefrontMessage("Storefront görünüm ayarları kaydedildi.");
    });
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
        setStorefrontForm((current) => ({
          ...current,
          logo_url: result.storefrontSettings.logo_url,
        }));
      }

      setStorefrontErrors((current) => ({ ...current, logo: undefined }));
      setLogoMessage("Logo başarıyla güncellendi.");
    });
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setLogoMessage(null);
    setStorefrontErrors((current) => ({ ...current, logo: undefined }));

    if (!file) {
      return;
    }

    if (!allowedLogoMimeTypes.includes(file.type as (typeof allowedLogoMimeTypes)[number])) {
      setStorefrontErrors({
        logo: "Logo yalnız PNG, JPEG veya WEBP olabilir.",
      });
      return;
    }

    if (file.size > maxLogoFileSizeBytes) {
      setStorefrontErrors({
        logo: "Logo boyutu en fazla 1MB olabilir.",
      });
      return;
    }

    uploadLogo(file);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">Tenant bilgileri</h2>
          <dl className="mt-5 space-y-4 text-sm text-slate-600">
            <div>
              <dt className="text-slate-500">Firma</dt>
              <dd className="mt-1 font-medium text-slate-900">{tenant.company_name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Alt alan adı</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {tenant.subdomain}.ekatalox.com
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Paket limiti</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {tenant.max_product_limit} ürün
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Durum</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {tenant.status === "active" ? "Aktif" : "Askıda"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Rol</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {profile.role === "tenant_admin" ? "Tenant Admin" : profile.role}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-slate-900">Sipariş yönlendirme</h2>
            <p className="mt-1 text-sm text-slate-600">
              Storefront sepetindeki WhatsApp siparişleri bu numaraya yönlendirilir.
            </p>
            <form onSubmit={save} className="mt-5 space-y-4">
              <Input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
              <Button type="submit" disabled={pending}>
                {pending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-slate-900">Şifre değiştir</h2>
            <p className="mt-1 text-sm text-slate-600">
              {forcePasswordChange
                ? "İlk giriş güvenliği için geçici şifrenizi hemen değiştirin."
                : "Panel giriş şifrenizi buradan güncelleyebilirsiniz."}
            </p>
            <form onSubmit={changePassword} className="mt-5 space-y-4">
              <Input
                type="password"
                placeholder="Yeni şifre"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <Input
                type="password"
                placeholder="Yeni şifre tekrar"
                value={passwordRepeat}
                onChange={(event) => setPasswordRepeat(event.target.value)}
              />
              <Button type="submit" disabled={passwordPending}>
                {passwordPending ? "Şifre güncelleniyor..." : "Şifreyi güncelle"}
              </Button>
              {passwordMessage ? (
                <p className="text-sm text-emerald-700">{passwordMessage}</p>
              ) : null}
            </form>
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Storefront Görünüm Ayarları
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Logo, vitrin metinleri, banner alanı ve hazır tema seçimi ile müşteri
              mağazanızı kişiselleştirin.
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Mobil öncelikli vitrin ayarları
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
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
                    {storefrontForm.logo_url ? (
                      <Image
                        src={storefrontForm.logo_url}
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

              {storefrontErrors.logo ? (
                <p className="mt-3 text-sm text-amber-700">{storefrontErrors.logo}</p>
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
                {storefrontThemes.map((theme) => {
                  const selected = storefrontForm.theme_key === theme.value;

                  return (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => updateStorefrontField("theme_key", theme.value)}
                      className={[
                        "rounded-2xl border p-4 text-left transition",
                        selected
                          ? "border-emerald-500 bg-emerald-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className={`h-20 rounded-xl ${theme.previewClassName}`} />
                      <p className="mt-4 text-sm font-semibold text-slate-900">
                        {theme.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {theme.description}
                      </p>
                    </button>
                  );
                })}
              </div>
              {storefrontErrors.theme_key ? (
                <p className="mt-3 text-sm text-amber-700">{storefrontErrors.theme_key}</p>
              ) : null}
            </div>
          </div>

          <div>
            <form onSubmit={saveStorefrontSettings} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Mağaza başlığı
                </label>
                <Input
                  value={storefrontForm.storefront_title}
                  onChange={(event) =>
                    updateStorefrontField("storefront_title", event.target.value)
                  }
                  placeholder="Örn. Lucatech Toptan Teknoloji"
                />
                {storefrontErrors.storefront_title ? (
                  <p className="mt-2 text-sm text-amber-700">
                    {storefrontErrors.storefront_title}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Kısa açıklama
                </label>
                <Textarea
                  value={storefrontForm.storefront_description}
                  onChange={(event) =>
                    updateStorefrontField("storefront_description", event.target.value)
                  }
                  placeholder="Mağazanızı 1-2 cümle ile anlatın."
                />
                {storefrontErrors.storefront_description ? (
                  <p className="mt-2 text-sm text-amber-700">
                    {storefrontErrors.storefront_description}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Hero metni
                </label>
                <Input
                  value={storefrontForm.hero_heading}
                  onChange={(event) =>
                    updateStorefrontField("hero_heading", event.target.value)
                  }
                  placeholder="Örn. Güncel fiyatlar ve stoklar tek ekranda"
                />
                {storefrontErrors.hero_heading ? (
                  <p className="mt-2 text-sm text-amber-700">
                    {storefrontErrors.hero_heading}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  CTA buton yazısı
                </label>
                <Input
                  value={storefrontForm.hero_cta_label}
                  onChange={(event) =>
                    updateStorefrontField("hero_cta_label", event.target.value)
                  }
                  placeholder="Örn. Ürünleri İncele"
                />
                {storefrontErrors.hero_cta_label ? (
                  <p className="mt-2 text-sm text-amber-700">
                    {storefrontErrors.hero_cta_label}
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Banner / kampanya alanı</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Carousel alanı için kampanya, duyuru veya indirim kartları ekleyin.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addBanner}
                    disabled={storefrontForm.banner_items.length >= 6}
                  >
                    <Plus className="size-4" />
                    Banner ekle
                  </Button>
                </div>

                <div className="mt-4 space-y-4">
                  {storefrontForm.banner_items.length ? (
                    storefrontForm.banner_items.map((banner, index) => (
                      <div
                        key={banner.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Banner #{index + 1}
                            </p>
                            <p className="text-xs text-slate-500">
                              Görsel URL opsiyoneldir; boşsa placeholder gösterilir.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBanner(banner.id)}
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
                          <div className="grid gap-3 md:grid-cols-2">
                            <Input
                              value={banner.image_url ?? ""}
                              onChange={(event) =>
                                updateBannerField(banner.id, "image_url", event.target.value)
                              }
                              placeholder="Görsel URL"
                            />
                            <Input
                              value={banner.background_color ?? ""}
                              onChange={(event) =>
                                updateBannerField(
                                  banner.id,
                                  "background_color",
                                  event.target.value,
                                )
                              }
                              placeholder="#0f172a"
                            />
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <Input
                              value={banner.cta_label ?? ""}
                              onChange={(event) =>
                                updateBannerField(banner.id, "cta_label", event.target.value)
                              }
                              placeholder="CTA yazısı"
                            />
                            <Input
                              value={banner.cta_href ?? ""}
                              onChange={(event) =>
                                updateBannerField(banner.id, "cta_href", event.target.value)
                              }
                              placeholder="CTA linki"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                      Henüz banner eklenmedi. İsterseniz boş bırakabilirsiniz; storefront tarafında
                      alan şık bir placeholder olarak görünür.
                    </div>
                  )}
                </div>
                {storefrontErrors.banner_items ? (
                  <p className="mt-3 text-sm text-amber-700">
                    {storefrontErrors.banner_items}
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Canlı geri bildirim</p>
                <p className="mt-1 text-sm text-slate-500">
                  Logo ayrı olarak anında yüklenir. Metin, tema ve banner değişiklikleri bu
                  karttaki kaydet butonuyla yayınlanır.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-6">
                  {storefrontMessage ? (
                    <p className="text-sm text-emerald-700">{storefrontMessage}</p>
                  ) : null}
                </div>
                <Button type="submit" disabled={storefrontPending}>
                  {storefrontPending
                    ? "Storefront kaydediliyor..."
                    : "Storefront ayarlarını kaydet"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
}