"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EMPTY_REFINE,
  type StorefrontFacets,
  type StorefrontRefine,
} from "@/lib/storefront/refine";

// Vitrin filtresi arayüzü (17 Eki 2026, kullanıcı isteği: Trendyol düzeni).
// Masaüstü: kategori/arama sayfasında solda açılır-kapanır başlıklar.
// Telefon (ve sektör temaları): "Filtrele" tam ekran açılır, her başlık
// kendi sayfasına girer, altta "Ürünleri Listele (N)". Renk mağazanın
// paletinden (--sf-accent) gelir.

export interface FilterCategoryOption {
  id: string;
  name: string;
  count: number;
}

export interface FilterSelection {
  refine: StorefrontRefine;
  /** Seçili alt kategori id'leri (genişletilmemiş). */
  subSelected: string[];
}

export const EMPTY_FILTER_SELECTION: FilterSelection = { refine: EMPTY_REFINE, subSelected: [] };

export interface FilterPanelData {
  facets: StorefrontFacets | null;
  subOptions: FilterCategoryOption[];
  showPrice: boolean;
  currencySymbol: string;
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function countFilterSelections(selection: FilterSelection) {
  const { refine } = selection;
  return (
    selection.subSelected.length +
    refine.brands.length +
    Object.values(refine.attrs).reduce((sum, values) => sum + values.length, 0) +
    (refine.min !== null || refine.max !== null ? 1 : 0) +
    (refine.discounted ? 1 : 0)
  );
}

function formatAmount(value: number) {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

function priceLabel(refine: StorefrontRefine, symbol: string) {
  if (refine.min !== null && refine.max !== null) return `${formatAmount(refine.min)} – ${formatAmount(refine.max)} ${symbol}`;
  if (refine.min !== null) return `${formatAmount(refine.min)} ${symbol} üstü`;
  if (refine.max !== null) return `${formatAmount(refine.max)} ${symbol} altı`;
  return "";
}

function niceStep(raw: number) {
  const power = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const n = raw / power;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * power;
}

/** Fiyat kapsamından hazır aralıklar: "250 altı, 250–500, 500–750, 750 üstü" gibi. */
function priceRanges(bounds: { min: number; max: number } | null): Array<[number | null, number | null]> {
  if (!bounds || bounds.max - bounds.min < 4) return [];
  const step = niceStep((bounds.max - bounds.min) / 4);
  const first = Math.max(step, Math.ceil(bounds.min / step) * step);
  const cuts = [first, first + step, first + step * 2].filter((cut) => cut < bounds.max);
  if (!cuts.length) return [];
  const ranges: Array<[number | null, number | null]> = [[null, cuts[0]]];
  for (let i = 1; i < cuts.length; i += 1) ranges.push([cuts[i - 1], cuts[i]]);
  ranges.push([cuts[cuts.length - 1], null]);
  return ranges;
}

function rangeLabel([min, max]: [number | null, number | null], symbol: string) {
  if (min === null && max !== null) return `${formatAmount(max)} ${symbol} altı`;
  if (max === null && min !== null) return `${formatAmount(min)} ${symbol} üstü`;
  return `${formatAmount(min ?? 0)} – ${formatAmount(max ?? 0)} ${symbol}`;
}

interface SectionDef {
  key: string;
  title: string;
  summary: string;
}

function buildSections(data: FilterPanelData, selection: FilterSelection): SectionDef[] {
  const { facets, subOptions } = data;
  const { refine } = selection;
  const sections: SectionDef[] = [];
  if (subOptions.length > 1 || selection.subSelected.length) {
    sections.push({
      key: "sub",
      title: "Kategori",
      summary: subOptions
        .filter((option) => selection.subSelected.includes(option.id))
        .map((option) => option.name)
        .join(", "),
    });
  }
  if ((facets?.brands.length ?? 0) > 1 || refine.brands.length) {
    sections.push({
      key: "brand",
      title: "Marka",
      summary: (facets?.brands ?? [])
        .filter((brand) => refine.brands.includes(brand.key))
        .map((brand) => brand.label)
        .join(", "),
    });
  }
  for (const axis of facets?.attributes ?? []) {
    sections.push({
      key: `attr:${axis.key}`,
      title: axis.label,
      summary: axis.values
        .filter((value) => refine.attrs[axis.key]?.includes(value.key))
        .map((value) => value.label)
        .join(", "),
    });
  }
  if (data.showPrice && (facets?.price || refine.min !== null || refine.max !== null)) {
    sections.push({ key: "price", title: "Fiyat", summary: priceLabel(refine, data.currencySymbol) });
  }
  return sections;
}

export function hasFilterOptions(data: FilterPanelData, selection: FilterSelection) {
  return (
    buildSections(data, selection).length > 0 ||
    (data.facets?.discounted ?? 0) > 0 ||
    selection.refine.discounted
  );
}

// ---------------------------------------------------------------- Ortak parçalar

function CheckRow({
  checked,
  label,
  count,
  onToggle,
  large,
}: {
  checked: boolean;
  label: string;
  count?: number;
  onToggle: () => void;
  large?: boolean;
}) {
  const disabled = !checked && count === 0;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 text-left text-slate-800 transition disabled:opacity-40",
        large ? "border-b border-slate-100 py-3.5 text-[15px]" : "rounded-md px-1 py-1.5 text-sm hover:bg-slate-50",
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          "grid size-[18px] shrink-0 place-content-center rounded border-[1.5px]",
          checked ? "border-[var(--sf-accent)] bg-[var(--sf-accent)] text-white" : "border-slate-300 bg-white",
        )}
      >
        {checked ? <Check className="size-3" strokeWidth={3.5} /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === "number" ? <span className="text-xs tabular-nums text-slate-400">({count})</span> : null}
    </button>
  );
}

function PriceEditor({
  refine,
  bounds,
  symbol,
  onApply,
  large,
}: {
  refine: StorefrontRefine;
  bounds: { min: number; max: number } | null;
  symbol: string;
  onApply: (min: number | null, max: number | null) => void;
  large?: boolean;
}) {
  const appliedKey = `${refine.min}-${refine.max}`;
  const [shownKey, setShownKey] = useState(appliedKey);
  const [minText, setMinText] = useState(refine.min !== null ? String(refine.min) : "");
  const [maxText, setMaxText] = useState(refine.max !== null ? String(refine.max) : "");
  // Dışarıdan (etiket silme, Temizle) değişince kutular güncellenir.
  if (shownKey !== appliedKey) {
    setShownKey(appliedKey);
    setMinText(refine.min !== null ? String(refine.min) : "");
    setMaxText(refine.max !== null ? String(refine.max) : "");
  }
  const read = (text: string) => {
    const n = Number(text.replace(/\./g, "").replace(",", "."));
    return text.trim() && Number.isFinite(n) && n >= 0 ? n : null;
  };
  const submit = () => {
    let min = read(minText);
    let max = read(maxText);
    if (min !== null && max !== null && min > max) [min, max] = [max, min];
    if (min === refine.min && max === refine.max) return;
    onApply(min, max);
  };
  const ranges = priceRanges(bounds);
  const inputClass = cn(
    "w-full min-w-0 rounded-md border border-slate-200 bg-white px-2.5 text-slate-900 outline-none focus:border-[var(--sf-accent)]",
    large ? "h-11 text-[15px]" : "h-9 text-sm",
  );
  return (
    <div>
      <form
        className="flex items-center gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <input
          inputMode="decimal"
          value={minText}
          onChange={(event) => setMinText(event.target.value)}
          onBlur={large ? submit : undefined}
          placeholder="En az"
          className={inputClass}
          aria-label="En az fiyat"
        />
        <span className="text-slate-400">–</span>
        <input
          inputMode="decimal"
          value={maxText}
          onChange={(event) => setMaxText(event.target.value)}
          onBlur={large ? submit : undefined}
          placeholder="En çok"
          className={inputClass}
          aria-label="En çok fiyat"
        />
        {large ? null : (
          <button
            type="submit"
            className="grid size-9 shrink-0 place-content-center rounded-md bg-[var(--sf-accent)] text-white"
            aria-label="Fiyatı uygula"
          >
            <ArrowRight className="size-4" />
          </button>
        )}
      </form>
      {ranges.length ? (
        <div className={cn("flex flex-col", large ? "mt-3" : "mt-2")}>
          {ranges.map((range) => {
            const active = refine.min === range[0] && refine.max === range[1];
            return (
              <button
                key={`${range[0]}-${range[1]}`}
                type="button"
                onClick={() => (active ? onApply(null, null) : onApply(range[0], range[1]))}
                className={cn(
                  "flex items-center gap-3 text-left text-slate-800",
                  large ? "border-b border-slate-100 py-3.5 text-[15px]" : "px-1 py-1.5 text-sm",
                )}
                aria-pressed={active}
              >
                <span
                  className={cn(
                    "grid size-[18px] shrink-0 place-content-center rounded-full border-[1.5px]",
                    active ? "border-[var(--sf-accent)]" : "border-slate-300",
                  )}
                >
                  {active ? <span className="size-2.5 rounded-full bg-[var(--sf-accent)]" /> : null}
                </span>
                {rangeLabel(range, symbol)}
              </button>
            );
          })}
        </div>
      ) : null}
      <p className="mt-2 text-xs text-slate-400">Size tanımlı fiyatlara göre</p>
    </div>
  );
}

function SectionBody({
  sectionKey,
  data,
  selection,
  onChange,
  large,
}: {
  sectionKey: string;
  data: FilterPanelData;
  selection: FilterSelection;
  onChange: (next: FilterSelection) => void;
  large?: boolean;
}) {
  const [query, setQuery] = useState("");
  const { refine } = selection;
  const setRefine = (patch: Partial<StorefrontRefine>) => onChange({ ...selection, refine: { ...refine, ...patch } });

  if (sectionKey === "sub") {
    return (
      <div className={cn(!large && "max-h-64 overflow-y-auto")}>
        {data.subOptions.map((option) => (
          <CheckRow
            key={option.id}
            large={large}
            checked={selection.subSelected.includes(option.id)}
            label={option.name}
            count={option.count}
            onToggle={() => onChange({ ...selection, subSelected: toggle(selection.subSelected, option.id) })}
          />
        ))}
      </div>
    );
  }

  if (sectionKey === "price") {
    return (
      <PriceEditor
        refine={refine}
        bounds={data.facets?.price ?? null}
        symbol={data.currencySymbol}
        large={large}
        onApply={(min, max) => setRefine({ min, max })}
      />
    );
  }

  const values =
    sectionKey === "brand"
      ? data.facets?.brands ?? []
      : data.facets?.attributes.find((axis) => `attr:${axis.key}` === sectionKey)?.values ?? [];
  const axisKey = sectionKey.startsWith("attr:") ? sectionKey.slice(5) : null;
  const selected = axisKey ? refine.attrs[axisKey] ?? [] : refine.brands;
  const needle = query.trim().toLocaleLowerCase("tr-TR");
  const filtered = needle
    ? values.filter((value) => value.label.toLocaleLowerCase("tr-TR").includes(needle))
    : values;

  return (
    <div>
      {values.length > 8 ? (
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={sectionKey === "brand" ? "Marka ara" : "Ara"}
          className={cn(
            "mb-2 w-full rounded-md border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-[var(--sf-accent)]",
            large ? "h-11 text-[15px]" : "h-9 text-sm",
          )}
        />
      ) : null}
      <div className={cn(!large && "max-h-64 overflow-y-auto")}>
        {filtered.map((value) => (
          <CheckRow
            key={value.key}
            large={large}
            checked={selected.includes(value.key)}
            label={value.label}
            count={value.count}
            onToggle={() => {
              const next = toggle(selected, value.key);
              if (axisKey) {
                const attrs = { ...refine.attrs, [axisKey]: next };
                if (!next.length) delete attrs[axisKey];
                setRefine({ attrs });
              } else {
                setRefine({ brands: next });
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

function DiscountToggle({
  checked,
  count,
  onToggle,
  large,
}: {
  checked: boolean;
  count: number;
  onToggle: () => void;
  large?: boolean;
}) {
  if (!checked && count === 0) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center justify-between gap-3 text-left text-slate-900",
        large ? "border-b border-slate-200 px-4 py-4 text-[15.5px]" : "py-3 text-sm font-bold",
      )}
      aria-pressed={checked}
    >
      <span>İndirimdeki ürünler</span>
      <span
        className={cn(
          "relative h-6 w-[42px] shrink-0 rounded-full transition",
          checked ? "bg-[var(--sf-accent)]" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] size-[18px] rounded-full bg-white shadow transition-all",
            checked ? "left-[21px]" : "left-[3px]",
          )}
        />
      </span>
    </button>
  );
}

// ---------------------------------------------------------------- Seçili etiketler

export function FilterPills({
  data,
  selection,
  onChange,
  onClearAll,
  accent,
  className,
}: {
  data: FilterPanelData;
  selection: FilterSelection;
  onChange: (next: FilterSelection) => void;
  onClearAll?: () => void;
  accent?: string;
  className?: string;
}) {
  const { refine } = selection;
  const pills: Array<{ id: string; label: string; remove: () => FilterSelection }> = [];
  for (const id of selection.subSelected) {
    pills.push({
      id: `sub-${id}`,
      label: data.subOptions.find((item) => item.id === id)?.name ?? "Kategori",
      remove: () => ({ ...selection, subSelected: selection.subSelected.filter((item) => item !== id) }),
    });
  }
  for (const key of refine.brands) {
    pills.push({
      id: `brand-${key}`,
      label: data.facets?.brands.find((brand) => brand.key === key)?.label ?? key,
      remove: () => ({ ...selection, refine: { ...refine, brands: refine.brands.filter((item) => item !== key) } }),
    });
  }
  for (const [axis, values] of Object.entries(refine.attrs)) {
    const facet = data.facets?.attributes.find((item) => item.key === axis);
    for (const key of values) {
      pills.push({
        id: `attr-${axis}-${key}`,
        label: facet?.values.find((value) => value.key === key)?.label ?? key,
        remove: () => {
          const attrs = { ...refine.attrs, [axis]: values.filter((item) => item !== key) };
          if (!attrs[axis].length) delete attrs[axis];
          return { ...selection, refine: { ...refine, attrs } };
        },
      });
    }
  }
  if (refine.min !== null || refine.max !== null) {
    pills.push({
      id: "price",
      label: priceLabel(refine, data.currencySymbol),
      remove: () => ({ ...selection, refine: { ...refine, min: null, max: null } }),
    });
  }
  if (refine.discounted) {
    pills.push({
      id: "disc",
      label: "İndirimdekiler",
      remove: () => ({ ...selection, refine: { ...refine, discounted: false } }),
    });
  }
  if (!pills.length) return null;
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      style={accent ? ({ "--sf-accent": accent } as CSSProperties) : undefined}
    >
      {pills.map((pill) => (
        <button
          key={pill.id}
          type="button"
          onClick={() => onChange(pill.remove())}
          className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[var(--sf-accent)] bg-white px-3 py-1 text-[13px] text-slate-800"
        >
          {pill.label}
          <X className="size-3.5 text-[var(--sf-accent)]" strokeWidth={2.5} />
        </button>
      ))}
      {onClearAll && pills.length > 1 ? (
        <button type="button" onClick={onClearAll} className="text-[13px] font-semibold text-[var(--sf-accent)]">
          Tümünü temizle
        </button>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- Masaüstü sol panel

export function FilterSidebar({
  data,
  selection,
  onChange,
  accent,
  className,
}: {
  data: FilterPanelData;
  selection: FilterSelection;
  onChange: (next: FilterSelection) => void;
  accent: string;
  className?: string;
}) {
  const sections = buildSections(data, selection);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const isOpen = (key: string, index: number) => open[key] ?? index < 3;

  return (
    <aside className={cn("w-full text-slate-900", className)} style={{ "--sf-accent": accent } as CSSProperties}>
      {sections.map((section, index) => (
        <div key={section.key} className="border-b border-slate-200">
          <button
            type="button"
            onClick={() => setOpen((current) => ({ ...current, [section.key]: !isOpen(section.key, index) }))}
            className="flex w-full items-center justify-between gap-2 py-3 text-left"
            aria-expanded={isOpen(section.key, index)}
          >
            <span className="min-w-0">
              <span className="block text-sm font-bold">{section.title}</span>
              {section.summary && !isOpen(section.key, index) ? (
                <span className="block truncate text-xs font-semibold text-[var(--sf-accent)]">{section.summary}</span>
              ) : null}
            </span>
            <ChevronDown
              className={cn("size-4 shrink-0 text-slate-500 transition", isOpen(section.key, index) && "rotate-180")}
            />
          </button>
          {isOpen(section.key, index) ? (
            <div className="pb-3">
              <SectionBody sectionKey={section.key} data={data} selection={selection} onChange={onChange} />
            </div>
          ) : null}
        </div>
      ))}
      {(data.facets?.discounted ?? 0) > 0 || selection.refine.discounted ? (
        <div className="border-b border-slate-200">
          <DiscountToggle
            checked={selection.refine.discounted}
            count={data.facets?.discounted ?? 0}
            onToggle={() =>
              onChange({ ...selection, refine: { ...selection.refine, discounted: !selection.refine.discounted } })
            }
          />
        </div>
      ) : null}
    </aside>
  );
}

// ---------------------------------------------------------------- Filtrele düğmesi

export function FilterButton({
  count,
  onClick,
  accent,
  className,
}: {
  count: number;
  onClick: () => void;
  accent: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ "--sf-accent": accent } as CSSProperties}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900",
        className,
      )}
    >
      <SlidersHorizontal className="size-4 text-[var(--sf-accent)]" />
      Filtrele
      {count ? (
        <span className="grid h-5 min-w-5 place-content-center rounded-full bg-[var(--sf-accent)] px-1.5 text-[11px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </button>
  );
}

// ---------------------------------------------------------------- Telefon tam ekran

export function FilterSheet({
  open,
  onClose,
  data,
  buildSubOptions,
  selection,
  onApply,
  loadFacets,
  accent,
}: {
  open: boolean;
  onClose: () => void;
  data: FilterPanelData;
  /** Taslağın seçeneklerinden alt kategori satırları (sayılar alt dallarla toplanır). */
  buildSubOptions: (facets: StorefrontFacets | null) => FilterCategoryOption[];
  selection: FilterSelection;
  onApply: (next: FilterSelection) => void;
  /** Taslak seçime göre seçenekler/sayılar (altta "Ürünleri Listele (N)"). */
  loadFacets: (draft: FilterSelection) => Promise<StorefrontFacets | null>;
  accent: string;
}) {
  const [draft, setDraft] = useState<FilterSelection>(selection);
  const [draftFacets, setDraftFacets] = useState<StorefrontFacets | null>(data.facets);
  const [view, setView] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(false);
  const seq = useRef(0);

  // Her açılışta canlı seçimden başla.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(selection);
      setDraftFacets(data.facets);
      setView(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  function change(next: FilterSelection) {
    setDraft(next);
    const id = ++seq.current;
    void loadFacets(next).then((facets) => {
      if (id === seq.current && facets) setDraftFacets(facets);
    });
  }

  const draftData: FilterPanelData = { ...data, facets: draftFacets, subOptions: buildSubOptions(draftFacets) };
  const sections = buildSections(draftData, draft);
  const current = view ? sections.find((section) => section.key === view) ?? null : null;
  const total = draftFacets?.total ?? null;
  const selections = countFilterSelections(draft);
  const listLabel =
    total === null ? "Ürünleri Listele" : selections ? `Ürünleri Listele (${total})` : `Tüm Sonuçları Listele (${total})`;

  const clearCurrent = () => {
    if (!current) {
      change(EMPTY_FILTER_SELECTION);
      return;
    }
    if (current.key === "sub") {
      change({ ...draft, subSelected: [] });
      return;
    }
    const refine = { ...draft.refine };
    if (current.key === "brand") refine.brands = [];
    if (current.key === "price") {
      refine.min = null;
      refine.max = null;
    }
    if (current.key.startsWith("attr:")) {
      const attrs = { ...refine.attrs };
      delete attrs[current.key.slice(5)];
      refine.attrs = attrs;
    }
    change({ ...draft, refine });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex justify-end bg-slate-900/40"
      style={{ "--sf-accent": accent } as CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-label="Filtrele"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full flex-col bg-white text-slate-900 md:max-w-md md:shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-200 pt-[env(safe-area-inset-top,0px)]">
          <div className="grid h-14 grid-cols-[3rem_1fr_5rem] items-center">
            <button
              type="button"
              onClick={() => (current ? setView(null) : onClose())}
              className="grid size-12 place-content-center"
              aria-label={current ? "Geri" : "Kapat"}
            >
              {current ? <ChevronLeft className="size-6" /> : <X className="size-6" />}
            </button>
            <h2 className="truncate text-center text-[17px] font-bold">{current ? current.title : "Filtrele"}</h2>
            <button
              type="button"
              onClick={clearCurrent}
              className="pr-4 text-right text-sm font-semibold text-[var(--sf-accent)]"
            >
              Temizle
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {current ? (
            <div className="px-4 py-2">
              <SectionBody sectionKey={current.key} data={draftData} selection={draft} onChange={change} large />
            </div>
          ) : (
            <>
              <div className="h-3.5 border-b border-slate-200 bg-slate-100" />
              {selections ? (
                <>
                  <div className="border-b border-slate-200 px-4 pb-4 pt-3.5">
                    <p className="mb-2.5 text-[15px] font-bold">Seçilen Filtreler</p>
                    <FilterPills data={draftData} selection={draft} onChange={change} />
                  </div>
                  <div className="h-3.5 border-b border-slate-200 bg-slate-100" />
                </>
              ) : null}
              {sections.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setView(section.key)}
                  className="flex w-full items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-[15.5px]">{section.title}</span>
                    {section.summary ? (
                      <span className="block truncate text-[12.5px] font-semibold text-[var(--sf-accent)]">
                        {section.summary}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-[var(--sf-accent)]" />
                </button>
              ))}
              <DiscountToggle
                large
                checked={draft.refine.discounted}
                count={draftFacets?.discounted ?? 0}
                onToggle={() => change({ ...draft, refine: { ...draft.refine, discounted: !draft.refine.discounted } })}
              />
              {!sections.length && !(draftFacets?.discounted ?? 0) && !draft.refine.discounted ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">Bu listede filtrelenecek seçenek yok.</p>
              ) : null}
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-3.5 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2.5">
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="h-12 w-full rounded-lg bg-[var(--sf-accent)] text-[15.5px] font-bold text-white"
          >
            {listLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
