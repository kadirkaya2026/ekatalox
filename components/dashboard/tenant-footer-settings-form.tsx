"use client";

import { useState, useTransition } from "react";
import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEFAULT_FOOTER_LOCATION } from "@/lib/storefront/footer-links";
import type { TenantStorefrontSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

function SettingsToggle({
  pressed,
  disabled,
  onToggle,
  label,
}: {
  pressed: boolean;
  disabled?: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={label}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 rounded-full transition",
        pressed ? "bg-emerald-600" : "bg-slate-300",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-6 rounded-full bg-white shadow transition",
          pressed ? "left-5" : "left-0.5",
        )}
      />
    </button>
  );
}

function SocialMediaRow({
  label,
  placeholder,
  value,
  visible,
  disabled,
  onValueChange,
  onVisibleChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  visible: boolean;
  disabled?: boolean;
  onValueChange: (value: string) => void;
  onVisibleChange: (visible: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-[120px] items-center justify-between gap-3 sm:w-40 sm:justify-start">
          <span className="text-sm font-medium text-slate-900">{label}</span>
          <SettingsToggle
            label={`${label} vitrinde göster`}
            pressed={visible}
            disabled={disabled}
            onToggle={() => onVisibleChange(!visible)}
          />
        </div>
        <Input
          type="url"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onValueChange(event.target.value)}
          className="flex-1"
        />
      </div>
    </div>
  );
}

function getInitialFooterState(settings: TenantStorefrontSettings) {
  return {
    isFooterVisible: settings.is_footer_visible ?? false,
    isFooterLogoVisible: settings.is_footer_logo_visible ?? true,
    isFooterSocialVisible: settings.is_footer_social_visible ?? false,
    isFooterLocationVisible: settings.is_footer_location_visible ?? false,
    footerLocation: settings.footer_location ?? "",
    footerWebsiteUrl: settings.footer_website_url ?? "",
    isFooterWebsiteVisible: settings.is_footer_website_visible ?? false,
    footerPhone: settings.footer_phone ?? "",
    footerEmail: settings.footer_email ?? "",
    isFooterContactVisible: settings.is_footer_contact_visible ?? false,
    footerInstagramUrl: settings.footer_instagram_url ?? "",
    footerYoutubeUrl: settings.footer_youtube_url ?? "",
    footerXUrl: settings.footer_x_url ?? "",
    footerFacebookUrl: settings.footer_facebook_url ?? "",
    footerWhatsapp: settings.footer_whatsapp ?? "",
    isFooterInstagramVisible: settings.is_footer_instagram_visible ?? false,
    isFooterYoutubeVisible: settings.is_footer_youtube_visible ?? false,
    isFooterXVisible: settings.is_footer_x_visible ?? false,
    isFooterFacebookVisible: settings.is_footer_facebook_visible ?? false,
    isFooterWhatsappVisible: settings.is_footer_whatsapp_visible ?? false,
  };
}

export function TenantFooterSettingsForm({
  initialStorefrontSettings,
}: {
  initialStorefrontSettings: TenantStorefrontSettings;
}) {
  const [state, setState] = useState(() =>
    getInitialFooterState(initialStorefrontSettings),
  );
  const [savePending, startSaveTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const footerFieldsDisabled = !state.isFooterVisible;

  function updateState<K extends keyof typeof state>(
    key: K,
    value: (typeof state)[K],
  ) {
    setState((current) => ({ ...current, [key]: value }));
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
          is_footer_visible: state.isFooterVisible,
          is_footer_logo_visible: state.isFooterLogoVisible,
          is_footer_social_visible: state.isFooterSocialVisible,
          is_footer_location_visible: state.isFooterLocationVisible,
          footer_location: state.footerLocation || null,
          footer_website_url: state.footerWebsiteUrl || null,
          is_footer_website_visible: state.isFooterWebsiteVisible,
          footer_phone: state.footerPhone || null,
          footer_email: state.footerEmail || null,
          is_footer_contact_visible: state.isFooterContactVisible,
          footer_instagram_url: state.footerInstagramUrl || null,
          footer_youtube_url: state.footerYoutubeUrl || null,
          footer_x_url: state.footerXUrl || null,
          footer_facebook_url: state.footerFacebookUrl || null,
          footer_whatsapp: state.footerWhatsapp || null,
          is_footer_instagram_visible: state.isFooterInstagramVisible,
          is_footer_youtube_visible: state.isFooterYoutubeVisible,
          is_footer_x_visible: state.isFooterXVisible,
          is_footer_facebook_visible: state.isFooterFacebookVisible,
          is_footer_whatsapp_visible: state.isFooterWhatsappVisible,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSaveMessage(result.error ?? "Footer ayarları kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings) {
        setState(getInitialFooterState(result.storefrontSettings));
      }

      setSaveMessage("Footer ayarları kaydedildi.");
    });
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <LayoutTemplate className="size-4 text-emerald-700" />
        <span>Sayfa Altı Footer</span>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Vitrin sayfasının en altında görünecek footer alanını, adres, iletişim,
        web sitesi ve sosyal medya bağlantılarını yönetin.
      </p>

      <form onSubmit={save} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Footer&apos;ı vitrinde göster
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Kapalıyken footer vitrinde hiç görünmez.
              </p>
            </div>
            <SettingsToggle
              label="Footer'ı vitrinde göster"
              pressed={state.isFooterVisible}
              onToggle={() =>
                updateState("isFooterVisible", !state.isFooterVisible)
              }
            />
          </div>
        </div>

        <div className={cn("space-y-4", footerFieldsDisabled && "opacity-60")}>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  eKatalox logosunu göster
                </p>
              </div>
              <SettingsToggle
                label="eKatalox logosunu göster"
                pressed={state.isFooterLogoVisible}
                disabled={footerFieldsDisabled}
                onToggle={() =>
                  updateState("isFooterLogoVisible", !state.isFooterLogoVisible)
                }
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-900">Adresimiz</p>
              <SettingsToggle
                label="Adresimizi göster"
                pressed={state.isFooterLocationVisible}
                disabled={footerFieldsDisabled}
                onToggle={() =>
                  updateState(
                    "isFooterLocationVisible",
                    !state.isFooterLocationVisible,
                  )
                }
              />
            </div>
            <Input
              value={state.footerLocation}
              disabled={footerFieldsDisabled}
              placeholder={DEFAULT_FOOTER_LOCATION}
              onChange={(event) => updateState("footerLocation", event.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Web sitemiz</p>
                <p className="mt-1 text-sm text-slate-500">
                  Vitrinde domain adı olarak görünür.
                </p>
              </div>
              <SettingsToggle
                label="Web sitesini göster"
                pressed={state.isFooterWebsiteVisible}
                disabled={footerFieldsDisabled}
                onToggle={() =>
                  updateState(
                    "isFooterWebsiteVisible",
                    !state.isFooterWebsiteVisible,
                  )
                }
              />
            </div>
            <Input
              type="url"
              value={state.footerWebsiteUrl}
              disabled={footerFieldsDisabled}
              placeholder="https://ornek.com"
              onChange={(event) => updateState("footerWebsiteUrl", event.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">İletişim</p>
                <p className="mt-1 text-sm text-slate-500">
                  Telefon ve e-posta vitrin footer&apos;ında gösterilir.
                </p>
              </div>
              <SettingsToggle
                label="İletişim bilgilerini göster"
                pressed={state.isFooterContactVisible}
                disabled={footerFieldsDisabled}
                onToggle={() =>
                  updateState(
                    "isFooterContactVisible",
                    !state.isFooterContactVisible,
                  )
                }
              />
            </div>
            <div className="space-y-3">
              <Input
                type="tel"
                value={state.footerPhone}
                disabled={footerFieldsDisabled}
                placeholder="Telefon numarası"
                onChange={(event) => updateState("footerPhone", event.target.value)}
              />
              <Input
                type="email"
                value={state.footerEmail}
                disabled={footerFieldsDisabled}
                placeholder="E-posta adresi"
                onChange={(event) => updateState("footerEmail", event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Sosyal medya</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Vitrinde yalnızca ikonlar görünür.
                  </p>
                </div>
                <SettingsToggle
                  label="Sosyal medya bölümünü göster"
                  pressed={state.isFooterSocialVisible}
                  disabled={footerFieldsDisabled}
                  onToggle={() =>
                    updateState(
                      "isFooterSocialVisible",
                      !state.isFooterSocialVisible,
                    )
                  }
                />
              </div>
            </div>

            <SocialMediaRow
              label="Instagram"
              placeholder="https://instagram.com/..."
              value={state.footerInstagramUrl}
              visible={state.isFooterInstagramVisible}
              disabled={footerFieldsDisabled || !state.isFooterSocialVisible}
              onValueChange={(value) => updateState("footerInstagramUrl", value)}
              onVisibleChange={(visible) =>
                updateState("isFooterInstagramVisible", visible)
              }
            />
            <SocialMediaRow
              label="YouTube"
              placeholder="https://youtube.com/@..."
              value={state.footerYoutubeUrl}
              visible={state.isFooterYoutubeVisible}
              disabled={footerFieldsDisabled || !state.isFooterSocialVisible}
              onValueChange={(value) => updateState("footerYoutubeUrl", value)}
              onVisibleChange={(visible) =>
                updateState("isFooterYoutubeVisible", visible)
              }
            />
            <SocialMediaRow
              label="X"
              placeholder="https://x.com/..."
              value={state.footerXUrl}
              visible={state.isFooterXVisible}
              disabled={footerFieldsDisabled || !state.isFooterSocialVisible}
              onValueChange={(value) => updateState("footerXUrl", value)}
              onVisibleChange={(visible) => updateState("isFooterXVisible", visible)}
            />
            <SocialMediaRow
              label="Facebook"
              placeholder="https://facebook.com/..."
              value={state.footerFacebookUrl}
              visible={state.isFooterFacebookVisible}
              disabled={footerFieldsDisabled || !state.isFooterSocialVisible}
              onValueChange={(value) => updateState("footerFacebookUrl", value)}
              onVisibleChange={(visible) =>
                updateState("isFooterFacebookVisible", visible)
              }
            />

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-[120px] items-center justify-between gap-3 sm:w-40 sm:justify-start">
                  <span className="text-sm font-medium text-slate-900">WhatsApp</span>
                  <SettingsToggle
                    label="WhatsApp vitrinde göster"
                    pressed={state.isFooterWhatsappVisible}
                    disabled={footerFieldsDisabled || !state.isFooterSocialVisible}
                    onToggle={() =>
                      updateState(
                        "isFooterWhatsappVisible",
                        !state.isFooterWhatsappVisible,
                      )
                    }
                  />
                </div>
                <Input
                  value={state.footerWhatsapp}
                  disabled={footerFieldsDisabled || !state.isFooterSocialVisible}
                  placeholder="905551234567 veya https://wa.me/..."
                  onChange={(event) => updateState("footerWhatsapp", event.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6">
            {saveMessage ? (
              <p
                className={cn(
                  "text-sm",
                  saveMessage.includes("kaydedildi")
                    ? "text-emerald-700"
                    : "text-amber-700",
                )}
              >
                {saveMessage}
              </p>
            ) : null}
          </div>
          <Button type="submit" disabled={savePending}>
            {savePending ? "Kaydediliyor..." : "Footer Ayarlarını Kaydet"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
