"use client";

import { useStorefrontTheme } from "@/lib/storefront/theme-context";
import type { RetailInfoSection } from "@/lib/storefront/retail-config";
import { cn } from "@/lib/utils";

// Anasayfa bilgi kartları (0155, retail_config.info_sections): "Neden biz",
// "Toplu sipariş", "Teslimat", "Nasıl sipariş verilir" gibi mağazanın kendi
// metinleri. Gövde metnindeki satır sonları korunur.
export function StorefrontInfoSections({ sections }: { sections: RetailInfoSection[] }) {
  const theme = useStorefrontTheme();
  return (
    <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sections.map((section) => (
        <article key={section.title} className={cn("rounded-3xl border p-5 sm:p-6", theme.surface, theme.border)}>
          <h3 className={cn("text-lg font-bold tracking-tight", theme.text)}>
            {section.emoji ? <span className="mr-2">{section.emoji}</span> : null}
            {section.title}
          </h3>
          <p className={cn("mt-2 whitespace-pre-line text-sm leading-6", theme.textMuted)}>{section.body}</p>
        </article>
      ))}
    </section>
  );
}
