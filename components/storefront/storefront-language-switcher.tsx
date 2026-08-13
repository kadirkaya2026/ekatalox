"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe } from "lucide-react";
import { STOREFRONT_LOCALES } from "@/lib/storefront/i18n/dictionary";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { cn } from "@/lib/utils";

export function StorefrontLanguageSwitcher({ className }: { className?: string }) {
  const theme = useStorefrontTheme();
  const { locale, setLocale, t } = useStorefrontLocale();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(theme.headerIconButton, "size-11 lg:size-12", className)}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={t("language.switcherAria")}
        title={t("language.switcherAria")}
        className={cn(
          theme.headerIconButton,
          "size-11 gap-1 px-2 text-xs font-bold lg:size-12",
        )}
      >
        <Globe className="size-4" />
        <span className="hidden sm:inline">{locale.toUpperCase()}</span>
      </button>

      <AnimatePresence>
        {isOpen ? (
          <>
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "absolute right-0 top-full z-20 mt-2 min-w-24 overflow-hidden rounded-xl shadow-lg",
                theme.border,
                theme.surface,
              )}
            >
              {STOREFRONT_LOCALES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setLocale(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-left text-sm font-semibold transition hover:opacity-80",
                    option.value === locale ? theme.text : theme.textMuted,
                  )}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
