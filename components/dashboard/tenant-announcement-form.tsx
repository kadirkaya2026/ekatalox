"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Textarea } from "@/components/ui/textarea";
import type { TenantStorefrontSettings } from "@/lib/types";

export function TenantAnnouncementForm({
  initialStorefrontSettings,
}: {
  initialStorefrontSettings: TenantStorefrontSettings;
}) {
  const [announcementTitle, setAnnouncementTitle] = useState(
    initialStorefrontSettings.announcement_title ?? "",
  );
  const [announcementBody, setAnnouncementBody] = useState(
    initialStorefrontSettings.announcement_body ?? "",
  );
  const [maxDisplayCount, setMaxDisplayCount] = useState(
    String(initialStorefrontSettings.max_display_count ?? 1),
  );
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(
    initialStorefrontSettings.is_active ?? false,
  );
  const [announcementVersion, setAnnouncementVersion] = useState(
    initialStorefrontSettings.version ?? 0,
  );
  const [announcementPending, startAnnouncementTransition] = useTransition();
  const [announcementMessage, setAnnouncementMessage] = useState<string | null>(null);
  const [announcementTitleError, setAnnouncementTitleError] = useState<string | null>(null);
  const [announcementBodyError, setAnnouncementBodyError] = useState<string | null>(null);
  const [maxDisplayCountError, setMaxDisplayCountError] = useState<string | null>(null);
  const router = useRouter();

  function saveAnnouncement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnnouncementMessage(null);
    setAnnouncementTitleError(null);
    setAnnouncementBodyError(null);
    setMaxDisplayCountError(null);

    const trimmedAnnouncementTitle = announcementTitle.trim();
    const trimmedAnnouncementBody = announcementBody.trim();
    const parsedMaxDisplayCount = Number(maxDisplayCount);

    if (trimmedAnnouncementTitle.length > 120) {
      setAnnouncementTitleError("Duyuru başlığı en fazla 120 karakter olabilir.");
      return;
    }

    if (trimmedAnnouncementBody.length > 1200) {
      setAnnouncementBodyError("Duyuru metni en fazla 1200 karakter olabilir.");
      return;
    }

    if (!Number.isInteger(parsedMaxDisplayCount) || parsedMaxDisplayCount < 1) {
      setMaxDisplayCountError("Maksimum gösterim sayısı en az 1 olmalıdır.");
      return;
    }

    if (isAnnouncementActive && !trimmedAnnouncementTitle) {
      setAnnouncementTitleError("Yayına almak için duyuru başlığı zorunludur.");
      return;
    }

    if (isAnnouncementActive && !trimmedAnnouncementBody) {
      setAnnouncementBodyError("Yayına almak için duyuru metni zorunludur.");
      return;
    }

    startAnnouncementTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcement_title: trimmedAnnouncementTitle,
          announcement_body: trimmedAnnouncementBody,
          is_active: isAnnouncementActive,
          max_display_count: parsedMaxDisplayCount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setAnnouncementMessage(result.error ?? "Duyuru ayarları kaydedilemedi.");
        return;
      }

      if (result.storefrontSettings) {
        setAnnouncementTitle(result.storefrontSettings.announcement_title ?? "");
        setAnnouncementBody(result.storefrontSettings.announcement_body ?? "");
        setIsAnnouncementActive(Boolean(result.storefrontSettings.is_active));
        setMaxDisplayCount(String(result.storefrontSettings.max_display_count ?? 1));
        setAnnouncementVersion(result.storefrontSettings.version ?? 0);
      }

      setAnnouncementMessage("Duyuru ayarları kaydedildi.");
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Megaphone className="size-4 text-emerald-700" />
        <span>Duyuru modalı</span>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Esnaf anasayfaya girdiğinde gösterilecek duyuruyu yönetin. Yeni duyuruyu
        yayına aldığınızda sürüm otomatik artar ve tarayıcı sayaçları sıfırlanır.
      </p>

      <form onSubmit={saveAnnouncement} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Başlık</label>
          <Input
            value={announcementTitle}
            onChange={(event) => {
              setAnnouncementTitle(event.target.value);
              setAnnouncementMessage(null);
              setAnnouncementTitleError(null);
            }}
            placeholder="Örn. Yeni sezon fiyat listesi yayında"
            maxLength={120}
          />
          {announcementTitleError ? (
            <p className="mt-2 text-sm text-amber-700">{announcementTitleError}</p>
          ) : null}
          <p className="mt-1 text-xs text-slate-400">
            {announcementTitle.length}/120 karakter
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Metin</label>
          <Textarea
            value={announcementBody}
            onChange={(event) => {
              setAnnouncementBody(event.target.value);
              setAnnouncementMessage(null);
              setAnnouncementBodyError(null);
            }}
            placeholder="Esnafa göstermek istediğiniz bilgilendirme metnini yazın."
            maxLength={1200}
          />
          {announcementBodyError ? (
            <p className="mt-2 text-sm text-amber-700">{announcementBodyError}</p>
          ) : null}
          <p className="mt-1 text-xs text-slate-400">
            {announcementBody.length}/1200 karakter
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,220px)_1fr]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Maksimum Gösterim Sayısı
            </label>
            <Input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={maxDisplayCount}
              onChange={(event) => {
                setMaxDisplayCount(event.target.value);
                setAnnouncementMessage(null);
                setMaxDisplayCountError(null);
              }}
              placeholder="1"
            />
            {maxDisplayCountError ? (
              <p className="mt-2 text-sm text-amber-700">{maxDisplayCountError}</p>
            ) : (
              <p className="mt-2 text-xs text-slate-400">
                Her kullanıcı için toplam gösterim limiti.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Yayınla</p>
                <p className="mt-1 text-sm text-slate-500">
                  Switch açıkken duyuru storefront anasayfasında modal olarak gösterilir.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAnnouncementActive((current) => !current);
                  setAnnouncementMessage(null);
                }}
                aria-pressed={isAnnouncementActive}
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                  isAnnouncementActive ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
                    isAnnouncementActive ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-700">
                Mevcut sürüm: v{announcementVersion}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 font-semibold ${
                  isAnnouncementActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {isAnnouncementActive ? "Yayında" : "Taslak / Pasif"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6">
            <InlineAlert
              message={announcementMessage}
              onExpire={() => setAnnouncementMessage(null)}
            />
          </div>
          <Button type="submit" disabled={announcementPending}>
            {announcementPending ? "Kaydediliyor..." : "Duyuruyu kaydet"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
