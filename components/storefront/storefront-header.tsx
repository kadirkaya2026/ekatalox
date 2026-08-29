"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, PackageSearch, Search, ShoppingCart, Store, Ticket } from "lucide-react";
import type { CategoryNode } from "@/lib/categories/tree";
import { getDescendantCategoryIds } from "@/lib/categories/tree";
import type { Category } from "@/lib/types";
import { STOREFRONT_LOGO_SIZES } from "@/lib/storefront/image-sizes";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import type { StorefrontHeaderStyleKey, TenantStorefrontSettings } from "@/lib/types";
import { cn, formatCurrency, formatDateSlashTr } from "@/lib/utils";
import { StorefrontImage } from "@/components/storefront/storefront-image";
import { StorefrontLogoutButton } from "@/components/storefront/storefront-logout-button";
import { StorefrontThemeToggle } from "@/components/storefront/storefront-theme-toggle";
import { StorefrontLanguageSwitcher } from "@/components/storefront/storefront-language-switcher";
import { OrderTrackingBadge, useUnseenOrderUpdates } from "@/components/storefront/order-tracking-badge";

export interface StorefrontHeaderProps {
  headerStyleKey: StorefrontHeaderStyleKey;
  storefrontSettings: Pick<
    TenantStorefrontSettings,
    | "logo_url"
    | "storefront_title"
    | "is_price_update_date_visible"
    | "price_update_date"
    | "is_theme_toggle_visible"
    | "is_logout_button_visible"
  >;
  storefrontTitle: string;
  // Alkol/sigara bayii (tekel) tenant'larda "sepet" dili yerine "sipariş
  // listesi" dili kullanılır (kullanıcı isteği, 20 Ağu 2026).
  isTekel: boolean;
  tenantId: string;
  subdomain?: string;
  homeHref?: string;
  searchInput: string;
  onSearchChange: (value: string) => void;
  cartItemCount: number;
  cartTotalEntries: Array<{ currency: string; total: number }>;
  cartTotal: number;
  cartCurrency: string;
  cartLength: number;
  onOpenCart: () => void;
  usesSidebarNav: boolean;
  topCategories: CategoryNode[];
  categories: Category[];
  selectedCategoryId: string;
  selectedTopCategoryId: string;
  selectedCategoryLabel: string;
  mobileSubcategories: Array<{ id: string; name: string }>;
  mobileSubSubcategories: Array<{ id: string; name: string }>;
  hoveredCategoryId: string | null;
  onHoverCategory: (categoryId: string | null) => void;
  onCategoryChange: (categoryId: string) => void;
  onOpenCategoryDrawer: () => void;
  // Market/tekel vitrinlerinde MOBİLDE arama ve sepet alt navigasyon
  // barına taşındı (bkz. storefront-bottom-nav.tsx); başlıkta ikisi de
  // gösterilmiyor. Değer zaten mobil kontrolünden geçmiş halde geliyor —
  // masaüstünde her zaman false, yani eski düzen aynen korunuyor.
  hideSearchAndCart?: boolean;
  // Masaüstünde alt navigasyon barı yok (sm:hidden), o yüzden kampanya
  // paneline üst başlıktan erişiliyor. Kampanyası olmayan bayide boş
  // buton durmasın diye çağıran taraf kampanya varsa gönderiyor.
  onOpenCampaigns?: () => void;
  // Market/tekel vitrinlerinde dil seçicinin solunda "Sipariş Takip" ikonu:
  // müşteri telefon numarasıyla siparişlerini görür (/siparislerim).
  orderTrackingHref?: string;
}

function HeaderActions({
  props,
  compact = false,
}: {
  props: StorefrontHeaderProps;
  compact?: boolean;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const unseenOrderUpdates = useUnseenOrderUpdates(props.orderTrackingHref ? props.subdomain : undefined);

  return (
    <div className={cn("flex items-center justify-end gap-3", compact ? "gap-2" : "lg:gap-4")}>
      {props.subdomain && props.storefrontSettings.is_logout_button_visible !== false ? (
        <StorefrontLogoutButton
          subdomain={props.subdomain}
          tenantId={props.tenantId}
          className="hidden lg:inline-flex"
        />
      ) : null}
      {props.onOpenCampaigns ? (
        <button
          type="button"
          onClick={props.onOpenCampaigns}
          className={cn(theme.cartButton, "hidden sm:flex")}
          aria-label={t("campaignsSheet.headerButtonAria")}
          title={t("campaignsSheet.title")}
        >
          <Ticket className="size-5" />
        </button>
      ) : null}
      {props.orderTrackingHref ? (
        <a
          href={props.orderTrackingHref}
          className={cn(theme.headerIconButton, "relative size-11 lg:size-12")}
          aria-label={t("header.trackOrders")}
          title={t("header.trackOrders")}
        >
          <PackageSearch className="size-5" />
          <OrderTrackingBadge count={unseenOrderUpdates} />
        </a>
      ) : null}
      <StorefrontLanguageSwitcher />
      {props.storefrontSettings.is_theme_toggle_visible !== false ? (
        <StorefrontThemeToggle />
      ) : null}
      <div className="hidden text-right sm:block">
        <p className={cn("text-[10px] uppercase tracking-[0.22em]", theme.cartTotalLabel)}>
          {t(props.isTekel ? "header.cartTotalPickup" : "header.cartTotal")}
        </p>
        <div className="mt-1">
          {props.cartLength === 0 ? (
            <p className={theme.cartTotalEmpty}>
              {t(props.isTekel ? "header.cartEmptyPickup" : "header.cartEmpty")}
            </p>
          ) : props.cartTotalEntries.length ? (
            props.cartTotalEntries.map(({ currency, total }) => (
              <p key={currency} className={theme.cartTotalValue}>
                {currency}: {formatCurrency(total, currency)}
              </p>
            ))
          ) : (
            <p className={theme.cartTotalValue}>
              {formatCurrency(props.cartTotal, props.cartCurrency)}
            </p>
          )}
        </div>
      </div>
      {props.hideSearchAndCart ? null : (
      <button
        type="button"
        data-cart-target=""
        onClick={props.onOpenCart}
        className={theme.cartButton}
        aria-label={t(props.isTekel ? "header.openCartAriaPickup" : "header.openCartAria")}
      >
        <ShoppingCart className="size-5" />
        <AnimatePresence>
          {props.cartLength ? (
            <motion.span
              key={props.cartItemCount}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={theme.cartBadge}
            >
              {props.cartItemCount}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </button>
      )}
    </div>
  );
}

function HeaderSearch({
  props,
  className,
}: {
  props: StorefrontHeaderProps;
  className?: string;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();

  return (
    <div
      className={cn(
        theme.searchWrap,
        "h-10 min-w-0 max-w-none rounded-full shadow-none lg:h-11 lg:w-full lg:max-w-md",
        className,
      )}
    >
      <Search className={cn(theme.searchIcon, "left-4 size-4")} />
      <input
        placeholder={t("header.searchPlaceholder")}
        value={props.searchInput}
        onChange={(event) => props.onSearchChange(event.target.value)}
        className={cn(
          theme.searchInput,
          "h-10 w-full rounded-full border-0 bg-transparent py-2 pl-10 pr-4 text-[16px] lg:h-11",
        )}
      />
    </div>
  );
}

function HeaderBrand({
  props,
  centered = false,
  compact = false,
}: {
  props: StorefrontHeaderProps;
  centered?: boolean;
  compact?: boolean;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();

  return (
    <a
      href={props.homeHref ?? "#"}
      onClick={
        props.homeHref
          ? undefined
          : (event) => {
              event.preventDefault();
              props.onCategoryChange("all");
            }
      }
      className={cn(
        "flex min-w-0 items-center gap-3 sm:gap-4",
        centered && "mx-auto justify-center",
      )}
    >
      <div
        className={cn(
          theme.logoWrap,
          compact ? "h-12 w-12 sm:h-14 sm:w-14" : "h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20",
        )}
      >
        {props.storefrontSettings.logo_url ? (
          <StorefrontImage
            src={props.storefrontSettings.logo_url}
            alt={`${props.storefrontTitle} logo`}
            className="object-contain"
            sizes={STOREFRONT_LOGO_SIZES}
          />
        ) : (
          <Store className={cn("size-5", theme.logoPlaceholder)} />
        )}
      </div>
      <div className={cn("min-w-0", centered && "text-center")}>
        <h1
          className={cn(
            theme.headerTitle,
            compact ? "text-base sm:text-lg" : "text-lg sm:text-xl lg:text-[1.65rem]",
          )}
        >
          {props.storefrontTitle}
        </h1>
        {props.storefrontSettings.is_price_update_date_visible &&
        props.storefrontSettings.price_update_date ? (
          <p className={cn("mt-0.5 truncate text-[10px] leading-4 sm:text-[11px]", theme.headerMuted)}>
            {t("header.priceUpdateDate")}{" "}
            {formatDateSlashTr(props.storefrontSettings.price_update_date)}
          </p>
        ) : null}
      </div>
    </a>
  );
}

function StorefrontHeaderCategoryNav({ props }: { props: StorefrontHeaderProps }) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();

  return (
    <div className={cn(theme.categoryRailBorder, props.usesSidebarNav && "lg:hidden")}>
      <div className="container-shell">
        <nav
          className={cn(
            "relative hidden md:flex md:flex-wrap md:items-center md:justify-center md:py-3",
            theme.categoryNavGap,
            props.usesSidebarNav && "md:hidden",
          )}
          aria-label={t("header.mainCategoriesAria")}
        >
          {props.homeHref ? (
            <a href={props.homeHref} className={theme.categoryNavChip(false)}>
              {t("header.allProducts")}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => props.onCategoryChange("all")}
              className={theme.categoryNavChip(props.selectedCategoryId === "all")}
            >
              {t("header.allProducts")}
            </button>
          )}

          {props.topCategories.map((category) => {
            const isActive =
              props.selectedCategoryId === category.id ||
              getDescendantCategoryIds(props.categories, category.id).includes(
                props.selectedCategoryId,
              );
            const isOpen = props.hoveredCategoryId === category.id;

            return (
              <div
                key={category.id}
                className="relative shrink-0"
                onMouseEnter={() => props.onHoverCategory(category.id)}
                onMouseLeave={() => props.onHoverCategory(null)}
              >
                <button
                  type="button"
                  onClick={() => props.onCategoryChange(category.id)}
                  className={theme.categoryNavChip(isActive)}
                >
                  <span>{category.name}</span>
                  {category.children.length ? <ChevronDown className="size-4" /> : null}
                </button>

                {category.children.length && isOpen ? (
                  <div className="absolute left-0 top-full z-30 pt-1.5">
                    <div className={theme.categoryDropdown}>
                      <p className={theme.categoryDropdownHeader}>{category.name}</p>
                      {/* 10'dan fazla alt kategori varsa yeni sütun aşağı
                          değil sağa doğru eklensin diye sabit 10 satırlık
                          grid — az sayıda alt kategoride tek sütun gibi
                          davranır. */}
                      <div className="grid grid-flow-col grid-rows-[repeat(10,minmax(0,auto))] gap-x-1 gap-y-0.5">
                        {category.children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => props.onCategoryChange(child.id)}
                            className={theme.categoryDropdownItem}
                          >
                            <span className="truncate">{child.name}</span>
                            <ChevronRight
                              className={cn(
                                "size-3.5 shrink-0 -translate-x-1 text-current opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100",
                                theme.categoryDropdownItemIcon,
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        {props.usesSidebarNav ? (
          <div className={cn("py-3 lg:hidden", theme.sectionDivider)}>
            <button
              type="button"
              onClick={props.onOpenCategoryDrawer}
              className={cn(
                theme.searchWrap,
                "flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left shadow-none",
              )}
              aria-label={t("header.openCategoriesAria")}
            >
              <div className="min-w-0">
                <p className={cn("text-[10px] font-bold uppercase tracking-[0.18em]", theme.headerMuted)}>
                  {t("header.category")}
                </p>
                <p className={cn("truncate text-sm font-semibold", theme.headerTitle)}>
                  {props.selectedCategoryLabel}
                </p>
              </div>
              <ChevronDown className={cn("size-5 shrink-0", theme.headerMuted)} />
            </button>
          </div>
        ) : (
          <div className={cn("py-3 md:hidden", theme.sectionDivider)}>
            <div className="scrollbar-hide -mx-4 flex gap-5 overflow-x-auto px-4 whitespace-nowrap">
              {props.homeHref ? (
                <a href={props.homeHref} className={theme.categoryNavMobile(false)}>
                  {t("header.allProducts")}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => props.onCategoryChange("all")}
                  className={theme.categoryNavMobile(props.selectedCategoryId === "all")}
                >
                  {t("header.allProducts")}
                </button>
              )}

              {props.topCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => props.onCategoryChange(category.id)}
                  className={theme.categoryNavMobile(props.selectedTopCategoryId === category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {props.mobileSubcategories.length ? (
              <div className="scrollbar-hide -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
                {props.mobileSubcategories.map((subcategory) => {
                  const isActive = props.selectedCategoryId === subcategory.id;

                  return (
                    <button
                      key={subcategory.id}
                      type="button"
                      onClick={() => props.onCategoryChange(subcategory.id)}
                      className={theme.categorySubChip(isActive)}
                    >
                      {subcategory.name}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {props.mobileSubSubcategories.length ? (
              <div className="scrollbar-hide -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
                {props.mobileSubSubcategories.map((subSubcategory) => {
                  const isActive = props.selectedCategoryId === subSubcategory.id;

                  return (
                    <button
                      key={subSubcategory.id}
                      type="button"
                      onClick={() => props.onCategoryChange(subSubcategory.id)}
                      className={theme.categorySubChip(isActive)}
                    >
                      {subSubcategory.name}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function StorefrontHeaderTopBar({ props }: { props: StorefrontHeaderProps }) {
  const theme = useStorefrontTheme();

  // Arama ve sepet alt bara taşındığında dört başlık varyantının da
  // ortasında bir boşluk kalıyor (grid gözü boşalıyor, arama satırı
  // yok oluyor). O yüzden bu durumda tek sade satır render ediliyor:
  // logo + dil/tema/çıkış. Kategori sekmeleri altta, ayrı bileşende.
  if (props.hideSearchAndCart) {
    return (
      <div className="container-shell py-3">
        <div className="flex items-center justify-between gap-3">
          <HeaderBrand props={props} compact />
          <HeaderActions props={props} compact />
        </div>
      </div>
    );
  }

  if (props.headerStyleKey === "centered") {
    return (
      <div className="container-shell space-y-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 lg:hidden">
            {props.subdomain && props.storefrontSettings.is_logout_button_visible !== false ? (
              <StorefrontLogoutButton
                subdomain={props.subdomain}
                tenantId={props.tenantId}
                className="lg:hidden"
              />
            ) : null}
          </div>
          <div className="flex flex-1 justify-center">
            <HeaderBrand props={props} centered />
          </div>
          <div className="flex flex-1 justify-end">
            <HeaderActions props={props} compact />
          </div>
        </div>
        <div className="flex justify-center">
          <HeaderSearch props={props} className="w-full max-w-xl" />
        </div>
      </div>
    );
  }

  if (props.headerStyleKey === "minimal") {
    return (
      <div className="container-shell space-y-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <HeaderBrand props={props} compact />
          <HeaderActions props={props} compact />
        </div>
        <HeaderSearch props={props} className="w-full" />
      </div>
    );
  }

  if (props.headerStyleKey === "split") {
    return (
      <div className="container-shell py-3">
        <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap lg:gap-6">
          <div className="flex min-w-0 shrink-0 items-center gap-2">
            <HeaderBrand props={props} compact />
          </div>
          <HeaderSearch props={props} className="order-3 w-full lg:order-none lg:max-w-none lg:flex-1" />
          <div className="ml-auto flex shrink-0 items-center">
            <HeaderActions props={props} compact />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-shell py-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,420px)_auto] lg:items-center">
        <div className="col-span-2 flex min-w-0 items-start gap-2 sm:gap-3 lg:col-span-1 lg:items-center lg:gap-4">
          <HeaderBrand props={props} />
          {props.subdomain && props.storefrontSettings.is_logout_button_visible !== false ? (
            <StorefrontLogoutButton
              subdomain={props.subdomain}
              tenantId={props.tenantId}
              className="lg:hidden"
            />
          ) : null}
        </div>
        <HeaderSearch props={props} className="lg:justify-self-center" />
        <HeaderActions props={props} />
      </div>
    </div>
  );
}

export function StorefrontHeader(props: StorefrontHeaderProps) {
  const theme = useStorefrontTheme();

  return (
    <header className={cn(theme.header, theme.headerBorder)}>
      <StorefrontHeaderTopBar props={props} />
      <StorefrontHeaderCategoryNav props={props} />
    </header>
  );
}
