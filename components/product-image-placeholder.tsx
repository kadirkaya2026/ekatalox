import { Store } from "lucide-react";
import { cn } from "@/lib/utils";

// Görseli olmayan ürünler için tutarlı yer tutucu: sabit bir ikon yerine
// ürünün adını gösterir, böylece görselsiz eklenen ürünler storefront'ta
// ve admin panelde birbirinden ayırt edilebilir kalır.
export function ProductImagePlaceholder({
  productName,
  icon = true,
  iconClassName,
  textClassName,
  className,
}: {
  productName: string;
  icon?: boolean;
  iconClassName?: string;
  textClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full w-full flex-col items-center justify-center gap-1 px-1.5 text-center", className)}>
      {icon ? <Store className={iconClassName} /> : null}
      <span className={cn("line-clamp-2 font-medium leading-tight", textClassName)}>{productName}</span>
    </div>
  );
}
