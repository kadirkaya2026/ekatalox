"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { useStorefrontLocale } from "@/lib/storefront/locale-context";
import { cn } from "@/lib/utils";

export function StorefrontThemeToggle({ className }: { className?: string }) {
  const theme = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? t("theme.toggleToLight") : t("theme.toggleToDark")}
      title={isDark ? t("theme.toggleToLight") : t("theme.toggleToDark")}
      className={cn(theme.headerIconButton, "size-11 lg:size-12", className)}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
