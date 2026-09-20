// Pazarlama sitesi yapı taşları (21 Eyl 2026 koyu tema yeniden tasarımı).
// Sunucu bileşenleri. Renkler globals.css @theme brand-* token'ları.
// "navy" tonu artık koyu SaaS zemini (brand-dark); açık bölümler "paper"/"white".
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>{children}</div>;
}

export function Section({
  id,
  className,
  tone = "paper",
  glow = false,
  children,
}: {
  id?: string;
  className?: string;
  tone?: "paper" | "white" | "navy";
  /** Koyu bölümlerde arka planda ince yeşil ışıma + nokta deseni. */
  glow?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-16 sm:py-24",
        tone === "paper" && "bg-brand-paper",
        tone === "white" && "bg-white",
        tone === "navy" && "bg-brand-dark text-white",
        tone === "navy" && "overflow-hidden",
        className,
      )}
    >
      {tone === "navy" && glow ? (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand-neon/20 blur-[120px]"
          />
        </>
      ) : null}
      <div className="relative">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, className, dark }: { children: ReactNode; className?: string; dark?: boolean }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]",
        dark ? "text-brand-neon" : "text-brand-green",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  dark = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
  /** Koyu (navy) bölümde eyebrow/lead renkleri buna göre uyarlanır. */
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <Eyebrow dark={dark}>{eyebrow}</Eyebrow> : null}
      <h2
        className={cn(
          "mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl",
          dark && "text-white",
        )}
      >
        {title}
      </h2>
      {lead ? (
        <p className={cn("mt-4 text-lg leading-relaxed", dark ? "text-white/70" : "text-brand-muted")}>{lead}</p>
      ) : null}
    </div>
  );
}

type ButtonTone = "primary" | "navy" | "outline" | "outline-dark" | "ghost" | "white";

const buttonTones: Record<ButtonTone, string> = {
  primary:
    "bg-brand-neon text-white shadow-[0_0_0_0_rgba(34,197,94,0)] hover:bg-[#1ea952] hover:shadow-[0_0_32px_-6px_rgba(34,197,94,0.6)]",
  navy: "bg-brand-navy text-white hover:bg-[#0E2039]",
  outline: "border border-brand-line bg-white text-brand-ink hover:border-brand-navy",
  "outline-dark": "border border-white/20 bg-white/5 text-white backdrop-blur-sm hover:border-white/40 hover:bg-white/10",
  ghost: "text-brand-ink hover:bg-brand-navy-soft",
  white: "bg-white text-brand-navy hover:bg-brand-paper",
};

export function ButtonLink({
  href,
  tone = "primary",
  size = "md",
  className,
  children,
  external,
}: {
  href: string;
  tone?: ButtonTone;
  size?: "md" | "lg";
  className?: string;
  children: ReactNode;
  external?: boolean;
}) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-neon",
    size === "md" ? "px-5 py-3 text-sm" : "px-7 py-4 text-base",
    buttonTones[tone],
    className,
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

/** Rakam vurgusu: yalnız gerçek rakamlar için. */
export function Stat({ value, label, dark }: { value: string; label: string; dark?: boolean }) {
  return (
    <div>
      <div className={cn("font-plex-mono text-3xl font-medium tabular-nums", dark ? "text-white" : "text-brand-navy")}>
        {value}
      </div>
      <div className={cn("mt-1 text-sm", dark ? "text-white/60" : "text-brand-muted")}>{label}</div>
    </div>
  );
}

export function CheckList({ items, className, dark }: { items: string[]; className?: string; dark?: boolean }) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-base leading-relaxed">
          <span
            aria-hidden
            className={cn(
              "mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full",
              dark ? "bg-brand-neon/15 text-brand-neon" : "bg-brand-green-soft text-brand-green",
            )}
          >
            <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10.5l4 4 8-9" />
            </svg>
          </span>
          <span className={dark ? "text-white/80" : undefined}>{item}</span>
        </li>
      ))}
    </ul>
  );
}
