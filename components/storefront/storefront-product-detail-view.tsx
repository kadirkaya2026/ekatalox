"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Box, Check, Minus, Plus, Share2, ShoppingCart } from "lucide-react";
import type { StorefrontProduct } from "@/lib/types";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { STOREFRONT_MODAL_PRODUCT_SIZES } from "@/lib/storefront/image-sizes";
import { cn, formatCurrency } from "@/lib/utils";
import { StorefrontImage } from "@/components/storefront/storefront-image";
import { DiscountSticker, ProductPrice } from "@/components/storefront/storefront-product-card";
import { ProductDescriptionContent } from "@/components/storefront/product-description-content";
import { ProductImageLightbox } from "@/components/storefront/product-image-lightbox";
import { ProductModel3D } from "@/components/storefront/product-model-3d";
import { PilotQuickQuantities } from "@/components/storefront/pilot-variant-grid";
import { CartQuantityInput } from "@/components/storefront/cart-quantity-input";
import { tierUnitPrice, volumeUnitPrice } from "@/lib/storefront/volume-pricing";

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
  onSetQuantity,
  onChooseVariants,
  onAddVariants,
  variantCartQuantities = {},
  subdomain = null,
  onOpenCart,
  quickQuantities,
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
  /** Sepetteki adedi doğrudan yazılan sayıya çeker (0 = sepetten çıkar). */
  onSetQuantity: (quantity: number) => void;
  onChooseVariants: () => void;
  /** Bedenler/modeller sayfada (28 Eyl 2026): seçilenleri sepete ekler; hata metni ya da null. */
  onAddVariants?: (selections: Array<{ variantId: string; quantity: number }>) => Promise<string | null>;
  /** variant_id → sepetteki adet */
  variantCartQuantities?: Record<string, number>;
  /** Renkler için (Moda vitrinlerinde /api/storefront/product-colors). */
  subdomain?: string | null;
  onOpenCart: () => void;
  /** Pilot mağazalarda Adet kutusunun altındaki hızlı adet düğmeleri (lib/storefront/pilot.ts). */
  quickQuantities?: readonly number[];
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const images = useMemo(
    () => [product.image_url, product.image_url_2, product.image_url_3].filter((url): url is string => Boolean(url)),
    [product.image_url, product.image_url_2, product.image_url_3],
  );
  const [imageIndex, setImageIndex] = useState(0);
  // 3D kare (1 Eki 2026): model_3d_url dolu ürünlerde görsellerden sonra
  // döndürülebilir model. Kare ilk açıldığında yüklenir, sonra açık kalır.
  const model3dUrl = product.model_3d_url ?? null;
  const modelIndex = images.length;
  const slideCount = images.length + (model3dUrl ? 1 : 0);
  const [modelOpened, setModelOpened] = useState(false);
  // Galeri kaydırılabilir şerit (28 Eyl 2026, tüm tenantlar): mobilde
  // parmakla kaydırma, scroll-snap ile her görsel tam oturur; küçük
  // resimler ve noktalar şeritle eşlenir.
  const trackRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  function goToImage(index: number) {
    setImageIndex(index);
    if (model3dUrl && index === modelIndex) setModelOpened(true);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }
  // Kademeli fiyatta adet satılmıyorsa en küçük birim (paket/koli) seçili açılır.
  const startUnit =
    product.volume_pricing?.adet === false ? (product.package_quantity ? "paket" : "koli") : "adet";
  const [pieces, setPieces] = useState(startUnit === "adet" ? "1" : "");
  const [packages, setPackages] = useState(startUnit === "paket" ? "1" : "");
  const [cartons, setCartons] = useState(startUnit === "koli" ? "1" : "");
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

  // 1 adetlik paket/koli anlamsız ("1 Koli = 1 adet", qoop 28 Eyl 2026): girilmemiş sayılır.
  const packageQty = !isMarketTenant && (product.package_quantity ?? 0) > 1 ? product.package_quantity! : null;
  const cartonQty = !isMarketTenant && (product.carton_quantity ?? 0) > 1 ? product.carton_quantity! : null;
  const total =
    parseCount(pieces) + parseCount(packages) * (packageQty ?? 0) + parseCount(cartons) * (cartonQty ?? 0);
  const unitPrice = typeof product.price === "number" ? product.price : null;
  const inCart = cartQuantity > 0;
  const hasVariants = product.has_variants;
  // Sayfa içi beden seçimi (Moda vitrini): sepete ekle bedenlerin altında,
  // sayfayla birlikte kayar; mobilde altta sabit çubuk yok (28 Eyl 2026).
  const inlineVariantMode = hasVariants && Boolean(onAddVariants);
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

  // Kademeli fiyat (toptantr düzeni, 0142): toplam adede göre adet fiyatı.
  const volumePricing = product.volume_pricing ?? null;
  const effectiveUnitPrice =
    volumeUnitPrice({
      base: unitPrice,
      volumePricing,
      packageQuantity: packageQty,
      cartonQuantity: cartonQty,
      units: total,
    }) ?? unitPrice;
  const addLabel = unitPrice !== null && total > 0
    ? `${total} adet · ${formatCurrency((effectiveUnitPrice ?? unitPrice) * total, product.currency)}`
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
          {/* Sepete git düğmesi yok (28 Eyl 2026, kullanıcı): sepet üst bardan açılır. */}
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
                <CartQuantityInput
                  value={cartQuantity}
                  onCommit={onSetQuantity}
                  ariaLabel="Sepetteki adet"
                  className={cn(
                    "h-full w-14 bg-transparent text-center font-bold tabular-nums outline-none focus:rounded-lg focus:bg-white/20",
                    flash && "animate-[ek-pop_0.45s_ease-out]",
                  )}
                />
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
    <div data-commerce="detail" className={inlineVariantMode ? "pb-4" : "pb-28 lg:pb-4"}>
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

      <div data-commerce-slot="detail-grid" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* Galeri */}
        <div data-commerce-slot="detail-gallery" className={cn("rounded-3xl border p-4 sm:p-6", theme.surface, theme.border)}>
          <div className="relative mx-auto w-full max-w-[520px]">
            {slideCount ? (
              <div
                ref={trackRef}
                onScroll={(event) => {
                  const track = event.currentTarget;
                  if (!track.clientWidth) return;
                  const index = Math.round(track.scrollLeft / track.clientWidth);
                  if (index !== imageIndex) setImageIndex(index);
                  if (model3dUrl && index === modelIndex) setModelOpened(true);
                }}
                className="scrollbar-hide flex aspect-square w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl"
                style={{ scrollbarWidth: "none", touchAction: "pan-x pan-y" }}
              >
                {images.map((src, index) => (
                  <div
                    key={src}
                    role="button"
                    tabIndex={0}
                    aria-label="Görseli tam ekran aç"
                    onClick={() => setLightboxIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setLightboxIndex(index);
                      }
                    }}
                    className="relative h-full w-full shrink-0 cursor-zoom-in snap-center snap-always"
                  >
                    <StorefrontImage
                      src={src}
                      alt={index === 0 ? product.product_name : `${product.product_name} ${index + 1}`}
                      className="object-contain"
                      sizes={STOREFRONT_MODAL_PRODUCT_SIZES}
                      priority={index === 0}
                    />
                  </div>
                ))}
                {model3dUrl ? (
                  <div className="relative h-full w-full shrink-0 snap-center snap-always">
                    {modelOpened || !images.length ? (
                      <ProductModel3D src={model3dUrl} label={`${product.product_name} 3D model`} />
                    ) : null}
                    <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white">
                      3D · sürükleyip döndür
                    </span>
                    {images.length ? (
                      <button
                        type="button"
                        onClick={() => goToImage(modelIndex - 1)}
                        aria-label="Görsellere dön"
                        className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-black/65 text-white"
                      >
                        <ArrowLeft className="size-4" />
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className={cn("flex aspect-square items-center justify-center rounded-2xl", theme.emptyImage)} />
            )}
            <DiscountSticker product={product} />
            {lightboxIndex !== null ? (
              <ProductImageLightbox
                images={images}
                startIndex={lightboxIndex}
                alt={product.product_name}
                onClose={(last) => {
                  setLightboxIndex(null);
                  goToImage(last);
                }}
              />
            ) : null}
            {slideCount > 1 ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5 sm:hidden">
                {images.map((src, index) => (
                  <span
                    key={src}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === imageIndex ? "w-4 bg-black/70" : "w-1.5 bg-black/25",
                    )}
                  />
                ))}
                {model3dUrl ? (
                  <span
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      imageIndex === modelIndex ? "w-4 bg-black/70" : "w-1.5 bg-black/25",
                    )}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
          {slideCount > 1 ? (
            <div className="mt-4 flex gap-2.5">
              {images.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => goToImage(index)}
                  className={cn(
                    "relative size-16 overflow-hidden rounded-xl border-2 sm:size-20",
                    index === imageIndex ? "border-[var(--ek-add-to-cart,#10b981)]" : cn("border-transparent", theme.border),
                  )}
                  aria-label={`${index + 1}. görsel`}
                >
                  <StorefrontImage src={src} alt="" className="object-contain" sizes="80px" />
                </button>
              ))}
              {model3dUrl ? (
                <button
                  type="button"
                  onClick={() => goToImage(modelIndex)}
                  className={cn(
                    "relative flex size-16 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border-2 text-[11px] font-bold sm:size-20",
                    imageIndex === modelIndex ? "border-[var(--ek-add-to-cart,#10b981)]" : cn("border-transparent", theme.border),
                  )}
                  aria-label="3D görünüm"
                >
                  <Box className="size-5" />
                  3D
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Bilgi + sepete ekle */}
        <div data-commerce-slot="detail-info" className={cn("rounded-3xl border p-5 sm:p-7", theme.surface, theme.border)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {product.sku_code ? (
                <span className={cn("rounded-lg px-2.5 py-1 text-xs font-bold", theme.stockBadgeIn)}>{product.sku_code.toUpperCase()}</span>
              ) : null}
              {product.is_in_stock ? (
                <span className={cn(theme.stockBadgeIn, "px-2.5 py-1 text-xs")}>
                  ● {product.stock_quantity != null && !hasVariants ? `Stok: ${product.stock_quantity} adet` : "Stokta"}
                </span>
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

          {product.brand?.trim() ? (
            // Marka (0161): adın üstünde küçük, büyük harf etiket.
            <p className={cn("-mb-2 mt-3 text-[11px] font-bold uppercase tracking-[0.16em]", theme.textMuted)}>
              {product.brand}
            </p>
          ) : null}
          <h1 className={cn("mt-3 text-xl font-extrabold leading-tight sm:text-2xl lg:text-[28px]", theme.text)}>
            {product.product_name}
          </h1>

          <div data-commerce-slot="detail-price" className="mt-2 flex items-baseline gap-2">
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
            <div data-commerce-slot="detail-variants" className="mt-5">
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

          {volumePricing && unitPrice !== null && product.is_in_stock && !hasVariants && !inCart ? (
            <div className="mt-5">
              <p className={cn("mb-2.5 text-sm font-bold", theme.text)}>Satın alma miktarını seçin</p>
              {(() => {
                const tiers = [
                  volumePricing.adet === false
                    ? null
                    : { key: "adet" as const, label: "Adet", qty: 1, unit: unitPrice, value: pieces, set: setPieces },
                  packageQty
                    ? { key: "paket" as const, label: "Paket", qty: packageQty, unit: tierUnitPrice(unitPrice, volumePricing.package), value: packages, set: setPackages }
                    : null,
                  cartonQty
                    ? { key: "koli" as const, label: "Koli", qty: cartonQty, unit: tierUnitPrice(unitPrice, volumePricing.carton), value: cartons, set: setCartons }
                    : null,
                ].filter(Boolean) as Array<{ key: "adet" | "paket" | "koli"; label: string; qty: number; unit: number; value: string; set: (v: string) => void }>;
                const best = tiers.reduce((min, tier) => (tier.unit < min.unit ? tier : min), tiers[0]);
                return (
                  <div className={cn("grid gap-2.5", tiers.length === 3 ? "grid-cols-3" : tiers.length === 2 ? "grid-cols-2" : "grid-cols-1 max-w-[200px]")}>
                    {tiers.map((tier) => {
                      const count = parseCount(tier.value);
                      const saving = unitPrice > 0 ? Math.round((1 - tier.unit / unitPrice) * 100) : 0;
                      const isBest = tiers.length > 1 && tier.key === best.key && saving > 0;
                      return (
                        <div
                          key={tier.key}
                          className={cn(
                            "relative flex flex-col rounded-2xl border text-center",
                            count > 0 ? "border-[var(--ek-add-to-cart,#f59e0b)] ring-1 ring-[var(--ek-add-to-cart,#f59e0b)]" : theme.border,
                          )}
                        >
                          {isBest ? (
                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              En Avantajlı
                            </span>
                          ) : null}
                          <p className={cn("border-b px-1 py-2 text-xs font-bold sm:text-sm", theme.border, theme.text)}>
                            {tier.label} <span className={cn("font-normal", theme.textMuted)}>x({tier.qty} adet)</span>
                          </p>
                          <div className="flex flex-1 flex-col items-center justify-center px-1 py-2.5">
                            <p className={cn("text-base font-extrabold tabular-nums sm:text-xl", isBest ? "text-emerald-600" : theme.text)}>
                              {formatCurrency(tier.unit, product.currency)}
                            </p>
                            <p className={cn("text-[11px] sm:text-xs", theme.textMuted)}>/adet</p>
                            {tier.qty > 1 ? (
                              <p className={cn("mt-1.5 text-[11px] tabular-nums sm:text-xs", theme.textMuted)}>
                                {tier.label}: {formatCurrency(tier.unit * tier.qty, product.currency)}
                              </p>
                            ) : null}
                            {saving > 0 ? (
                              <p className="mt-0.5 text-[10px] font-semibold text-emerald-700 sm:text-[11px]">adet fiyatına göre %{saving}</p>
                            ) : null}
                          </div>
                          <div className={cn("flex items-center justify-between border-t", theme.border)}>
                            <button
                              type="button"
                              onClick={() => tier.set(String(Math.max(0, count - 1)))}
                              className={cn("flex h-10 w-9 items-center justify-center", theme.text)}
                              aria-label={`${tier.label} azalt`}
                            >
                              <Minus className="size-4" />
                            </button>
                            <span className={cn("text-sm font-bold tabular-nums", count ? theme.text : theme.textMuted)}>
                              {count || "Seç"}
                            </span>
                            <button
                              type="button"
                              onClick={() => tier.set(String(count + 1))}
                              className={cn("flex h-10 w-9 items-center justify-center", theme.text)}
                              aria-label={`${tier.label} artır`}
                            >
                              <Plus className="size-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              {total > 0 && effectiveUnitPrice !== null && effectiveUnitPrice < unitPrice ? (
                <p className={cn("mt-2 text-xs", theme.textMuted)}>
                  {total} adet için adet fiyatı {formatCurrency(effectiveUnitPrice, product.currency)}
                </p>
              ) : null}
            </div>
          ) : null}

          {!volumePricing && product.is_in_stock && !hasVariants && !inCart ? (
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
              {quickQuantities ? (
                <div className="mt-2.5 max-w-[380px]">
                  <PilotQuickQuantities values={quickQuantities} current={pieces} onPick={(value) => setPieces(String(value))} />
                </div>
              ) : null}
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

          <div data-commerce-slot="detail-action" className={cn("mt-6", inlineVariantMode ? "block" : "hidden lg:block")}>{actionArea(false)}</div>
        </div>
      </div>

      <div data-commerce-slot="detail-description" className={cn("mt-5 rounded-3xl border p-5 sm:p-7", theme.surface, theme.border)}>
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

      {/* Mobil: altta sabit sepete ekle (sayfa içi beden seçiminde yok) */}
      {inlineVariantMode ? null : (
        <div data-commerce-slot="detail-mobile-action" className={cn("fixed inset-x-0 bottom-0 z-40 border-t px-3.5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 lg:hidden", theme.surface, theme.border)}>
          {actionArea(true)}
        </div>
      )}
    </div>
  );
}
