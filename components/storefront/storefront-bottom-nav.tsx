"use client";

import type { ReactNode } from "react";
import { Search, ShoppingCart, Ticket } from "lucide-react";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
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
  const { t } = useStorefrontLocale();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 sm:hidden">
      <nav
        aria-label={t("bottomNav.ariaLabel")}
        // Bar bilerek temadan bağımsız: koyu temalarda (noir) tema yüzeyi
        // sayfa zemininden ayrışmadığı için bar hiç fark edilmiyordu
        // (kullanıcı isteği, 22 Ağu 2026). Her temada beyaz zemin +
        // siyah ikon/yazı.
        className="bottom-nav-inset grid grid-cols-3 items-end gap-1 border-t border-slate-200 bg-white px-2 pt-2 shadow-[0_-8px_28px_rgba(15,23,42,0.16)]"
      >
        <BottomNavButton
          label={t("bottomNav.search")}
          icon={<Search className="size-[22px]" />}
          isActive={isSearchOpen}
          onClick={onOpenSearch}
        />
        <BottomNavButton
          label={t(isTekel ? "bottomNav.cartPickup" : "bottomNav.cart")}
          icon={<ShoppingCart className="size-[27px]" />}
          isActive={false}
          badge={cartItemCount || null}
          emphasized
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

// emphasized: ortadaki sepet butonu. Diğerlerinden büyük ve barın üst
// çizgisinin dışına taşıyor (kullanıcı isteği). Taşan kısmın altındaki
// yuvarlak barla aynı yüzey rengini kullanıyor — çizgi ikonun etrafında
// kesiliyormuş gibi görünsün diye.
function BottomNavButton({
  label,
  icon,
  isActive,
  badge = null,
  emphasized = false,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  isActive: boolean;
  badge?: number | null;
  emphasized?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      // Yazı ve ikonlar her temada siyah; vurgu sadece ortadaki sepet
      // yuvarlağında (turuncu zemin + beyaz ikon, kullanıcı isteği
      // 22 Ağu 2026). "Sepet" etiketi yuvarlağın dışında kaldığı için o
      // da siyah kalıyor.
      className={cn(
        "flex min-h-[3.25rem] flex-col items-center justify-end gap-1 rounded-2xl px-1 pb-0.5 text-slate-900 transition",
        emphasized ? "-mt-5" : "pt-1.5",
        isActive && !emphasized && "bg-slate-100",
      )}
    >
      <span
        // Mobilde sepete uçma animasyonunun hedefi ortadaki turuncu yuvarlak
        data-cart-target={emphasized ? "" : undefined}
        className={cn(
          "relative flex items-center justify-center",
          // Taşan yuvarlak turuncu, içindeki sepet ikonu beyaz; gölge
          // arkadaki ürünlerden ayırıyor.
          emphasized &&
            "size-[3.1rem] rounded-full bg-orange-600 text-white shadow-[0_-24px_80px_rgba(15,23,42,0.22)]",
        )}
      >
        {icon}
        {/* Rozet turuncu yuvarlağın üstünde duruyor: beyaz zemin +
            siyah rakam (kullanıcı isteği, 22 Ağu 2026). */}
        {badge ? (
          <span className="absolute -right-2 -top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-900 shadow-sm">
            {badge}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "truncate font-semibold leading-tight",
          emphasized ? "text-[13px]" : "text-[11px]",
        )}
      >
        {label}
      </span>
    </button>
  );
}
