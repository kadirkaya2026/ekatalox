"use client";

import {
  isHtmlDescription,
  sanitizeProductDescription,
} from "@/lib/products/description-html";
import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import { cn } from "@/lib/utils";

export function ProductDescriptionContent({
  content,
  className,
}: {
  content?: string | null;
  className?: string;
}) {
  const theme = useStorefrontTheme();
  const normalized = content?.trim() ?? "";

  if (!normalized) {
    return (
      <p className={cn("text-sm leading-6", theme.prose, className)}>
        Bu ürün için detay bilgisi eklenmedi.
      </p>
    );
  }

  if (isHtmlDescription(normalized)) {
    const sanitized = sanitizeProductDescription(normalized);

    if (!sanitized) {
      return (
        <p className={cn("text-sm leading-6", theme.prose, className)}>
          Bu ürün için detay bilgisi eklenmedi.
        </p>
      );
    }

    return (
      <div
        className={cn(
          "product-description-content text-sm leading-6",
          theme.prose,
          "[&_h2]:mb-1 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 dark:[&_h2]:text-white",
          "[&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-slate-900 dark:[&_h3]:text-white",
          "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
          "[&_li]:my-0.5",
          "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
          "[&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-3 [&_blockquote]:text-slate-500 dark:[&_blockquote]:border-neutral-700 dark:[&_blockquote]:text-neutral-400",
          "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
          "[&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-100 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold dark:[&_th]:border-neutral-700 dark:[&_th]:bg-neutral-800",
          "[&_td]:border [&_td]:border-slate-200 [&_td]:px-2 [&_td]:py-1.5 dark:[&_td]:border-neutral-700",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  return (
    <p
      className={cn(
        "whitespace-pre-wrap break-words text-sm leading-6",
        theme.prose,
        className,
      )}
    >
      {normalized}
    </p>
  );
}
