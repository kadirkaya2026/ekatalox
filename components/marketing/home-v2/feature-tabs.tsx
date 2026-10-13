"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Sol sekmeli özellik bloğu (14 Eki 2026, B2B Wave düzeninden): solda başlık
// listesi, sağda seçili özelliğin açıklaması ve panelden kesilmiş parçası.
// Görseller sunucu sayfasından hazır JSX olarak gelir.
export interface FeatureTab {
  key: string;
  label: string;
  description: string;
  href?: string;
  from: string;
  to: string;
  visual: ReactNode;
}

export function FeatureTabs({ tabs }: { tabs: FeatureTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t, i) => (
          <li key={t.key} className="shrink-0">
            <button
              type="button"
              onClick={() => setActive(t.key)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
                t.key === current.key ? "bg-brand-dark text-white shadow-md" : "bg-brand-paper text-brand-navy hover:bg-brand-navy-soft",
              )}
            >
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", t.key === current.key ? "bg-brand-neon text-brand-dark" : "bg-white text-brand-navy")}>{i + 1}</span>
              <span className="whitespace-nowrap lg:whitespace-normal">{t.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="overflow-hidden rounded-[28px] p-6 sm:p-10" style={{ backgroundImage: `linear-gradient(135deg, ${current.from} 0%, ${current.to} 100%)` }}>
        <div className="grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
          <div>
            <h3 className="text-2xl font-extrabold leading-tight tracking-[-0.02em] text-brand-navy sm:text-3xl">{current.label}</h3>
            <p className="mt-3 leading-relaxed text-brand-navy/75">{current.description}</p>
            {current.href ? (
              <Link href={current.href} className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy">
                Ayrıntıları inceleyin <ArrowRight className="size-4" aria-hidden />
              </Link>
            ) : null}
          </div>
          <div className="mx-auto w-full max-w-[380px]" key={current.key}>{current.visual}</div>
        </div>
      </div>
    </div>
  );
}
