"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, Search, ShoppingCart } from "lucide-react";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { cn } from "@/lib/utils";

// Market/tekel vitrinlerinde mobilde her zaman görünen alt navigasyon
// (kullanıcı isteği, 21 Ağu 2026 — Getir örneği). Arama ve sepet üst
// başlıktan buraya taşındı; üst başlık sayfayla birlikte kayıp gittiği
// için müşteri ürünlere bakarken ikisine de ulaşamıyordu.
//
// İki katman:
//   1) Sepet özeti — sadece sepette ürün varken. Eskiden ayrı bir
//      "sticky cart" barıydı ve kapatılabiliyordu; artık kalıcı
//      navigasyonun parçası olduğu için kapatma yok.
//   2) Ara / Kategoriler / Sepet — her zaman.
//
// Fiyat bloğu (indirim, kampanya, çoklu para birimi) storefront-client
// içinde hesaplandığı için hazır düğüm olarak geliyor; burada tekrar
// hesaplanmıyor.
export function StorefrontBottomNav({
  cartLength,
  cartItemCount,
  cartSummary,
  isTekel,
  isSearchOpen,
  isCategoriesOpen,
  onOpenSearch,
  onOpenCategories,
  onOpenCart,
}: {
  cartLength: number;
  cartItemCount: number;
  cartSummary: ReactNode;
  isTekel: boolean;
  isSearchOpen: boolean;
  isCategoriesOpen: boolean;
  onOpenSearch: () => void;
  onOpenCategories: () => void;
  onOpenCart: () => void;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 sm:hidden">
      <AnimatePresence>
        {cartLength ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="px-3 pb-2"
          >
            <button
              type="button"
              onClick={onOpenCart}
              className={cn(
                theme.stickyCart,
                "!static w-full max-w-none rounded-[1.5rem] px-3 py-2.5 text-left shadow-[0_18px_44px_rgba(15,23,42,0.22)]",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    theme.surfaceMuted,
                  )}
                >
                  <ShoppingCart className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold tracking-tight text-white">
                    {t("cart.orderSummary")}
                  </p>
                </div>
                <div className="min-w-0 text-right">{cartSummary}</div>
                <span
                  className={cn(
                    theme.stickyCartButton,
                    "shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-[0_8px_24px_rgba(16,185,129,0.22)]",
                  )}
                >
                  {t("stickyCart.continue")}
                </span>
              </div>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <nav
        aria-label={t("bottomNav.ariaLabel")}
        className={cn(
          "safe-bottom-padding grid grid-cols-3 gap-1 border-t px-2 pt-1.5 shadow-[0_-8px_28px_rgba(15,23,42,0.10)]",
          theme.surface,
          theme.border,
        )}
      >
        <BottomNavButton
          label={t("bottomNav.search")}
          icon={<Search className="size-[22px]" />}
          isActive={isSearchOpen}
          onClick={onOpenSearch}
        />
        <BottomNavButton
          label={t("bottomNav.categories")}
          icon={<LayoutGrid className="size-[22px]" />}
          isActive={isCategoriesOpen}
          onClick={onOpenCategories}
        />
        <BottomNavButton
          label={t(isTekel ? "bottomNav.cartPickup" : "bottomNav.cart")}
          icon={<ShoppingCart className="size-[22px]" />}
          isActive={false}
          badge={cartItemCount || null}
          onClick={onOpenCart}
        />
      </nav>
    </div>
  );
}

function BottomNavButton({
  label,
  icon,
  isActive,
  badge = null,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  isActive: boolean;
  badge?: number | null;
  onClick: () => void;
}) {
  const theme = useStorefrontTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 transition",
        isActive ? theme.productPrice : theme.textMuted,
      )}
    >
      <span className="relative">
        {icon}
        {badge ? <span className={theme.cartBadge}>{badge}</span> : null}
      </span>
      <span className="truncate text-[11px] font-semibold leading-tight">{label}</span>
    </button>
  );
}
