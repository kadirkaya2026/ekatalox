"use client";

import { StorefrontThemeProvider, useStorefrontTheme } from "@/lib/storefront/theme-context";
import { cn } from "@/lib/utils";

function StorefrontPageShellInner({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const theme = useStorefrontTheme();

  return (
    <div data-storefront className={cn(theme.page, className)}>
      {children}
    </div>
  );
}

export function StorefrontPageShell({
  themeKey,
  className,
  children,
}: {
  themeKey: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <StorefrontThemeProvider themeKey={themeKey}>
      <StorefrontPageShellInner className={className}>{children}</StorefrontPageShellInner>
    </StorefrontThemeProvider>
  );
}
