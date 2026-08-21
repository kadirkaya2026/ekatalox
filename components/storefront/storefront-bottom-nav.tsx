"use client";

import type { ReactNode } from "react";
import { Search, ShoppingCart, Ticket } from "lucide-react";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { cn } from "@/lib/utils";

// Market/tekel vitrinlerinde mobilde her zaman görünen alt navigasyon
// (kullanıcı isteği, 21 Ağu 2026 — Getir örneği). Arama ve sepet üst
// başlıktan buraya taşındı; üst başlık sayfayla birlikte kayıp gittiği
// için müşteri ürünlere bakarken ikisine de ulaşamıyordu.
//
// Sepet ortada duruyor, sağda kampanyalar var. Kategoriler bilerek
// burada değil — üst başlıktaki kategori şeridi zaten kaydırılabilir
// halde duruyor.
//
// Sepet tutarını gösteren "Sipariş Özeti" satırı da bilerek yok
// (kullanıcı isteği): tutar için sepet açılıyor, alt bar sade kalıyor.
export function StorefrontBottomNav({
  cartItemCount,
  isTekel,
  isSearchOpen,
  isCampaignsOpen,
  onOpenSearch,
  onOpenCart,
  onOpenCampaigns,
}: {
  cartItemCount: number;
  isTekel: boolean;
  isSearchOpen: boolean;
  isCampaignsOpen: boolean;
  onOpenSearch: () => void;
  onOpenCart: () => void;
  onOpenCampaigns: () => void;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 sm:hidden">
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
          label={t(isTekel ? "bottomNav.cartPickup" : "bottomNav.cart")}
          icon={<ShoppingCart className="size-[22px]" />}
          isActive={false}
          badge={cartItemCount || null}
          onClick={onOpenCart}
        />
        <BottomNavButton
          label={t("bottomNav.campaigns")}
          icon={<Ticket className="size-[22px]" />}
          isActive={isCampaignsOpen}
          onClick={onOpenCampaigns}
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
