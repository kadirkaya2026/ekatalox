"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  Lock,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Search,
  ShoppingCart,
  Store,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { BRAND_COLOR_PRESETS } from "@/lib/storefront/appearance-catalog";
import {
  applyBrandColorOverrides,
  buildBrandCssVariables,
  type BrandColorSettings,
} from "@/lib/storefront/brand-colors";
import {
  BRAND_COLOR_ROLE_GROUPS,
  BRAND_COLOR_ROLES,
  isHexColor,
  normalizeBrandPalette,
  normalizeHexColor,
  resolveBrandPalette,
  type BrandColorRole,
  type BrandColorRoleKey,
} from "@/lib/storefront/brand-palette";
import { getStorefrontTheme, type StorefrontTheme } from "@/lib/storefront/themes";
import { cn, formatCurrency } from "@/lib/utils";

/** Formdaki ham palet: yazılırken geçersiz hex de tutulabilir; önizleme
 *  normalize edilmiş halini, kayıt ham halini (validator hata versin) kullanır. */
export type BrandPaletteDraft = Partial<Record<BrandColorRoleKey, string>>;

type HighlightTarget = BrandColorRoleKey | "legacyPrimary" | "legacyAccent";
type PreviewView = "store" | "checkout";

// Hangi rol önizlemenin hangi ekranında görünüyor (vurgulanınca o ekrana geçilir).
const CHECKOUT_VIEW_ROLES = new Set<BrandColorRoleKey>(["stickyCart", "whatsappCheckout", "gateSubmit"]);

function rolesForTarget(
  target: HighlightTarget | null,
  draft: BrandPaletteDraft,
): Set<BrandColorRoleKey> {
  if (!target) return new Set();
  if (target === "legacyPrimary" || target === "legacyAccent") {
    const legacy = target === "legacyPrimary" ? "primary" : "accent";
    // Ana/Rozet rengi yalnız kendi rengi seçilmemiş rollere düşer.
    return new Set(
      BRAND_COLOR_ROLES.filter((role) => role.legacy === legacy && !isHexColor(draft[role.key])).map(
        (role) => role.key,
      ),
    );
  }
  return new Set([target]);
}

export function BrandPaletteEditor({
  themeKey,
  primaryColor,
  accentColor,
  palette,
  storefrontTitle,
  logoUrl,
  onPrimaryChange,
  onAccentChange,
  onRoleChange,
  onResetAll,
  previewHref,
}: {
  themeKey: string;
  primaryColor: string;
  accentColor: string;
  palette: BrandPaletteDraft;
  storefrontTitle?: string | null;
  logoUrl?: string | null;
  onPrimaryChange: (value: string) => void;
  onAccentChange: (value: string) => void;
  onRoleChange: (key: BrandColorRoleKey, value: string) => void;
  onResetAll: () => void;
  previewHref?: string | null;
}) {
  const [hovered, setHovered] = useState<HighlightTarget | null>(null);
  const [focused, setFocused] = useState<HighlightTarget | null>(null);
  const [pinned, setPinned] = useState<HighlightTarget | null>(null);
  const [view, setView] = useState<PreviewView>("store");
  const previewRef = useRef<HTMLDivElement>(null);

  // "Göster" ile sabitlenen vurgu birkaç saniye sonra kendiliğinden söner.
  useEffect(() => {
    if (!pinned) return;
    const timer = setTimeout(() => setPinned(null), 3200);
    return () => clearTimeout(timer);
  }, [pinned]);

  const target = hovered ?? focused ?? pinned;
  const highlighted = rolesForTarget(target, palette);
  const singleRole = target && target !== "legacyPrimary" && target !== "legacyAccent" ? target : null;
  const effectiveView: PreviewView = singleRole
    ? CHECKOUT_VIEW_ROLES.has(singleRole)
      ? "checkout"
      : "store"
    : view;

  const brandColors: BrandColorSettings = useMemo(
    () => ({
      brand_primary_color: isHexColor(primaryColor) ? normalizeHexColor(primaryColor) : null,
      brand_accent_color: isHexColor(accentColor) ? normalizeHexColor(accentColor) : null,
      brand_palette: normalizeBrandPalette(palette),
    }),
    [primaryColor, accentColor, palette],
  );
  const resolved = useMemo(() => resolveBrandPalette(brandColors), [brandColors]);

  function show(targetKey: HighlightTarget) {
    setPinned(targetKey);
    // Mobilde önizleme formun altında kalıyor; görünür olsun.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  const bind = (targetKey: HighlightTarget) => ({
    onMouseEnter: () => setHovered(targetKey),
    onMouseLeave: () => setHovered((current) => (current === targetKey ? null : current)),
    onFocus: () => setFocused(targetKey),
    onBlur: () => setFocused((current) => (current === targetKey ? null : current)),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-slate-900">Varsayılan renkler</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Tek seçimle her şeyi boyar. Aşağıda kendi rengi seçilen buton / alan bu varsayılanın
            yerine kendi rengini kullanır.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <ColorRow
              label="Ana renk (tüm butonlar için varsayılan)"
              where="Kendi rengi seçilmemiş tüm butonlar, fiyatlar, seçili kategori ve üstteki sepet."
              value={primaryColor}
              pickerFallback="#059669"
              placeholder="#059669"
              emptyLabel="Temadan"
              onChange={onPrimaryChange}
              onClear={() => onPrimaryChange("")}
              onShow={() => show("legacyPrimary")}
              active={target === "legacyPrimary"}
              bind={bind("legacyPrimary")}
            />
            <ColorRow
              label="Rozet rengi (varsayılan)"
              where={'Kendi rengi seçilmemiş model / varyant rozetleri (ör. "3 Model").'}
              value={accentColor}
              pickerFallback={resolved.variantBadge ?? "#10b981"}
              placeholder={resolved.variantBadge ?? "#10b981"}
              emptyLabel={primaryColor ? "Ana renkten" : "Temadan"}
              onChange={onAccentChange}
              onClear={() => onAccentChange("")}
              onShow={() => show("legacyAccent")}
              active={target === "legacyAccent"}
              bind={bind("legacyAccent")}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Hazır paletler:</span>
            {BRAND_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onPrimaryChange(preset.primary);
                  onAccentChange(preset.accent);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
              >
                <span className="flex -space-x-1">
                  <span className="size-3 rounded-full ring-1 ring-white" style={{ backgroundColor: preset.primary }} />
                  <span className="size-3 rounded-full ring-1 ring-white" style={{ backgroundColor: preset.accent }} />
                </span>
                {preset.label}
              </button>
            ))}
          </div>
        </section>

        {BRAND_COLOR_ROLE_GROUPS.map((group) => (
          <section key={group.key}>
            <h3 className="text-sm font-semibold text-slate-900">{group.label}</h3>
            {group.hint ? <p className="mt-1 text-xs leading-5 text-slate-500">{group.hint}</p> : null}
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {BRAND_COLOR_ROLES.filter((role) => role.group === group.key).map((role) => (
                <ColorRow
                  key={role.key}
                  label={role.label}
                  where={role.where}
                  value={palette[role.key] ?? ""}
                  pickerFallback={resolved[role.key] ?? (role.group === "sections" ? "#ffffff" : "#64748b")}
                  placeholder={resolved[role.key] ?? "#rrggbb"}
                  emptyLabel={emptyLabelFor(role, brandColors)}
                  onChange={(value) => onRoleChange(role.key, value)}
                  onClear={() => onRoleChange(role.key, "")}
                  onShow={() => show(role.key)}
                  active={highlighted.has(role.key) && target === role.key}
                  bind={bind(role.key)}
                />
              ))}
            </div>
          </section>
        ))}

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Tüm buton renkleri, ana renk ve rozet rengi temanın renklerine dönecek. Devam edilsin mi?")) {
                onResetAll();
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="size-4" />
            Tümünü varsayılana döndür
          </button>
          <p className="text-xs text-slate-500">
            Değişiklikler aşağıdaki <strong>Görünüm ayarlarını kaydet</strong> ile mağazaya uygulanır.
          </p>
        </div>
      </div>

      <div ref={previewRef} className="min-w-0 lg:sticky lg:top-4 lg:self-start">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">Canlı önizleme</p>
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
            {(
              [
                ["store", "Mağaza"],
                ["checkout", "Sepet ve giriş"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                aria-pressed={effectiveView === key}
                className={cn(
                  "rounded-full px-3 py-1 transition",
                  effectiveView === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <BrandPalettePreview
          themeKey={themeKey}
          brandColors={brandColors}
          highlighted={highlighted}
          view={effectiveView}
          storefrontTitle={storefrontTitle}
          logoUrl={logoUrl}
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Bir rengin üstüne gelin ya da <strong>Göster</strong>&apos;e basın; kullanıldığı yerler
          önizlemede yanıp söner. Önizleme açık (gündüz) modu gösterir.
        </p>
        {previewHref ? (
          <a
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Eye className="size-4" />
            Mağazada önizle
          </a>
        ) : null}
      </div>
    </div>
  );
}

function emptyLabelFor(role: BrandColorRole, brandColors: BrandColorSettings): string {
  if (role.legacy === "primary" && (brandColors.brand_primary_color || brandColors.brand_accent_color)) {
    return "Ana renkten";
  }
  if (role.legacy === "accent" && (brandColors.brand_accent_color || brandColors.brand_primary_color)) {
    return brandColors.brand_accent_color ? "Rozet renginden" : "Ana renkten";
  }
  return "Temadan";
}

function ColorRow({
  label,
  where,
  value,
  pickerFallback,
  placeholder,
  emptyLabel,
  onChange,
  onClear,
  onShow,
  active,
  bind,
}: {
  label: string;
  where: string;
  value: string;
  pickerFallback: string;
  placeholder: string;
  emptyLabel: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onShow: () => void;
  active: boolean;
  bind: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: () => void;
  };
}) {
  const isSet = value.trim() !== "";
  const invalid = isSet && !isHexColor(value);

  return (
    <div
      {...bind}
      className={cn(
        "rounded-xl border p-3 transition",
        active ? "border-fuchsia-300 bg-fuchsia-50/40" : "border-slate-200 bg-white hover:border-slate-300",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <button
          type="button"
          onClick={onShow}
          className="shrink-0 text-xs font-semibold text-emerald-700 hover:underline"
        >
          Göster
        </button>
      </div>
      <p className="mt-0.5 text-xs leading-5 text-slate-500">{where}</p>
      <div className="mt-2 flex items-center gap-2">
        <Input
          type="color"
          aria-label={`${label} renk seçici`}
          value={isHexColor(value) ? normalizeHexColor(value) : pickerFallback}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-14 shrink-0 cursor-pointer p-1"
        />
        <Input
          aria-label={`${label} HEX kodu`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={cn("h-10 min-w-0 font-mono text-sm", invalid && "border-rose-400 focus-visible:ring-rose-300")}
        />
        {isSet ? (
          <button
            type="button"
            onClick={onClear}
            title="Temanın / varsayılanın rengine dön"
            className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <X className="size-3.5" />
            Temadan
          </button>
        ) : (
          <span className="inline-flex h-10 shrink-0 items-center rounded-lg bg-slate-50 px-2 text-[11px] font-medium text-slate-500">
            {emptyLabel}
          </span>
        )}
      </div>
      {invalid ? <p className="mt-1 text-xs text-rose-600">HEX biçiminde girin (ör. #1d4ed8).</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Canlı önizleme: vitrinle AYNI tema sınıfları + AYNI CSS değişken üreticisi
// (buildBrandCssVariables) kullanılır; kaydetmeden önce formdaki renkler
// birebir görünür. Her öğe data-color-role taşır; vurgulanan roller yanıp
// söner (hareket azaltma tercihinde sabit çerçeve).
// ---------------------------------------------------------------------------

const PREVIEW_PRODUCTS = [
  { name: "Soğuk Çay 330 ml", price: 42.5, discount: 15 },
  { name: "Fındıklı Çikolata", price: 64.9, variants: 3 },
  { name: "Maden Suyu 6'lı", price: 89.0, inCart: 2 },
  { name: "Patates Cipsi", price: 37.75 },
] as const;

const highlightCss = `
@keyframes ek-role-pulse {
  0%, 100% { outline-color: rgba(217, 70, 239, 0.95); outline-offset: 2px; }
  50% { outline-color: rgba(217, 70, 239, 0.25); outline-offset: 5px; }
}
.ek-palette-preview [data-hl="true"] {
  outline: 2.5px solid rgba(217, 70, 239, 0.95);
  outline-offset: 2px;
  animation: ek-role-pulse 1.1s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .ek-palette-preview [data-hl="true"] { animation: none; }
}
`;

function BrandPalettePreview({
  themeKey,
  brandColors,
  highlighted,
  view,
  storefrontTitle,
  logoUrl,
}: {
  themeKey: string;
  brandColors: BrandColorSettings;
  highlighted: Set<BrandColorRoleKey>;
  view: PreviewView;
  storefrontTitle?: string | null;
  logoUrl?: string | null;
}) {
  const theme = useMemo(
    () => applyBrandColorOverrides(getStorefrontTheme(themeKey, "light"), brandColors, "light"),
    [themeKey, brandColors],
  );
  const style = buildBrandCssVariables(brandColors);
  const role = (key: BrandColorRoleKey) => ({
    "data-color-role": key,
    "data-hl": highlighted.has(key) ? "true" : undefined,
  });
  const title = storefrontTitle?.trim() || "Mağaza Adı";

  return (
    <div
      className="ek-palette-preview mx-auto w-full max-w-[360px] rounded-[2.2rem] bg-slate-900 p-1.5 shadow-xl"
      aria-hidden="true"
    >
      <style>{highlightCss}</style>
      <div
        style={style}
        className="pointer-events-none relative h-[600px] select-none overflow-hidden rounded-[1.7rem]"
      >
        {view === "store" ? (
          <StorePreview theme={theme} role={role} title={title} logoUrl={logoUrl} />
        ) : (
          <CheckoutPreview theme={theme} role={role} title={title} />
        )}
      </div>
    </div>
  );
}

type RoleProps = (key: BrandColorRoleKey) => Record<string, string | undefined>;

function StorePreview({
  theme,
  role,
  title,
  logoUrl,
}: {
  theme: StorefrontTheme;
  role: RoleProps;
  title: string;
  logoUrl?: string | null;
}) {
  return (
    <div
      {...role("pageBg")}
      className={cn(theme.page, "flex h-full min-h-0 flex-col overflow-hidden pb-0 xl:pb-0")}
    >
      <div {...role("headerBg")} className={cn(theme.header, theme.headerBorder, "static z-auto border-b backdrop-blur-none")}>
        <div className="flex items-center gap-2 px-3 pt-3">
          <div className={cn(theme.logoWrap, "size-9 rounded-xl")}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- küçük önizleme
              <img src={logoUrl} alt="" className="size-full object-contain p-0.5" />
            ) : (
              <Store className={cn("size-4", theme.logoPlaceholder)} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn(theme.headerTitle, "text-sm")}>{title}</p>
            <p className={cn("text-[10px]", theme.headerMuted)}>Toptan sipariş</p>
          </div>
          <div
            {...role("headerCart")}
            className={cn(theme.cartButton, theme.cartButtonActive, "h-9 min-w-9 rounded-xl px-2.5 lg:h-9 lg:min-w-9")}
          >
            <ShoppingCart className="size-4 shrink-0" />
            <span className={theme.cartBadge}>3</span>
          </div>
        </div>
        <div className="px-3 pt-2.5">
          <div className={cn(theme.searchWrap, "flex h-9 items-center rounded-xl")}>
            <Search className={cn(theme.searchIcon, "left-3 size-4")} />
            <span className={cn("pl-9 text-xs", theme.textMuted)}>Ürün ara…</span>
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden whitespace-nowrap px-3 pt-2.5">
          <span className={cn(theme.categoryNavMobile(false), "pb-2 text-xs")}>Tümü</span>
          <span {...role("activeCategory")} className={cn(theme.categoryNavMobile(true), "pb-2 text-xs")}>
            İçecek
          </span>
          <span className={cn(theme.categoryNavMobile(false), "pb-2 text-xs")}>Atıştırmalık</span>
          <span className={cn(theme.categoryNavMobile(false), "pb-2 text-xs")}>Temizlik</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-hidden px-3 pt-3">
        <div className="flex gap-2 overflow-hidden">
          <span className={cn(theme.categorySubChip(false), "px-3 py-1.5 text-[11px]")}>Gazlı</span>
          <span {...role("activeCategory")} className={cn(theme.categorySubChip(true), "px-3 py-1.5 text-[11px]")}>
            Soğuk çay
          </span>
          <span className={cn(theme.categorySubChip(false), "px-3 py-1.5 text-[11px]")}>Su</span>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-600 p-3 text-white">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Kampanya</p>
            <p className="truncate text-xs font-bold">Hafta sonu %10 indirim</p>
          </div>
          <span {...role("campaignButton")} className={cn(theme.primaryButton, "shrink-0 rounded-lg px-2.5 py-1.5 text-[11px]")}>
            İncele
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-4 pt-1">
          {PREVIEW_PRODUCTS.map((product) => {
            const inCart = "inCart" in product;
            return (
              <div
                key={product.name}
                className={cn(
                  theme.productCard,
                  "relative h-auto overflow-visible rounded-2xl hover:translate-y-0",
                  // Vitrindeki "çevreyi dolanan çizgi" (BorderTrace) currentColor
                  // kullanır; önizlemede aynı renk ring ile gösterilir.
                  inCart && cn("ring-2 ring-current", theme.productImageSparkle),
                )}
                {...(inCart ? role("addToCart") : {})}
              >
                {inCart ? (
                  <div
                    {...role("qtyStepper")}
                    className={cn(
                      "absolute -right-1.5 -top-1.5 z-10 flex w-8 flex-col items-center rounded-2xl p-0.5 text-white",
                      theme.floatingCartStepper,
                    )}
                  >
                    <Plus className="my-1 size-3.5" />
                    <span className="text-[10px] font-bold leading-4">{product.inCart}</span>
                    <Minus className="my-1 size-3.5" />
                  </div>
                ) : (
                  <span
                    {...role("addToCart")}
                    className={cn(theme.floatingCartAddButton, "absolute -right-1.5 -top-1.5 z-10 size-8")}
                  >
                    <Plus className="size-3.5" strokeWidth={2.8} />
                  </span>
                )}
                <div className={cn(theme.productImageWrap, "relative flex aspect-[4/3] items-center justify-center rounded-2xl")}>
                  {"discount" in product ? (
                    <span
                      {...role("discountBadge")}
                      className={cn("absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold shadow-sm", theme.discountBadge)}
                    >
                      %{product.discount}
                    </span>
                  ) : null}
                  <Package className={cn("size-8 opacity-40", theme.logoPlaceholder)} />
                </div>
                <div className="space-y-1 p-2">
                  <p className={cn(theme.productTitle, "text-[11px] leading-4 sm:text-[11px]")}>{product.name}</p>
                  <div className="flex items-center justify-between gap-1">
                    <p {...role("price")} className={cn(theme.productPrice, "text-xs")}>
                      {formatCurrency(product.price, "TRY")}
                    </p>
                    {"variants" in product ? (
                      <span
                        {...role("variantBadge")}
                        className={cn("rounded-full font-semibold", theme.variantBadge, "px-1.5 py-0.5 text-[9px]")}
                      >
                        {product.variants} Model
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div {...role("footerBg")} className={cn(theme.footerShell, "px-3 py-2.5")}>
        <p className={cn(theme.footerHeading, "mb-0.5 text-[9px]")}>İletişim</p>
        <p className={cn(theme.footerText, "text-[11px] leading-5")}>
          0 212 000 00 00 · <span className={theme.footerLink}>Instagram</span>
        </p>
      </div>
    </div>
  );
}

function CheckoutPreview({
  theme,
  role,
  title,
}: {
  theme: StorefrontTheme;
  role: RoleProps;
  title: string;
}) {
  return (
    <div className={cn(theme.page, "flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3 pb-3 xl:pb-3")}>
      <div className={cn(theme.cartDrawerPanel, "static inset-auto z-auto flex flex-col overflow-hidden rounded-2xl lg:static lg:h-auto lg:w-auto lg:rounded-2xl")}>
        <div className={cn("flex items-center justify-between px-3 py-2.5", theme.cartDrawerHeaderBorder)}>
          <p className={cn(theme.cartDrawerTitle, "text-base sm:text-base")}>Sepetim</p>
          <span className={cn("text-[11px]", theme.cartDrawerMuted)}>3 ürün</span>
        </div>
        <div className={cn("space-y-2 p-3", theme.cartDrawerScroll)}>
          {[
            ["Maden Suyu 6'lı", 2, 89],
            ["Soğuk Çay 330 ml", 1, 36.13],
          ].map(([name, qty, price]) => (
            <div key={String(name)} className={cn(theme.cartDrawerItem, "flex items-center justify-between gap-2 rounded-xl p-2.5")}>
              <div className="min-w-0">
                <p className={cn("truncate text-xs font-semibold", theme.text)}>{name}</p>
                <p className={cn("text-[10px]", theme.textMuted)}>{qty} adet</p>
              </div>
              <p className={cn("text-xs font-bold", theme.text)}>{formatCurrency(Number(price) * Number(qty), "TRY")}</p>
            </div>
          ))}
        </div>
        <div className={cn(theme.cartDrawerFooter, "space-y-2 p-3")}>
          <div className="grid grid-cols-2 gap-2">
            <span {...role("whatsappCheckout")} className={cn("rounded-lg border px-2 py-1.5 text-center text-[11px] font-semibold", theme.cartPaymentCashActive)}>
              Nakit
            </span>
            <span className={cn("rounded-lg border px-2 py-1.5 text-center text-[11px] font-semibold", theme.cartPaymentInactive)}>
              Kart
            </span>
          </div>
          <span
            {...role("whatsappCheckout")}
            className={cn(theme.checkoutButton, "flex h-10 w-full items-center justify-center rounded-full px-3 py-0 text-[13px] font-bold shadow-none")}
          >
            WhatsApp ile Siparişi Tamamla
          </span>
        </div>
      </div>

      <div className={cn(theme.stickyCart, "static inset-auto z-auto mx-0 max-w-none rounded-2xl p-2.5 shadow-none md:bottom-auto")}>
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 text-[12px] font-semibold text-white">Sipariş özeti</p>
          <p className="text-[12px] font-bold text-white">{formatCurrency(214.13, "TRY")}</p>
          <span {...role("stickyCart")} className={cn(theme.stickyCartButton, "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold")}>
            Devam
          </span>
        </div>
      </div>

      <div className={cn(theme.gateCard, "max-w-none rounded-2xl p-4")}>
        <p {...role("gateSubmit")} className={cn(theme.gateEyebrow, "text-[10px]")}>
          Bayi girişi
        </p>
        <p className={cn(theme.gateTitle, "mt-1 text-base")}>{title}</p>
        <div className={cn("mt-3 flex h-9 items-center gap-2 rounded-lg border px-3 text-xs", theme.border, theme.surface, theme.textMuted)}>
          <Lock className="size-3.5" />
          Mağaza şifresi
        </div>
        <span
          {...role("gateSubmit")}
          className={cn(theme.gateButton, "mt-2.5 flex h-9 w-full items-center justify-center rounded-lg text-xs")}
        >
          Mağaza&apos;ya Gir
        </span>
      </div>
    </div>
  );
}
