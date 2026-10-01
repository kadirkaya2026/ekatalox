"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import type { SalesUnit, StorefrontProductVariant } from "@/lib/types";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { getRequestedUnitQuantity } from "@/lib/storefront/variants";
import { cn } from "@/lib/utils";

// Pilot model ızgarası (1 Eki 2026, yalnız lib/storefront/pilot.ts mağazaları):
// Sunix örneğindeki gibi modeller kutucuk; her kutucukta birim, adet ve stok,
// seçilenler işaretli. "Tümü / Seçilenler" sekmesi. Seçim durumu
// StorefrontClient'ta kalır (stok doğrulama + sepete ekleme aynı yoldan).

type Selection = { unit: SalesUnit; quantity: number };

const UNIT_LABEL: Record<SalesUnit, string> = { adet: "Adet", paket: "Paket", koli: "Koli" };

// Renk adlı varyantlarda (Lucatech: BLACK, SİYAH, GOLD…) küçük renk noktası.
const COLOR_DOTS: Array<[RegExp, string]> = [
  [/^(siyah|black)\b/i, "#111827"],
  [/^(beyaz|white)\b/i, "#ffffff"],
  [/^(gri|gray|grey)\b/i, "#9ca3af"],
  [/^(gümüş|gumus|silver)\b/i, "#d1d5db"],
  [/^(gold|altın|altin)\b/i, "#d4a72c"],
  [/^(kırmızı|kirmizi|red)\b/i, "#dc2626"],
  [/^(mavi|blue)\b/i, "#2563eb"],
  [/^(lacivert|navy)\b/i, "#1e3a8a"],
  [/^(yeşil|yesil|green)\b/i, "#16a34a"],
  [/^(mor|purple)\b/i, "#7c3aed"],
  [/^(pembe|pink)\b/i, "#ec4899"],
  [/^(turuncu|orange)\b/i, "#f97316"],
  [/^(sarı|sari|yellow)\b/i, "#facc15"],
  [/^(kahve|kahverengi|brown)\b/i, "#7c4a24"],
];

export function variantColorDot(name: string) {
  const trimmed = name.trim().toLocaleLowerCase("tr-TR");
  return COLOR_DOTS.find(([re]) => re.test(trimmed))?.[1] ?? null;
}

function unitsFor(variant: StorefrontProductVariant): SalesUnit[] {
  const units: SalesUnit[] = ["adet"];
  if (variant.package_quantity) units.push("paket");
  if (variant.carton_quantity) units.push("koli");
  return units;
}

export function PilotVariantGrid({
  variants,
  getSelection,
  onChange,
}: {
  /** Aramaya göre süzülmüş modeller */
  variants: StorefrontProductVariant[];
  getSelection: (variantId: string) => Selection;
  onChange: (variantId: string, next: Partial<Selection>) => void;
}) {
  const theme = useStorefrontTheme();
  const [tab, setTab] = useState<"all" | "selected">("all");

  const selectedIds = useMemo(
    () => new Set(variants.filter((v) => getSelection(v.id).quantity > 0).map((v) => v.id)),
    [variants, getSelection],
  );
  const shown = tab === "selected" ? variants.filter((v) => selectedIds.has(v.id)) : variants;
  const accent = "var(--ek-add-to-cart, #0f172a)";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex shrink-0 items-center gap-1.5">
        {(["all", "selected"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold transition",
              tab === key ? cn(theme.activeTileBg, theme.activeTileText) : cn(theme.surfaceMuted, theme.textMuted),
            )}
          >
            {key === "all" ? `Tümü (${variants.length})` : `Seçilenler (${selectedIds.size})`}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto overscroll-y-contain px-1 pb-2 pt-1.5 sm:grid-cols-3">
        {shown.length === 0 ? (
          <p className={cn("col-span-full rounded-lg px-4 py-6 text-center text-sm", theme.surfaceMuted, theme.textMuted)}>
            {tab === "selected" ? "Henüz model seçmediniz." : "Bu aramaya uygun model yok."}
          </p>
        ) : null}
        {shown.map((variant) => {
          const selection = getSelection(variant.id);
          const isSelected = selection.quantity > 0;
          const isUnavailable = !variant.is_purchasable;
          const units = unitsFor(variant);
          const dot = variantColorDot(variant.model_name);
          const pieces = getRequestedUnitQuantity({ unit: selection.unit, quantity: selection.quantity, variant });
          const setQty = (q: number) => onChange(variant.id, { quantity: Math.max(0, q) });

          return (
            <div
              key={variant.id}
              data-commerce-slot="variant-tile"
              className={cn(
                "relative flex flex-col rounded-xl border p-2 transition",
                theme.surface,
                isUnavailable ? "opacity-45" : null,
                isSelected ? "border-2" : theme.border,
              )}
              style={isSelected ? { borderColor: accent } : undefined}
            >
              {isSelected ? (
                <span
                  className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full text-white shadow"
                  style={{ background: accent }}
                  aria-hidden
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
              ) : null}

              <div className="flex min-h-[2.5rem] items-start gap-1.5">
                {dot ? (
                  <span
                    className="mt-1 size-3 shrink-0 rounded-full border border-black/15"
                    style={{ background: dot }}
                    aria-hidden
                  />
                ) : null}
                <p className={cn("line-clamp-2 text-[12.5px] font-bold leading-4", theme.text)} title={variant.model_name}>
                  {variant.model_name}
                </p>
              </div>

              <span
                className={cn(
                  "mt-1 w-fit rounded-full px-1.5 py-px text-[10px] font-semibold",
                  isUnavailable ? theme.stockBadgeOut : theme.stockBadgeIn,
                )}
              >
                {isUnavailable ? "Yakında" : "Stokta"}
              </span>

              {units.length > 1 ? (
                <div className={cn("mt-1.5 flex rounded-lg p-0.5", theme.surfaceMuted)}>
                  {units.map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      disabled={isUnavailable}
                      onClick={() => onChange(variant.id, { unit, quantity: selection.unit === unit ? selection.quantity : 0 })}
                      className={cn(
                        "flex-1 rounded-md py-0.5 text-[10.5px] font-bold transition",
                        selection.unit === unit ? cn(theme.surface, theme.text, "shadow-sm") : theme.textMuted,
                      )}
                    >
                      {UNIT_LABEL[unit]}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className={cn("mt-1.5 flex h-9 items-center overflow-hidden", theme.quantityStepper)}>
                <button
                  type="button"
                  disabled={isUnavailable}
                  onClick={() => setQty(selection.quantity - 1)}
                  className={cn("flex h-full w-8 shrink-0 items-center justify-center", theme.quantityStepperButton)}
                  aria-label={`${variant.model_name} azalt`}
                >
                  <Minus className="size-3.5" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  disabled={isUnavailable}
                  value={selection.quantity > 0 ? String(selection.quantity) : ""}
                  placeholder="0"
                  onChange={(event) => {
                    const raw = event.target.value;
                    if (raw === "") setQty(0);
                    else if (/^\d+$/.test(raw)) setQty(Number(raw));
                  }}
                  className={cn(theme.quantityInput, "min-w-0 font-bold")}
                  style={{ fontSize: "16px" }}
                  aria-label={`${variant.model_name} ${UNIT_LABEL[selection.unit].toLocaleLowerCase("tr-TR")}`}
                />
                <button
                  type="button"
                  disabled={isUnavailable}
                  onClick={() => setQty(selection.quantity + 1)}
                  className={cn("flex h-full w-8 shrink-0 items-center justify-center", theme.quantityStepperButton)}
                  aria-label={`${variant.model_name} artır`}
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              {isSelected && selection.unit !== "adet" ? (
                <p className={cn("mt-1 text-[10px]", theme.textMuted)}>= {pieces} adet</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Pilot hızlı adet düğmeleri (Sunix: 5 / 10 / 20 / 50): dokununca adet kutusu o
// sayıya ayarlanır; kutudaki değer düğmeyle aynıysa düğme seçili görünür.
export function PilotQuickQuantities({
  values,
  current,
  onPick,
}: {
  values: readonly number[];
  current: string;
  onPick: (value: number) => void;
}) {
  const theme = useStorefrontTheme();
  return (
    <div className="flex gap-1.5" role="group" aria-label="Hızlı adet">
      {values.map((value) => {
        const active = current.trim() === String(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onPick(value)}
            className={cn(
              "flex-1 rounded-full border py-1 text-xs font-bold transition",
              active ? "text-white" : cn(theme.surface, theme.text, theme.border),
            )}
            style={active ? { background: "var(--ek-add-to-cart, #0f172a)", borderColor: "transparent" } : undefined}
          >
            {value} adet
          </button>
        );
      })}
    </div>
  );
}
