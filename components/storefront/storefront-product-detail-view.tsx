"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Check, Minus, Plus, Share2, ShoppingCart } from "lucide-react";
import type { StorefrontProduct } from "@/lib/types";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { STOREFRONT_MODAL_PRODUCT_SIZES } from "@/lib/storefront/image-sizes";
import { cn, formatCurrency } from "@/lib/utils";
import { StorefrontImage } from "@/components/storefront/storefront-image";
import { DiscountSticker, ProductPrice } from "@/components/storefront/storefront-product-card";
import { ProductDescriptionContent } from "@/components/storefront/product-description-content";

// Vitrin ürün sayfası görünümü (/urun/<slug>, 27 Eyl 2026). StorefrontClient
// içinde listenin yerine çizilir; sepet işlemleri geri çağırımlarla oraya
// gider. Tek adımda sepete ekleme: ADET/PAKET/KOLİ kutuları sayfada, açılışta
// 1 adet seçili; eklenince buton "✓ Sepette [− n +]" olur. Modelli
// ürünlerde model seçimi mevcut Sepete Ekle penceresinde yapılır.

function parseCount(value: string) {
  if (value.trim() === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function Stepper({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string | null;
}) {
  const theme = useStorefrontTheme();
  const n = parseCount(value);
  return (
    <div className="min-w-0">
      <p className={cn("mb-1.5 text-xs font-bold uppercase tracking-wide", theme.text)}>{label}</p>
      <div className={cn(theme.quantityStepper, "h-11")}>
        <button
          type="button"
          onClick={() => onChange(String(Math.max(0, n - 1)))}
          className={cn("flex w-9 shrink-0 items-center justify-center", theme.quantityStepperButton)}
          aria-label={`${label} azalt`}
        >
          <Minus className="size-4" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          placeholder="0"
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === "" || /^\d+$/.test(raw)) onChange(raw);
          }}
          className={cn(theme.quantityInput, "font-bold")}
          style={{ fontSize: "16px" }}
          aria-label={label}
        />
        <button
          type="button"
          onClick={() => onChange(String(n + 1))}
          className={cn("flex w-9 shrink-0 items-center justify-center", theme.quantityStepperButton)}
          aria-label={`${label} artır`}
        >
          <Plus className="size-4" />
        </button>
      </div>
      {hint ? <p className={cn("mt-1 text-[11px]", theme.textMuted)}>{hint}</p> : null}
    </div>
  );
}

export function StorefrontProductDetailView({
  product,
  categoryName,
  cartQuantity,
  isMarketTenant,
  description,
  descriptionLoading,
  related,
  onBack,
  onAdd,
  onIncrease,
  onDecrease,
  onChooseVariants,
  onAddVariants,
  variantCartQuantities = {},
  subdomain = null,
  onOpenCart,
}: {
  product: StorefrontProduct;
  categoryName: string | null;
  /** Bu ürünün sepetteki toplam adedi (modelli ürünlerde tüm modeller) */
  cartQuantity: number;
  isMarketTenant: boolean;
  description: string | null | undefined;
  descriptionLoading: boolean;
  related: ReactNode;
  onBack: () => void;
  onAdd: (quantity: number) => void;
  onIncrease: () => void;
  onDecrease: () => void;
  onChooseVariants: () => void;
  /** Bedenler/modeller sayfada (28 Eyl 2026): seçilenleri sepete ekler; hata metni ya da null. */
  onAddVariants?: (selections: Array<{ variantId: string; quantity: number }>) => Promise<string | null>;
  /** variant_id → sepetteki adet */
  variantCartQuantities?: Record<string, number>;
  /** Renkler için (Moda vitrinlerinde /api/storefront/product-colors). */
  subdomain?: string | null;
  onOpenCart: () => void;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const images = useMemo(
    () => [product.image_url, product.image_url_2, product.image_url_3].filter((url): url is string => Boolean(url)),
    [product.image_url, product.image_url_2, product.image_url_3],
  );
  const [imageIndex, setImageIndex] = useState(0);
  const [pieces, setPieces] = useState("1");
  const [packages, setPackages] = useState("");
  const [cartons, setCartons] = useState("");
  const [copied, setCopied] = useState(false);
  const [variantQty, setVariantQty] = useState<Record<string, string>>({});
  const [variantBusy, setVariantBusy] = useState(false);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [colors, setColors] = useState<
    Array<{ id: string; name: string; image_url: string | null; is_in_stock: boolean; href: string; current: boolean }>
  >([]);
  useEffect(() => {
    if (!subdomain) return;
    let cancelled = false;
    void fetch(`/api/storefront/product-colors?subdomain=${encodeURIComponent(subdomain)}&productId=${product.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { colors?: typeof colors } | null) => {
        if (!cancelled && data?.colors) setColors(data.colors);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [subdomain, product.id]);
  // Sepete ekleme geri bildirimi (27 Eyl 2026: "+1 Paket" tıklanınca eklendiği
  // anlaşılmıyordu): tıklanan buton ~1.5 sn "✓ +N eklendi", sayı vurgulanır,
  // altta kısa bildirim çıkar.
  const [flash, setFlash] = useState<{ key: string; amount: number; seq: number } | null>(null);
  const flashTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
  }, []);
  function addWithFeedback(key: string, amount: number) {
    if (amount <= 0) return;
    onAdd(amount);
    setFlash((prev) => ({ key, amount, seq: (prev?.seq ?? 0) + 1 }));
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 1600);
  }

  const packageQty = !isMarketTenant && product.package_quantity ? product.package_quantity : null;
  const cartonQty = !isMarketTenant && product.carton_quantity ? product.carton_quantity : null;
  const total =
    parseCount(pieces) + parseCount(packages) * (packageQty ?? 0) + parseCount(cartons) * (cartonQty ?? 0);
  const unitPrice = typeof product.price === "number" ? product.price : null;
  const inCart = cartQuantity > 0;
  const hasVariants = product.has_variants;
  const sortedVariants = useMemo(
    () => [...(product.variants ?? [])].sort((a, b) => a.display_order - b.display_order),
    [product.variants],
  );
  const variantSelections = sortedVariants
    .map((variant) => ({ variant, quantity: parseCount(variantQty[variant.id] ?? "") }))
    .filter((entry) => entry.quantity > 0 && entry.variant.is_purchasable);
  const variantTotal = variantSelections.reduce((sum, entry) => sum + entry.quantity, 0);
  const variantAmount = variantSelections.reduce(
    (sum, entry) => sum + entry.quantity * (entry.variant.price ?? unitPrice ?? 0),
    0,
  );
  async function addVariants() {
    if (!onAddVariants || !variantTotal || variantBusy) return;
    setVariantBusy(true);
    setVariantError(null);
    const error = await onAddVariants(
      variantSelections.map((entry) => ({ variantId: entry.variant.id, quantity: entry.quantity })),
    );
    setVariantBusy(false);
    if (error) {
      setVariantError(error);
      return;
    }
    setVariantQty({});
    setFlash((prev) => ({ key: "beden", amount: variantTotal, seq: (prev?.seq ?? 0) + 1 }));
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 1600);
  }

  // Paket/koli bilgisi (adet + tutar) yalnız tıklanan butonlarda yazılır
  // (27 Eyl 2026: ayrı bilgi kutuları buton sanılıyordu).
  function unitInfo(count: number) {
    return unitPrice !== null ? `${count} adet · ${formatCurrency(unitPrice * count, product.currency)}` : `${count} adet`;
  }

  function quickPick(kind: "adet" | "paket" | "koli") {
    setPieces(kind === "adet" ? "1" : "");
    setPackages(kind === "paket" ? "1" : "");
    setCartons(kind === "koli" ? "1" : "");
  }
  const activeQuick =
    parseCount(pieces) === 1 && !parseCount(packages) && !parseCount(cartons)
      ? "adet"
      : !parseCount(pieces) && parseCount(packages) === 1 && !parseCount(cartons)
        ? "paket"
        : !parseCount(pieces) && !parseCount(packages) && parseCount(cartons) === 1
          ? "koli"
          : null;

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.product_name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* kullanıcı paylaşımı iptal etti */
    }
  }

  const addLabel = unitPrice !== null && total > 0
    ? `${total} adet · ${formatCurrency(unitPrice * total, product.currency)}`
    : total > 0
      ? `${total} adet`
      : null;

  // Sepete ekle / sepette alanı — masaüstünde bilgi kartında, mobilde altta sabit.
  function actionArea(compact: boolean) {
    if (!product.is_in_stock) {
      return (
        <div className={cn("flex h-14 w-full items-center justify-center rounded-2xl text-base font-bold opacity-60", theme.surfaceMuted, theme.text)}>
          {t("product.soon")}
        </div>
      );
    }
    if (hasVariants && onAddVariants) {
      return (
        <div className="flex w-full items-center gap-2">
          <button
            type="button"
            disabled={!variantTotal || variantBusy}
            onClick={() => void addVariants()}
            className={cn(
              "flex h-14 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-base font-extrabold shadow-lg disabled:opacity-50",
              theme.primaryButton,
            )}
          >
            <ShoppingCart className="size-5 shrink-0" />
            <span className="truncate">
              {variantTotal
                ? `Sepete Ekle · ${variantTotal} adet${variantAmount ? ` · ${formatCurrency(variantAmount, product.currency)}` : ""}`
                : "Beden / model seçin"}
            </span>
          </button>
          {inCart ? (
            <button
              type="button"
              onClick={onOpenCart}
              className={cn("flex h-14 shrink-0 items-center justify-center rounded-2xl px-4 text-sm font-bold", theme.stickyCartButton)}
            >
              Sepet ({cartQuantity}) →
            </button>
          ) : null}
        </div>
      );
    }
    if (inCart) {
      return (
        <div className="flex w-full items-center gap-2">
          <div
            className={cn(
              "flex h-14 min-w-0 flex-1 items-center justify-between rounded-2xl pl-4 pr-1.5 font-bold",
              theme.stickyCartButton,
            )}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Check className="size-5 shrink-0" /> Sepette
            </span>
            {hasVariants ? (
              <button
                type="button"
                onClick={onChooseVariants}
                className="flex h-11 items-center rounded-xl bg-white/15 px-3 text-sm"
              >
                {cartQuantity} adet · Düzenle
              </button>
            ) : (
              <span className="flex h-11 items-center rounded-xl bg-white/15">
                <button type="button" onClick={onDecrease} className="flex h-full w-10 items-center justify-center" aria-label="Azalt">
                  <Minus className="size-4" />
                </button>
                <span
                  key={flash?.seq ?? 0}
                  className={cn("w-9 text-center text-base tabular-nums", flash && "animate-[ek-pop_0.45s_ease-out]")}
                >
                  {cartQuantity}
                </span>
                <button type="button" onClick={onIncrease} className="flex h-full w-10 items-center justify-center" aria-label="Artır">
                  <Plus className="size-4" />
                </button>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onOpenCart}
            className={cn(
              "flex h-14 shrink-0 items-center justify-center rounded-2xl px-4 text-sm font-bold",
              compact ? "" : "sm:px-6",
              theme.primaryButton,
            )}
          >
            Sepete Git →
          </button>
        </div>
      );
    }
    return (
      <button
        type="button"
        disabled={!hasVariants && total <= 0}
        onClick={() => (hasVariants ? onChooseVariants() : addWithFeedback("ekle", total))}
        className={cn(
          "flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-4 text-base font-extrabold shadow-lg disabled:opacity-50",
          theme.primaryButton,
        )}
      >
        <ShoppingCart className="size-5 shrink-0" />
        <span className="truncate">
          {hasVariants ? "Model Seç ve Sepete Ekle" : "Sepete Ekle"}
          {!hasVariants && addLabel ? <span className="font-semibold opacity-90"> · {addLabel}</span> : null}
        </span>
      </button>
    );
  }

  return (
    <div className="pb-28 lg:pb-4">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={onBack}
          className={cn("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold", theme.surface, theme.border, "border", theme.text)}
        >
          <ArrowLeft className="size-4" /> Listeye dön
        </button>
        {categoryName ? <span className={cn("truncate", theme.textMuted)}>{categoryName}</span> : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* Galeri */}
        <div className={cn("rounded-3xl border p-4 sm:p-6", theme.surface, theme.border)}>
          <div className="relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden rounded-2xl">
            {images.length ? (
              <StorefrontImage
                src={images[Math.min(imageIndex, images.length - 1)]}
                alt={product.product_name}
                className="object-contain"
                sizes={STOREFRONT_MODAL_PRODUCT_SIZES}
                priority
              />
            ) : (
              <div className={cn("flex h-full items-center justify-center", theme.emptyImage)} />
            )}
            <DiscountSticker product={product} />
          </div>
          {images.length > 1 ? (
            <div className="mt-4 flex gap-2.5">
              {images.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setImageIndex(index)}
                  className={cn(
                    "relative size-16 overflow-hidden rounded-xl border-2 sm:size-20",
                    index === imageIndex ? "border-[var(--ek-add-to-cart,#10b981)]" : cn("border-transparent", theme.border),
                  )}
                  aria-label={`${index + 1}. görsel`}
                >
                  <StorefrontImage src={src} alt="" className="object-contain" sizes="80px" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Bilgi + sepete ekle */}
        <div className={cn("rounded-3xl border p-5 sm:p-7", theme.surface, theme.border)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {product.sku_code ? (
                <span className={cn("rounded-lg px-2.5 py-1 text-xs font-bold", theme.stockBadgeIn)}>{product.sku_code.toUpperCase()}</span>
              ) : null}
              {product.is_in_stock ? (
                <span className={cn(theme.stockBadgeIn, "px-2.5 py-1 text-xs")}>● Stokta</span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={share}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold", theme.border, theme.text)}
            >
              <Share2 className="size-3.5" /> {copied ? "Link kopyalandı" : "Paylaş"}
            </button>
          </div>

          <h1 className={cn("mt-3 text-xl font-extrabold leading-tight sm:text-2xl lg:text-[28px]", theme.text)}>
            {product.product_name}
          </h1>

          <div className="mt-2 flex items-baseline gap-2">
            <ProductPrice product={product} size="modal" />
            {unitPrice !== null ? <span className={cn("text-sm", theme.textMuted)}>/ adet</span> : null}
          </div>

          {colors.length ? (
            <div className="mt-5">
              <p className={cn("mb-2 text-[11px] font-bold uppercase tracking-[0.12em]", theme.textMuted)}>
                Renkler ({colors.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <a
                    key={color.id}
                    href={color.href}
                    title={color.name}
                    aria-current={color.current ? "true" : undefined}
                    className={cn(
                      "relative block h-[84px] w-14 overflow-hidden rounded-lg border-2 transition",
                      color.current ? "border-[var(--ek-add-to-cart,#111)]" : cn("border-transparent opacity-80 hover:opacity-100", theme.border),
                      !color.is_in_stock && "opacity-40",
                    )}
                  >
                    {color.image_url ? (
                      <StorefrontImage src={color.image_url} alt={color.name} className="object-cover" sizes="56px" />
                    ) : null}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {hasVariants && onAddVariants && product.is_in_stock ? (
            <div className="mt-5">
              <p className={cn("mb-2 text-[11px] font-bold uppercase tracking-[0.12em]", theme.textMuted)}>
                Beden / Model — adet seçin
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {sortedVariants.map((variant) => {
                  const inCartCount = variantCartQuantities[variant.id] ?? 0;
                  const priceDiffers = variant.price !== null && unitPrice !== null && variant.price !== unitPrice;
                  if (!variant.is_purchasable) {
                    // Stepper ile aynı iskelet (etiket + h-11 kutu): ızgarada
                    // tükenen beden diğerlerinden büyük/farklı durmasın.
                    return (
                      <div key={variant.id} className="min-w-0 opacity-50">
                        <p className={cn("mb-1.5 text-xs font-bold uppercase tracking-wide line-through", theme.text)}>
                          {variant.model_name}
                        </p>
                        <div
                          className={cn(
                            theme.quantityStepper,
                            "flex h-11 items-center justify-center text-xs font-semibold",
                            theme.textMuted,
                          )}
                        >
                          Tükendi
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={variant.id} className="min-w-0">
                      <Stepper
                        label={variant.model_name}
                        value={variantQty[variant.id] ?? ""}
                        onChange={(value) => {
                          setVariantError(null);
                          setVariantQty((current) => ({ ...current, [variant.id]: value }));
                        }}
                        hint={
                          [
                            priceDiffers && variant.price !== null ? formatCurrency(variant.price, product.currency) : null,
                            inCartCount ? `Sepette ${inCartCount}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || null
                        }
                      />
                    </div>
                  );
                })}
              </div>
              {variantError ? <p className={cn("mt-2 text-sm font-medium", theme.dangerText)}>{variantError}</p> : null}
            </div>
          ) : null}

          {product.is_in_stock && !hasVariants && !inCart ? (
            <>
              {(packageQty || cartonQty) ? (
                <div className="mt-5">
                  <p className={cn("mb-2 text-[11px] font-bold uppercase tracking-[0.12em]", theme.textMuted)}>Hızlı seç</p>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ["adet", "1 Adet", null],
                      packageQty ? ["paket", "1 Paket", packageQty] : null,
                      cartonQty ? ["koli", "1 Koli", cartonQty] : null,
                    ].filter(Boolean) as Array<[ "adet" | "paket" | "koli", string, number | null]>).map(([kind, label, count]) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => quickPick(kind)}
                        className={cn(
                          "rounded-xl px-3.5 py-2 text-sm font-semibold",
                          activeQuick === kind ? theme.categoryNavChip(true) : cn("border", theme.border, theme.text),
                        )}
                      >
                        {label}
                        {count ? <span className="ml-1 text-xs font-medium opacity-75">· {unitInfo(count)}</span> : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className={cn("mt-4 grid gap-2.5", packageQty && cartonQty ? "grid-cols-3" : packageQty || cartonQty ? "grid-cols-2" : "grid-cols-1 max-w-[220px]")}>
                <Stepper label="Adet" value={pieces} onChange={setPieces} />
                {packageQty ? <Stepper label="Paket" value={packages} onChange={setPackages} hint={`1 Paket = ${packageQty} adet`} /> : null}
                {cartonQty ? <Stepper label="Koli" value={cartons} onChange={setCartons} hint={`1 Koli = ${cartonQty} adet`} /> : null}
              </div>
            </>
          ) : null}

          {inCart && !hasVariants && (packageQty || cartonQty) ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {packageQty ? (
                <button
                  type="button"
                  onClick={() => addWithFeedback("paket", packageQty)}
                  className={cn(
                    "rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
                    flash?.key === "paket" ? theme.primaryButton : cn("border", theme.border, theme.text),
                  )}
                >
                  {flash?.key === "paket" ? (
                    <span className="inline-flex items-center gap-1"><Check className="size-4" /> +{packageQty} eklendi</span>
                  ) : (
                    <>+ 1 Paket <span className="text-xs font-medium opacity-75">· {unitInfo(packageQty)}</span></>
                  )}
                </button>
              ) : null}
              {cartonQty ? (
                <button
                  type="button"
                  onClick={() => addWithFeedback("koli", cartonQty)}
                  className={cn(
                    "rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
                    flash?.key === "koli" ? theme.primaryButton : cn("border", theme.border, theme.text),
                  )}
                >
                  {flash?.key === "koli" ? (
                    <span className="inline-flex items-center gap-1"><Check className="size-4" /> +{cartonQty} eklendi</span>
                  ) : (
                    <>+ 1 Koli <span className="text-xs font-medium opacity-75">· {unitInfo(cartonQty)}</span></>
                  )}
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 hidden lg:block">{actionArea(false)}</div>
        </div>
      </div>

      <div className={cn("mt-5 rounded-3xl border p-5 sm:p-7", theme.surface, theme.border)}>
        <h2 className={cn("mb-2 text-base font-bold sm:text-lg", theme.text)}>Ürün Açıklaması</h2>
        {descriptionLoading && description === undefined ? (
          <div className={cn("h-16 animate-pulse rounded-xl", theme.surfaceMuted)} />
        ) : (
          <ProductDescriptionContent content={description ?? null} />
        )}
      </div>

      {related ? <div className="mt-6">{related}</div> : null}

      {flash ? (
        <div
          key={flash.seq}
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex justify-center px-4 lg:bottom-8"
        >
          <div className={cn("flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-2xl animate-[ek-toast_0.25s_ease-out]", theme.stickyCartButton)}>
            <Check className="size-4 shrink-0" />
            +{flash.amount} adet sepete eklendi · sepette {cartQuantity}
          </div>
        </div>
      ) : null}

      {/* Mobil: altta sabit sepete ekle */}
      <div className={cn("fixed inset-x-0 bottom-0 z-40 border-t px-3.5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 lg:hidden", theme.surface, theme.border)}>
        {actionArea(true)}
      </div>
    </div>
  );
}
