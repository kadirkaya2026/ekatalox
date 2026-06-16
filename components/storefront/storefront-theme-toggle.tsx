"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { cn } from "@/lib/utils";

export function StorefrontThemeToggle({ className }: { className?: string }) {
  const theme = useStorefrontTheme();
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
      aria-label={isDark ? "Gündüz modu" : "Gece modu"}
      title={isDark ? "Gündüz modu" : "Gece modu"}
      className={cn(theme.headerIconButton, "size-11 lg:size-12", className)}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
