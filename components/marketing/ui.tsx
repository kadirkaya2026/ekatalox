// Pazarlama sitesi yapı taşları (8 Eyl 2026). Sunucu bileşenleri; kart,
// gölge ve animasyon bilerek yok. Renkler globals.css @theme brand-* token'ları.
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
  children,
}: {
  id?: string;
  className?: string;
  tone?: "paper" | "white" | "navy";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-16 sm:py-24",
        tone === "paper" && "bg-brand-paper",
        tone === "white" && "bg-white",
        tone === "navy" && "bg-brand-navy text-white",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-xs font-semibold uppercase tracking-[0.14em] text-brand-green", className)}>{children}</p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl">{title}</h2>
      {lead ? <p className="mt-4 text-lg leading-relaxed text-brand-muted">{lead}</p> : null}
    </div>
  );
}

type ButtonTone = "primary" | "navy" | "outline" | "ghost" | "white";

const buttonTones: Record<ButtonTone, string> = {
  primary: "bg-brand-green text-white hover:bg-[#126A4F]",
  navy: "bg-brand-navy text-white hover:bg-[#0E2039]",
  outline: "border border-brand-line bg-white text-brand-ink hover:border-brand-navy",
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
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
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
export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-plex-mono text-3xl font-medium tabular-nums text-brand-navy">{value}</div>
      <div className="mt-1 text-sm text-brand-muted">{label}</div>
    </div>
  );
}

export function CheckList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-base leading-relaxed">
          <span
            aria-hidden
            className="mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-green-soft text-brand-green"
          >
            <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10.5l4 4 8-9" />
            </svg>
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
