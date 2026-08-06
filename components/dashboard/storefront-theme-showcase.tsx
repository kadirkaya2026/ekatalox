import { Menu, Search, ShoppingCart, Store } from "lucide-react";
import type { StorefrontLayoutKey, StorefrontThemeKey } from "@/lib/types";
import { applyBrandColorOverrides } from "@/lib/storefront/brand-colors";
import { getStorefrontLayout } from "@/lib/storefront/layouts";
import { getStorefrontTheme } from "@/lib/storefront/themes";
import { cn, formatCurrency } from "@/lib/utils";

const SHOWCASE_PRODUCTS = [
  { name: "Kablosuz Kulaklık", price: 1299, inStock: true },
  { name: "Akıllı Saat", price: 2490, inStock: true },
  { name: "Bluetooth Hoparlör", price: 899, inStock: true },
  { name: "Şarj Kablosu", price: 149, inStock: false },
];

function ShowcaseProductCard({
  theme,
  product,
  dense,
}: {
  theme: ReturnType<typeof getStorefrontTheme>;
  product: (typeof SHOWCASE_PRODUCTS)[number];
  dense?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border shadow-none",
        theme.productCard,
        "hover:translate-y-0 hover:shadow-none",
      )}
    >
      <div className={cn(theme.productImageWrap, "relative aspect-square")}>
        <div className="flex h-full items-center justify-center">
          <Store className={cn(dense ? "size-5" : "size-7", theme.logoPlaceholder)} />
        </div>
      </div>
      <div className={cn("space-y-1", dense ? "p-2" : "p-2.5")}>
        <p className={cn("font-extrabold", dense ? "text-[11px]" : "text-sm", theme.productPrice)}>
          {formatCurrency(product.price, "TRY")}
        </p>
        <p
          className={cn(
            "line-clamp-1 font-semibold",
            dense ? "text-[9px]" : "text-[11px]",
            theme.productTitle,
          )}
        >
          {product.name}
        </p>
        <span
          className={cn(
            "inline-flex rounded-full font-semibold",
            dense ? "px-1.5 py-0.5 text-[7px]" : "px-2 py-0.5 text-[8px]",
            product.inStock ? theme.stockBadgeIn : theme.stockBadgeOut,
          )}
        >
          {product.inStock ? "Stokta" : "Tükendi"}
        </span>
      </div>
    </div>
  );
}

function ShowcaseCategoryChips({ theme }: { theme: ReturnType<typeof getStorefrontTheme> }) {
  const categories = ["Tümü", "Elektronik", "Aksesuar", "Kampanya"];
  return (
    <div className="scrollbar-hide flex gap-1.5 overflow-x-auto">
      {categories.map((label, index) => (
        <span
          key={label}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold",
            theme.categoryNavChip(index === 0),
          )}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function ShowcaseSidebar({ theme }: { theme: ReturnType<typeof getStorefrontTheme> }) {
  return (
    <div className={cn(theme.categorySidebar, "hidden shrink-0 rounded-xl p-2.5 shadow-none sm:block sm:w-32")}>
      <p className={cn(theme.categorySidebarTitle, "text-[9px]")}>Kategoriler</p>
      <div className="mt-1.5 space-y-1">
        <div className={cn(theme.categorySidebarItem(true), "px-2 py-1.5 text-[10px]")}>Tümü</div>
        <div className={cn(theme.categorySidebarItem(false), "px-2 py-1.5 text-[10px]")}>
          Elektronik
        </div>
        <div className={cn(theme.categorySidebarChildItem(false), "py-1 pl-4 pr-2 text-[9px]")}>
          Kablolar
        </div>
        <div className={cn(theme.categorySidebarItem(false), "px-2 py-1.5 text-[10px]")}>
          Aksesuar
        </div>
      </div>
    </div>
  );
}

function ShowcaseHeader({
  theme,
  title,
  logoUrl,
  variant,
}: {
  theme: ReturnType<typeof getStorefrontTheme>;
  title: string;
  logoUrl?: string | null;
  variant: "desktop" | "mobile";
}) {
  return (
    <div className={cn("border-b", theme.headerBorder, theme.surface)}>
      <div className={cn("flex items-center gap-3", variant === "desktop" ? "px-5 py-3" : "px-3 py-2.5")}>
        {variant === "mobile" ? <Menu className={cn("size-4 shrink-0", theme.textMuted)} /> : null}
        <div
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border",
            theme.logoWrap,
            variant === "desktop" ? "size-9" : "size-7",
          )}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="size-full object-contain p-1" />
          ) : (
            <Store className={cn(variant === "desktop" ? "size-4" : "size-3.5", theme.logoPlaceholder)} />
          )}
        </div>
        <p
          className={cn(
            "truncate font-semibold",
            variant === "desktop" ? "text-sm" : "text-[12px]",
            theme.headerTitle,
          )}
        >
          {title}
        </p>

        {variant === "desktop" ? (
          <div className={cn("relative ml-4 h-9 flex-1 rounded-full border", theme.searchWrap)}>
            <Search className={cn(theme.searchIcon, "left-3 size-3.5")} />
            <span className={cn("block h-9 truncate pl-9 pr-3 pt-2.5 text-[11px]", theme.textMuted)}>
              Ürün, model no veya kategori ara...
            </span>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="relative shrink-0">
          <div
            className={cn(
              "flex items-center justify-center rounded-full",
              variant === "desktop" ? "size-9" : "size-7",
              theme.cartButton,
            )}
          >
            <ShoppingCart className={variant === "desktop" ? "size-4" : "size-3.5"} />
          </div>
          <span
            className={cn(
              "absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full text-[8px] font-bold",
              theme.cartBadge,
            )}
          >
            2
          </span>
        </div>
      </div>

      {variant === "mobile" ? (
        <div className="px-3 pb-2.5">
          <div className={cn("relative h-8 rounded-full border", theme.searchWrap)}>
            <Search className={cn(theme.searchIcon, "left-2.5 size-3")} />
            <span className={cn("block h-8 truncate pl-8 pr-3 pt-2 text-[10px]", theme.textMuted)}>
              Ara...
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ShowcaseStickyCart({
  theme,
  variant,
}: {
  theme: ReturnType<typeof getStorefrontTheme>;
  variant: "desktop" | "mobile";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl",
        variant === "desktop" ? "px-4 py-3" : "px-3 py-2.5",
        theme.stickyCart,
        "static inset-auto max-w-none shadow-none",
      )}
    >
      <span className={cn(variant === "desktop" ? "text-xs" : "text-[10px]", theme.stickyCartText)}>
        2 ürün · Toplam
      </span>
      <span
        className={cn(
          "rounded-lg font-bold text-white",
          variant === "desktop" ? "px-4 py-1.5 text-xs" : "px-3 py-1 text-[10px]",
          theme.stickyCartButton,
        )}
      >
        Sepeti Görüntüle
      </span>
    </div>
  );
}

function ShowcaseBody({
  theme,
  layout,
  variant,
}: {
  theme: ReturnType<typeof getStorefrontTheme>;
  layout: ReturnType<typeof getStorefrontLayout>;
  variant: "desktop" | "mobile";
}) {
  const showSidebar = variant === "desktop" && layout.categoryNav === "sidebar";
  const gridCols =
    variant === "desktop"
      ? showSidebar
        ? "grid grid-cols-3 gap-2.5"
        : "grid grid-cols-4 gap-2.5"
      : "grid grid-cols-2 gap-2";
  const products =
    variant === "desktop" && !showSidebar
      ? [...SHOWCASE_PRODUCTS, ...SHOWCASE_PRODUCTS].slice(0, 8)
      : SHOWCASE_PRODUCTS;

  const grid = (
    <div className={gridCols}>
      {products.map((product, index) => (
        <ShowcaseProductCard
          key={`${product.name}-${index}`}
          theme={theme}
          product={product}
          dense={variant === "mobile"}
        />
      ))}
    </div>
  );

  return (
    <div className={cn(variant === "desktop" ? "p-5" : "p-3")}>
      {!showSidebar ? (
        <div className="mb-3">
          <ShowcaseCategoryChips theme={theme} />
        </div>
      ) : null}

      {showSidebar ? (
        <div className="flex gap-3">
          <ShowcaseSidebar theme={theme} />
          <div className="min-w-0 flex-1">{grid}</div>
        </div>
      ) : (
        grid
      )}

      <div className="mt-4">
        <ShowcaseStickyCart theme={theme} variant={variant} />
      </div>
    </div>
  );
}

function DesktopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-2">
        <span className="size-2.5 rounded-full bg-slate-300" />
        <span className="size-2.5 rounded-full bg-slate-300" />
        <span className="size-2.5 rounded-full bg-slate-300" />
      </div>
      <div className="max-h-[520px] overflow-y-auto">{children}</div>
    </div>
  );
}

function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[300px] overflow-hidden rounded-[2rem] border-[6px] border-slate-900 bg-slate-900 shadow-sm">
      <div className="relative overflow-hidden rounded-[1.4rem] bg-white">
        <div className="flex justify-center bg-slate-900 pb-1 pt-1.5">
          <div className="h-4 w-24 rounded-full bg-slate-900" />
        </div>
        <div className="max-h-[560px] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function StorefrontThemeShowcase({
  themeKey,
  layoutKey = "classic-grid",
  storefrontTitle,
  logoUrl,
  brandPrimaryColor,
  brandAccentColor,
}: {
  themeKey: StorefrontThemeKey;
  layoutKey?: StorefrontLayoutKey;
  storefrontTitle?: string;
  logoUrl?: string | null;
  brandPrimaryColor?: string | null;
  brandAccentColor?: string | null;
}) {
  const theme = applyBrandColorOverrides(getStorefrontTheme(themeKey), {
    brand_primary_color: brandPrimaryColor ?? null,
    brand_accent_color: brandAccentColor ?? null,
  });
  const layout = getStorefrontLayout(layoutKey);
  const title = storefrontTitle?.trim() || "Mağaza Adı";

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr] xl:items-start">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Masaüstü
        </p>
        <DesktopFrame>
          <div className={theme.page}>
            <ShowcaseHeader theme={theme} title={title} logoUrl={logoUrl} variant="desktop" />
            <ShowcaseBody theme={theme} layout={layout} variant="desktop" />
          </div>
        </DesktopFrame>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Mobil
        </p>
        <MobileFrame>
          <div className={theme.page}>
            <ShowcaseHeader theme={theme} title={title} logoUrl={logoUrl} variant="mobile" />
            <ShowcaseBody theme={theme} layout={layout} variant="mobile" />
          </div>
        </MobileFrame>
      </div>
    </div>
  );
}
