import { Menu, Search, ShoppingCart, Store } from "lucide-react";
import type {
  StorefrontFooterStyleKey,
  StorefrontHeaderStyleKey,
  StorefrontHeroStyleKey,
  StorefrontLayoutKey,
  StorefrontThemeKey,
} from "@/lib/types";
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

function ShowcaseLogo({
  theme,
  logoUrl,
  size,
}: {
  theme: ReturnType<typeof getStorefrontTheme>;
  logoUrl?: string | null;
  size: "desktop" | "mobile";
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border",
        theme.logoWrap,
        size === "desktop" ? "size-9" : "size-7",
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="size-full object-contain p-1" />
      ) : (
        <Store className={cn(size === "desktop" ? "size-4" : "size-3.5", theme.logoPlaceholder)} />
      )}
    </div>
  );
}

function ShowcaseSearchField({
  theme,
  className,
}: {
  theme: ReturnType<typeof getStorefrontTheme>;
  className?: string;
}) {
  return (
    <div className={cn("relative h-9 rounded-full border", theme.searchWrap, className)}>
      <Search className={cn(theme.searchIcon, "left-3 size-3.5")} />
      <span className={cn("block h-9 truncate pl-9 pr-3 pt-2.5 text-[11px]", theme.textMuted)}>
        Ürün, model no veya kategori ara...
      </span>
    </div>
  );
}

function ShowcaseCartButton({
  theme,
  size,
}: {
  theme: ReturnType<typeof getStorefrontTheme>;
  size: "desktop" | "mobile";
}) {
  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          size === "desktop" ? "size-9" : "size-7",
          theme.cartButton,
        )}
      >
        <ShoppingCart className={size === "desktop" ? "size-4" : "size-3.5"} />
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
  );
}

function ShowcaseHeader({
  theme,
  title,
  logoUrl,
  variant,
  headerStyleKey,
}: {
  theme: ReturnType<typeof getStorefrontTheme>;
  title: string;
  logoUrl?: string | null;
  variant: "desktop" | "mobile";
  headerStyleKey: StorefrontHeaderStyleKey;
}) {
  if (variant === "desktop" && headerStyleKey === "centered") {
    return (
      <div className={cn("border-b", theme.headerBorder, theme.surface, "space-y-2 px-5 py-3")}>
        <div className="flex items-center justify-center gap-2">
          <ShowcaseLogo theme={theme} logoUrl={logoUrl} size="desktop" />
          <p className={cn("truncate text-sm font-semibold", theme.headerTitle)}>{title}</p>
        </div>
        <ShowcaseSearchField theme={theme} className="mx-auto max-w-xs" />
      </div>
    );
  }

  if (variant === "desktop" && headerStyleKey === "split") {
    return (
      <div className={cn("border-b", theme.headerBorder, theme.surface, "flex items-center gap-3 px-5 py-3")}>
        <ShowcaseLogo theme={theme} logoUrl={logoUrl} size="desktop" />
        <p className={cn("shrink-0 truncate text-sm font-semibold", theme.headerTitle)}>{title}</p>
        <ShowcaseSearchField theme={theme} className="flex-1" />
        <ShowcaseCartButton theme={theme} size="desktop" />
      </div>
    );
  }

  if (variant === "desktop" && headerStyleKey === "minimal") {
    return (
      <div className={cn("border-b", theme.headerBorder, theme.surface, "space-y-2 px-5 py-2.5")}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShowcaseLogo theme={theme} logoUrl={logoUrl} size="desktop" />
            <p className={cn("truncate text-sm font-semibold", theme.headerTitle)}>{title}</p>
          </div>
          <ShowcaseCartButton theme={theme} size="desktop" />
        </div>
        <ShowcaseSearchField theme={theme} className="w-full" />
      </div>
    );
  }

  return (
    <div className={cn("border-b", theme.headerBorder, theme.surface)}>
      <div className={cn("flex items-center gap-3", variant === "desktop" ? "px-5 py-3" : "px-3 py-2.5")}>
        {variant === "mobile" ? <Menu className={cn("size-4 shrink-0", theme.textMuted)} /> : null}
        <ShowcaseLogo theme={theme} logoUrl={logoUrl} size={variant} />
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
          <ShowcaseSearchField theme={theme} className="ml-4 flex-1" />
        ) : (
          <div className="flex-1" />
        )}

        <ShowcaseCartButton theme={theme} size={variant} />
      </div>

      {variant === "mobile" ? (
        <div className="px-3 pb-2.5">
          <ShowcaseSearchField theme={theme} className="h-8" />
        </div>
      ) : null}
    </div>
  );
}

function ShowcaseHero({
  theme,
  heroStyleKey,
  variant,
}: {
  theme: ReturnType<typeof getStorefrontTheme>;
  heroStyleKey: StorefrontHeroStyleKey;
  variant: "desktop" | "mobile";
}) {
  if (heroStyleKey === "text") {
    return null;
  }

  if (heroStyleKey === "full-bleed") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 to-slate-900",
          variant === "desktop" ? "mb-3 h-24" : "mb-2 h-16",
        )}
      >
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative flex h-full flex-col justify-end p-3">
          <div className="h-2 w-20 rounded-full bg-white/90" />
          <div className="mt-1.5 h-4 w-28 rounded-full bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-3 grid overflow-hidden rounded-xl border",
        theme.border,
        theme.surface,
        variant === "desktop" ? "grid-cols-2" : "grid-cols-2",
      )}
    >
      <div className={cn("flex flex-col justify-center gap-1.5 p-3")}>
        <div className={cn("h-2 w-16 rounded-full", theme.textMuted, "bg-current opacity-40")} />
        <div className={cn("h-3 w-20 rounded-full", theme.text, "bg-current opacity-70")} />
      </div>
      <div className="bg-gradient-to-br from-slate-300 to-slate-500" />
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

function ShowcaseFooter({
  theme,
  footerStyleKey,
  variant,
}: {
  theme: ReturnType<typeof getStorefrontTheme>;
  footerStyleKey: StorefrontFooterStyleKey;
  variant: "desktop" | "mobile";
}) {
  if (footerStyleKey === "minimal" || variant === "mobile") {
    return (
      <div className={cn("mt-4 border-t px-4 py-3 text-center", theme.sectionDivider)}>
        <p className={cn("text-[9px]", theme.footerText)}>© eKatalox mağazası</p>
      </div>
    );
  }

  const columnCount = footerStyleKey === "columns" ? 3 : 2;

  return (
    <div className={cn("mt-4 border-t px-5 py-4", theme.sectionDivider)}>
      <div className={cn("grid gap-3", columnCount === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {Array.from({ length: columnCount }).map((_, index) => (
          <div key={index} className="space-y-1.5">
            <div className={cn("h-1.5 w-10 rounded-full", theme.footerHeading, "bg-current opacity-60")} />
            <div className={cn("h-1.5 w-14 rounded-full", theme.footerText, "bg-current opacity-30")} />
            <div className={cn("h-1.5 w-12 rounded-full", theme.footerText, "bg-current opacity-30")} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ShowcaseBody({
  theme,
  layout,
  variant,
  heroStyleKey,
}: {
  theme: ReturnType<typeof getStorefrontTheme>;
  layout: ReturnType<typeof getStorefrontLayout>;
  variant: "desktop" | "mobile";
  heroStyleKey: StorefrontHeroStyleKey;
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
      <ShowcaseHero theme={theme} heroStyleKey={heroStyleKey} variant={variant} />

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
      <div className="max-h-[560px] overflow-y-auto">{children}</div>
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
        <div className="max-h-[600px] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function StorefrontThemeShowcase({
  themeKey,
  layoutKey = "classic-grid",
  headerStyleKey = "standard",
  footerStyleKey = "standard",
  heroStyleKey = "text",
  storefrontTitle,
  logoUrl,
  brandPrimaryColor,
  brandAccentColor,
}: {
  themeKey: StorefrontThemeKey;
  layoutKey?: StorefrontLayoutKey;
  headerStyleKey?: StorefrontHeaderStyleKey;
  footerStyleKey?: StorefrontFooterStyleKey;
  heroStyleKey?: StorefrontHeroStyleKey;
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
            <ShowcaseHeader
              theme={theme}
              title={title}
              logoUrl={logoUrl}
              variant="desktop"
              headerStyleKey={headerStyleKey}
            />
            <ShowcaseBody theme={theme} layout={layout} variant="desktop" heroStyleKey={heroStyleKey} />
            <ShowcaseFooter theme={theme} footerStyleKey={footerStyleKey} variant="desktop" />
          </div>
        </DesktopFrame>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Mobil
        </p>
        <MobileFrame>
          <div className={theme.page}>
            <ShowcaseHeader
              theme={theme}
              title={title}
              logoUrl={logoUrl}
              variant="mobile"
              headerStyleKey={headerStyleKey}
            />
            <ShowcaseBody theme={theme} layout={layout} variant="mobile" heroStyleKey={heroStyleKey} />
            <ShowcaseFooter theme={theme} footerStyleKey={footerStyleKey} variant="mobile" />
          </div>
        </MobileFrame>
      </div>
    </div>
  );
}
