"use client";

import { useState, useTransition } from "react";
import { Loader2, Zap, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Textarea } from "@/components/ui/textarea";
import type { TenantStorefrontSettings } from "@/lib/types";

const DEFAULT_NOTE =
  "Şu anda biraz yoğunuz, siparişiniz beklenenden biraz daha gecikebilir. Anlayışınız için teşekkür ederiz.";

// Tek tuşluk geçici uyarı: açıkken vitrini açan müşteriye popup çıkar.
// Duyuru ayarlarından bağımsız tutuldu — yoğunluk sabah açılıp akşam
// kapatılan anlık bir durum, her seferinde kalıcı duyuru metnini
// silmemeli (bkz. 0080_busy_mode.sql).
export function BusyModeToggle({
  initialStorefrontSettings,
}: {
  initialStorefrontSettings: TenantStorefrontSettings;
}) {
  const [isBusy, setIsBusy] = useState(Boolean(initialStorefrontSettings.is_busy_mode));
  const [note, setNote] = useState(initialStorefrontSettings.busy_mode_note ?? "");
  const [savedNote, setSavedNote] = useState(initialStorefrontSettings.busy_mode_note ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(nextBusy: boolean, nextNote: string) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_busy_mode: nextBusy,
          busy_mode_note: nextNote.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Yoğunluk modu güncellenemedi.");
        return;
      }

      setIsBusy(nextBusy);
      setSavedNote(nextNote.trim());
      setMessage(
        nextBusy
          ? "Yoğunluk modu açıldı. Müşterileriniz siteye girdiğinde uyarıyı görecek."
          : "Yoğunluk modu kapatıldı.",
      );
    });
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Yoğunluk Modu</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Açtığınızda, siteye giren müşteriye bir kez uyarı penceresi gösterilir.
            Sipariş almaya devam edersiniz — sadece gecikme olabileceği bildirilir.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Müşteri sekmeyi kapatıp tekrar girerse uyarıyı yeniden görür; aynı
            ziyarette tekrar tekrar çıkmaz.
          </p>
        </div>

        <Button
          variant={isBusy ? "danger" : "primary"}
          disabled={pending}
          onClick={() => save(!isBusy, note)}
          className="shrink-0"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isBusy ? (
            <ZapOff className="size-4" />
          ) : (
            <Zap className="size-4" />
          )}
          {pending ? "Kaydediliyor…" : isBusy ? "Yoğunluğu Kapat" : "Yoğunum"}
        </Button>
      </div>

      {isBusy ? (
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          <span className="size-2 rounded-full bg-amber-500" />
          Şu anda açık — müşteriler uyarıyı görüyor
        </p>
      ) : null}

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Gösterilecek mesaj
        </label>
        <Textarea
          rows={3}
          value={note}
          placeholder={DEFAULT_NOTE}
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => {
            if (savedNote !== note.trim()) {
              save(isBusy, note);
            }
          }}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Boş bırakırsanız varsayılan metin gösterilir.
        </p>
      </div>

      <InlineAlert message={error} tone="error" onExpire={() => setError(null)} />
      <InlineAlert message={message} tone="success" onExpire={() => setMessage(null)} />
    </Card>
  );
}
