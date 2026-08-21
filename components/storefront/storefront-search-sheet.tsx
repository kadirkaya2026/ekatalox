"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { cn } from "@/lib/utils";

// Arama kutusu market/tekel vitrinlerinde üst başlıktan alt navigasyona
// taşındı; "Ara" butonunun açtığı yüzey burası.
//
// Neden ÜSTTE açılıyor, alt barın üstünde değil: iOS Safari klavye
// açıldığında layout viewport'un altına sabitlenmiş (position: fixed)
// öğeleri klavyenin arkasında bırakıyor. Üste sabitlenen çubuk klavyeyle
// birlikte görünür kalıyor.
//
// Arka planda karartma YOK — kullanıcı yazarken ürün listesi canlı
// süzülüyor ve arkada görünüyor (Getir davranışı). Arama mantığı burada
// değil: değer storefront-client'taki searchInput state'ine bağlanıyor,
// debounce ve sıralama olduğu gibi çalışıyor.
export function StorefrontSearchSheet({
  isOpen,
  value,
  resultCount,
  onChange,
  onClose,
}: {
  isOpen: boolean;
  value: string;
  resultCount: number;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();

    // Panel sayfanın üstüne oturuyor. Kullanıcı listenin ortasındayken
    // "Ara"ya bastıysa sonuçlar panelin arkasında kalıyor; arama terimi
    // girildiğinde banner ve şeritler zaten gizlendiği için sayfa başa
    // alınınca doğrudan sonuç ızgarası görünüyor.
    window.scrollTo({ top: 0, behavior: "smooth" });

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "fixed inset-x-0 top-0 z-50 border-b px-3 pb-3 pt-3 shadow-[0_10px_30px_rgba(15,23,42,0.14)] sm:hidden",
            theme.surface,
            theme.border,
          )}
          role="search"
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                theme.searchWrap,
                "relative h-11 min-w-0 flex-1 rounded-full shadow-none",
              )}
            >
              <Search className={cn(theme.searchIcon, "left-4 size-4")} />
              <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                placeholder={t("header.searchPlaceholder")}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={cn(
                  theme.searchInput,
                  "h-11 w-full rounded-full border-0 bg-transparent py-2 pl-10 pr-4 text-[16px]",
                )}
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              className={theme.cartDrawerCloseButton}
              aria-label={t("common.close")}
            >
              <X className="size-5" />
            </button>
          </div>

          {value.trim() ? (
            <p className={cn("mt-2 px-1 text-xs font-semibold", theme.textMuted)}>
              {t("catalog.productsFound", { count: resultCount })}
            </p>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
