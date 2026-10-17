"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Gift, House, Search, ShoppingCart, UserRound } from "lucide-react";
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
// iOS Safari'de bar ara ara ekranın ortasında belirip kaydırmayla dolaşıyor
// (müşteride 5 Eyl, kullanıcının kendi telefonunda 7 Eyl 2026 — uygulama
// değiştirip Safari'ye dönünce; yenileme düzeltmiyor, adres çubuğuna yeniden
// yazmak düzeltiyordu). Üst öğe zinciri temiz (transform/filter yok), giriş
// alanları 16px (otomatik zoom yok); kalan adaylar Safari'nin arka plandan
// dönüşte görsel viewport'u bayat bırakması ve fixed öğeleri sayfaya yapıştıran
// WebKit birleştirme hataları. Kesin tekrar üretilemediği için çözüm sebepten
// bağımsız: bar her karede GERÇEK konumunu ölçer (getBoundingClientRect),
// görsel viewport'un alt kenarıyla karşılaştırır, sapma varsa inline top/left/
// width ile kendini oraya taşır (geri beslemeli; hangi kapsayıcıya göre
// konumlandığı önemsiz). Klavye açıkken dokunmaz. Ek olarak 700 ms'lik
// bekçi: olay gelmese bile bayat durumu yakalar.
function useVisualViewportAnchor(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (typeof window === "undefined" || !ref.current) return;
    // Yalnız dokunmatik cihazlar: masaüstünde bar zaten gizli, gereksiz iş yok.
    if (!(navigator.maxTouchPoints > 0)) return;
    // Ana ekrana eklenmiş uygulamada tarayıcı çubuğu yok, fixed bottom doğru
    // duruyor; açılışta görsel viewport bayat ölçülüp barı ortaya taşıyordu.
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const vv = window.visualViewport;
    let frame = 0;
    let passes = 0;

    const isEditing = () => {
      const el = document.activeElement;
      return !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
    };

    const apply = () => {
      frame = 0;
      const node = ref.current;
      if (!node || isEditing()) return;

      const targetBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
      const targetLeft = vv ? vv.offsetLeft : 0;
      const targetWidth = vv ? vv.width : window.innerWidth;
      const rect = node.getBoundingClientRect();
      const delta = targetBottom - rect.bottom;
      const aligned =
        Math.abs(delta) <= 1 && Math.abs(rect.left - targetLeft) <= 1 && Math.abs(rect.width - targetWidth) <= 1;
      if (aligned) {
        passes = 0;
        return;
      }

      const currentTop = parseFloat(node.style.top);
      node.style.bottom = "auto";
      node.style.left = `${targetLeft}px`;
      node.style.width = `${targetWidth}px`;
      node.style.top = `${(Number.isFinite(currentTop) ? currentTop : rect.top) + delta}px`;

      // Kapsayıcı beklenmedikse ilk adım tam oturmaz; birkaç kez yakınsa.
      if (passes < 3) {
        passes += 1;
        schedule();
      } else {
        passes = 0;
      }
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(apply);
    };

    apply();
    vv?.addEventListener("resize", schedule);
    vv?.addEventListener("scroll", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    window.addEventListener("pageshow", schedule);
    window.addEventListener("focus", schedule);
    document.addEventListener("visibilitychange", schedule);
    document.addEventListener("focusout", schedule);
    const watchdog = window.setInterval(schedule, 700);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.clearInterval(watchdog);
      vv?.removeEventListener("resize", schedule);
      vv?.removeEventListener("scroll", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.removeEventListener("pageshow", schedule);
      window.removeEventListener("focus", schedule);
      document.removeEventListener("visibilitychange", schedule);
      document.removeEventListener("focusout", schedule);
    };
  }, [ref]);
}

// Alt bar düzeni (17 Eki 2026, kullanıcı isteği — Getir örneği): Ana sayfa ·
// Arama · Sepet (ortada, taşan yuvarlak) · Hesabım · Kampanyalar; yalnız ikon.
// Vitrin dışındaki sayfalarda (Hesabım, Giriş vb.) işleyici verilmez: düğmeler
// vitrine ?ara=1 / ?sepet=1 / ?kampanyalar=1 ile döner, vitrin ilgili paneli açar.
export function StorefrontBottomNav({
  cartItemCount,
  isTekel,
  isSearchOpen = false,
  isCampaignsOpen = false,
  isHomeActive = false,
  isAccountActive = false,
  accountHref,
  accountBadge = 0,
  onGoHome,
  onOpenSearch,
  onOpenCart,
  onOpenCampaigns,
}: {
  cartItemCount: number;
  isTekel: boolean;
  isSearchOpen?: boolean;
  isCampaignsOpen?: boolean;
  isHomeActive?: boolean;
  isAccountActive?: boolean;
  /** Market üyeliği (0180): Hesabım sekmesi; yoksa sekme çıkmaz. */
  accountHref?: string;
  /** Görülmemiş sipariş güncellemesi (yola çıktı vb.) sayısı. */
  accountBadge?: number;
  onGoHome?: () => void;
  onOpenSearch?: () => void;
  onOpenCart?: () => void;
  onOpenCampaigns?: () => void;
}) {
  const { t } = useStorefrontLocale();
  const shellRef = useRef<HTMLDivElement | null>(null);
  useVisualViewportAnchor(shellRef);
  // Sayfa değiştiren sekme (Hesabım, alt sayfalardan Ana sayfa…) basıldığı an
  // turuncu yanar ve üstte ilerleme çizgisi çıkar; tam sayfa geçişi sürerken
  // "dokundum mu?" belirsizliği kalmasın (17 Eki 2026, kullanıcı geri bildirimi).
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  useEffect(() => {
    // Geri tuşuyla önbellekten (bfcache) dönülünce bekleme durumu temizlenir.
    const reset = () => setPendingTab(null);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);
  const go = (key: string, handler: (() => void) | undefined, href: string) => () => {
    if (handler) {
      handler();
      return;
    }
    setPendingTab(key);
    window.location.href = href;
  };

  return (
    <div ref={shellRef} className="bottom-nav-shell fixed inset-x-0 bottom-0 z-40 sm:hidden">
      {pendingTab ? <NavigationProgressBar /> : null}
      <nav
        aria-label={t("bottomNav.ariaLabel")}
        // Bar bilerek temadan bağımsız: koyu temalarda (noir) tema yüzeyi
        // sayfa zemininden ayrışmadığı için bar hiç fark edilmiyordu
        // (kullanıcı isteği, 22 Ağu 2026). Her temada beyaz zemin.
        className={cn(
          "bottom-nav-inset grid items-end border-t border-slate-200 bg-white px-1 pt-1.5 shadow-[0_-8px_28px_rgba(15,23,42,0.12)]",
          accountHref ? "grid-cols-5" : "grid-cols-4",
        )}
      >
        <BottomNavButton
          label={t("bottomNav.home")}
          icon={<House className="size-6" />}
          isActive={pendingTab ? pendingTab === "home" : isHomeActive}
          onClick={go("home", onGoHome, "/")}
        />
        <BottomNavButton
          label={t("bottomNav.search")}
          icon={<Search className="size-6" />}
          isActive={pendingTab ? pendingTab === "search" : isSearchOpen}
          onClick={go("search", onOpenSearch, "/?ara=1")}
        />
        <BottomNavButton
          label={t(isTekel ? "bottomNav.cartPickup" : "bottomNav.cart")}
          icon={<ShoppingCart className="size-[26px]" />}
          isActive={false}
          badge={cartItemCount || null}
          emphasized
          onClick={go("cart", onOpenCart, "/?sepet=1")}
        />
        {accountHref ? (
          <BottomNavButton
            label={t("bottomNav.account")}
            icon={<UserRound className="size-6" />}
            isActive={pendingTab ? pendingTab === "account" : isAccountActive}
            dot={accountBadge}
            onClick={go("account", undefined, accountHref)}
          />
        ) : null}
        <BottomNavButton
          label={t("bottomNav.campaigns")}
          icon={<Gift className="size-6" />}
          isActive={pendingTab ? pendingTab === "campaigns" : isCampaignsOpen}
          onClick={go("campaigns", onOpenCampaigns, "/?kampanyalar=1")}
        />
      </nav>
    </div>
  );
}

// emphasized: ortadaki sepet butonu; barın üst çizgisinin dışına taşan turuncu
// yuvarlak (beyaz ikon). Diğerleri yalnız ikon: pasifken gri, aktifken turuncu.
function BottomNavButton({
  label,
  icon,
  isActive,
  badge = null,
  dot = 0,
  emphasized = false,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  isActive: boolean;
  badge?: number | null;
  /** Hesabım'daki kırmızı sayaç (sipariş güncellemesi). */
  dot?: number;
  emphasized?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        // touch-manipulation: dokunmada gecikme yok; active: basılınca hafif küçülür.
        "flex min-h-[3.25rem] touch-manipulation select-none items-center justify-center pb-1 transition active:scale-90",
        emphasized ? "-mt-7 items-start" : "pt-1",
        isActive ? "text-orange-600" : "text-slate-400",
      )}
    >
      <span
        // Mobilde sepete uçma animasyonunun hedefi ortadaki turuncu yuvarlak
        data-cart-target={emphasized ? "" : undefined}
        className={cn(
          "relative flex items-center justify-center",
          emphasized &&
            "size-[3.6rem] rounded-full bg-orange-600 text-white ring-4 ring-white shadow-[0_8px_24px_rgba(234,88,12,0.35)]",
        )}
      >
        {icon}
        {badge ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-900 shadow-sm">
            {badge}
          </span>
        ) : null}
        {dot > 0 ? (
          <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {dot > 9 ? "9+" : dot}
          </span>
        ) : null}
      </span>
    </button>
  );
}

/** Tam sayfa geçişi sürerken ekranın en üstünde akan ince turuncu çizgi. */
export function NavigationProgressBar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden bg-orange-100">
      <div className="h-full w-1/3 animate-[ekx-nav-progress_1s_ease-in-out_infinite] rounded-full bg-orange-600" />
    </div>
  );
}

/**
 * Vitrin dışı sayfalarda (Hesabım vb.) iç bağlantıya basılınca ilerleme çizgisi:
 * menü satırları ve geri tuşu tam sayfa geçişi yapar.
 */
export function useLinkNavigationProgress() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank") return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href.startsWith("/") || href.startsWith("//")) return;
      setActive(true);
    };
    const reset = () => setActive(false);
    const start = () => setActive(true);
    document.addEventListener("click", onClick);
    window.addEventListener("pageshow", reset);
    window.addEventListener("ekx-nav-start", start);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("pageshow", reset);
      window.removeEventListener("ekx-nav-start", start);
    };
  }, []);
  return active;
}
