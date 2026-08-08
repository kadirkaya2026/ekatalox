import type { ProductImageBackgroundKey } from "@/lib/types";
import type { StorefrontTheme } from "@/lib/storefront/themes";
import { cn } from "@/lib/utils";

export function applyProductImageBackgroundOverride(
  theme: StorefrontTheme,
  background: ProductImageBackgroundKey | null | undefined,
): StorefrontTheme {
  if (!background || background === "theme") {
    return theme;
  }

  const overrideClass = background === "white" ? "bg-white" : "bg-transparent";

  return {
    ...theme,
    productImageWrap: cn("relative aspect-square w-full overflow-hidden", overrideClass),
  };
}
