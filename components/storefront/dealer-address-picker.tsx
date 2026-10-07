"use client";

import { useState } from "react";
import { Check, Loader2, MapPin, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDealerAddress, type DealerAddress } from "@/lib/kurumsal/dealer-profile";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { cn } from "@/lib/utils";

export type NewDealerAddressInput = { label: string; address: string; city: string };

// Sepette kişiye özel bayi şifresinin kayıtlı teslimat adresleri (0163, Hesabım
// denemesi). Seçilen adresin kimliği siparişle gider; fişe adresi sunucu yazar.
export function DealerAddressPicker({
  dealerLabel,
  addresses,
  selectedId,
  onSelect,
  onAdd,
}: {
  dealerLabel: string;
  addresses: DealerAddress[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Yeni adresi kaydeder; hata metni döner (başarıda null). */
  onAdd: (input: NewDealerAddressInput) => Promise<string | null>;
}) {
  const theme = useStorefrontTheme();
  const [adding, setAdding] = useState(addresses.length === 0);
  const [draft, setDraft] = useState<NewDealerAddressInput>({ label: "", address: "", city: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const message = await onAdd(draft);
    setSaving(false);
    if (message) {
      setError(message);
      return;
    }
    setDraft({ label: "", address: "", city: "" });
    setAdding(false);
  }

  return (
    <div className={cn("mt-3 rounded-xl p-3", theme.surfaceMuted)}>
      <p className={cn("text-sm", theme.text)}>
        <span className="font-semibold">{dealerLabel}</span> adına sipariş veriliyor.
      </p>
      <p className={cn("mt-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide", theme.textMuted)}>
        <MapPin className="size-3.5" /> Teslimat adresi
      </p>
      <div className="mt-2 grid gap-2">
        {addresses.map((entry) => {
          const active = entry.id === selectedId;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onSelect(entry.id)}
              aria-pressed={active}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left text-sm transition",
                active ? cn("border-transparent", theme.activeTileBg, theme.activeTileText) : cn(theme.border, theme.surface, theme.text),
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                  active ? "border-current" : theme.border,
                )}
              >
                {active ? <Check className="size-3" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">
                  {entry.label ?? (entry.id === "primary" ? "Varsayılan adres" : "Adres")}
                </span>
                <span className={cn("block break-words text-[13px]", active ? "opacity-90" : theme.textMuted)}>
                  {formatDealerAddress(entry)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {adding ? (
        <div className={cn("mt-2 grid gap-2 rounded-xl border p-3", theme.border, theme.surface)}>
          <Input
            placeholder="Adres adı (örn. Depo, Şube 2), isteğe bağlı"
            value={draft.label}
            maxLength={40}
            onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
            className={theme.formField}
          />
          <Textarea
            placeholder="Açık adres"
            value={draft.address}
            maxLength={400}
            rows={2}
            onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))}
            className={theme.formField}
          />
          <Input
            placeholder="İl / ilçe"
            value={draft.city}
            maxLength={40}
            onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))}
            className={theme.formField}
          />
          {error ? <p className={cn("text-xs font-medium", theme.dangerText)}>{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving || draft.address.trim().length < 5}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50",
                theme.activeTileBg,
                theme.activeTileText,
              )}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Adresi kaydet
            </button>
            {addresses.length ? (
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
                className={cn("rounded-lg px-3 py-2 text-sm font-medium", theme.textMuted)}
              >
                Vazgeç
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={cn("mt-2 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-2 hover:underline", theme.text)}
        >
          <Plus className="size-4" /> Farklı adrese gönder
        </button>
      )}
    </div>
  );
}
