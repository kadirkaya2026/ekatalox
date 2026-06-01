import { Search, ShoppingCart, Store } from "lucide-react";
import type { StorefrontLayoutKey, StorefrontThemeKey } from "@/lib/types";
import { getStorefrontLayout } from "@/lib/storefront/layouts";
import { getStorefrontTheme } from "@/lib/storefront/themes";
import { cn, formatCurrency } from "@/lib/utils";

function PreviewGridCards({
  theme,
}: {
  theme: ReturnType<typeof getStorefrontTheme>;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {[1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            "overflow-hidden rounded-lg border",
            theme.productCard,
            "rounded-lg shadow-none hover:translate-y-0 hover:shadow-none",
          )}
        >
          <div className={cn(theme.productImageWrap, "aspect-[4/3]")}>
            <div className="flex h-full items-center justify-center">
              <Store className={cn("size-4", theme.logoPlaceholder)} />
            </div>
          </div>
          <div className="space-y-0.5 p-1.5">
            <p className={cn("text-[10px] font-extrabold", theme.productPrice)}>
              {formatCurrency(index === 1 ? 1299 : 899, "TRY")}
            </p>
            <p className={cn("line-clamp-1 text-[8px] font-semibold", theme.productTitle)}>
              Örnek Ürün {index}
            </p>
            <span
              className={cn(
                "inline-flex rounded-full px-1.5 py-0.5 text-[7px] font-semibold",
                theme.stockBadgeIn,
              )}
            >
              Stokta
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PreviewListRows({
  theme,
}: {
  theme: ReturnType<typeof getStorefrontTheme>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {[1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border p-1.5",
            theme.border,
            theme.surface,
          )}
        >
          <div
            className={cn(
              "size-8 shrink-0 overflow-hidden rounded-md border",
              theme.border,
              theme.productImageWrap,
            )}
          >
            <div className="flex h-full items-center justify-center">
              <Store className={cn("size-3", theme.logoPlaceholder)} />
            </div>
          </div>
          <div className="min-w-0">
            <p className={cn("truncate text-[8px] font-semibold", theme.productTitle)}>
              Örnek Ürün {index}
            </p>
            <p className={cn("text-[7px]", theme.productMeta)}>SKU-{1000 + index}</p>
          </div>
          <p className={cn("text-[9px] font-extrabold", theme.productPrice)}>
            {formatCurrency(index === 1 ? 1299 : 899, "TRY")}
          </p>
        </div>
      ))}
    </div>
  );
}

export function StorefrontThemePreview({
  themeKey,
  layoutKey = "classic-grid",
  storefrontTitle,
  logoUrl,
}: {
  themeKey: StorefrontThemeKey;
  layoutKey?: StorefrontLayoutKey;
  storefrontTitle?: string;
  logoUrl?: string | null;
}) {
  const theme = getStorefrontTheme(themeKey);
  const layout = getStorefrontLayout(layoutKey);
  const title = storefrontTitle?.trim() || "Mağaza Adı";

  return (
    <div
      className={cn(
        "pointer-events-none overflow-hidden rounded-xl border",
        theme.border,
        theme.surface,
      )}
      aria-hidden="true"
    >
      <div className={cn("border-b px-3 py-2", theme.headerBorder, theme.surface)}>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border",
              theme.logoWrap,
              "h-7 w-7 rounded-lg shadow-none",
            )}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="size-full object-contain p-0.5" />
            ) : (
              <Store className={cn("size-3.5", theme.logoPlaceholder)} />
            )}
          </div>
          <p className={cn("truncate text-[11px] font-semibold", theme.headerTitle)}>
            {title}
          </p>
        </div>
      </div>

      <div className="space-y-2 p-2.5">
        <div className={cn("relative h-7 rounded-full border", theme.searchWrap, "shadow-none")}>
          <Search className={cn(theme.searchIcon, "left-2 size-3")} />
          <div className="h-7 rounded-full pl-7 pr-2">
            <span className={cn("block pt-1.5 text-[9px]", theme.textMuted)}>Ara...</span>
          </div>
        </div>

        <div className="flex gap-1.5">
          <span
            className={cn(
              "rounded-full px-2 py-1 text-[9px] font-semibold",
              theme.categoryNavChip(true),
            )}
          >
            Tümü
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-1 text-[9px] font-semibold",
              theme.categoryNavChip(false),
            )}
          >
            Kategori
          </span>
        </div>

        {layout.productView === "list-row" ? (
          <PreviewListRows theme={theme} />
        ) : layout.key === "catalog-dense" ? (
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className={cn(
                  "overflow-hidden rounded-md border",
                  theme.productCard,
                  "rounded-md shadow-none hover:translate-y-0 hover:shadow-none",
                )}
              >
                <div className={cn(theme.productImageWrap, "aspect-square")}>
                  <div className="flex h-full items-center justify-center">
                    <Store className={cn("size-3", theme.logoPlaceholder)} />
                  </div>
                </div>
                <p className={cn("p-1 text-[8px] font-extrabold", theme.productPrice)}>
                  {formatCurrency(899, "TRY")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <PreviewGridCards theme={theme} />
        )}

        <div
          className={cn(
            "flex items-center justify-between rounded-lg px-2 py-1.5",
            theme.stickyCart,
            "static inset-auto max-w-none shadow-none",
          )}
        >
          <span className={cn("text-[9px]", theme.stickyCartText)}>2 ürün</span>
          <div className="flex items-center gap-1">
            <ShoppingCart className="size-3 text-white/80" />
            <span className={cn("rounded-md px-2 py-0.5 text-[9px] font-bold", theme.stickyCartButton)}>
              Sepet
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
