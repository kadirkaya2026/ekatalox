// Beacons tarzı taslak (14 Eki 2026): iç sayfalar için ortak parçalar.
// Sunucu bileşenleri; renkler globals.css brand-* token'ları.
import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink, Container } from "@/components/marketing/ui";
import { CUSTOMER_NAMES } from "@/lib/marketing/site";
import { cn } from "@/lib/utils";

/** Sayfalar arasında dönen pastel degrade çiftleri (yeşil, turuncu, mor, mavi, pembe). */
export const PASTELS: Array<{ from: string; to: string }> = [
  { from: "#DDF6E7", to: "#8FD9AF" },
  { from: "#FFE9C7", to: "#FFB173" },
  { from: "#EAE4FF", to: "#B9A6FF" },
  { from: "#DCEBFF", to: "#8FBDFF" },
  { from: "#FFE1EE", to: "#FFA3C7" },
];

export function pastelStyle(i: number) {
  const p = PASTELS[i % PASTELS.length];
  return { backgroundImage: `linear-gradient(135deg, ${p.from} 0%, ${p.to} 100%)` };
}

/** Başlıkta tek vurgulu kelime. */
export function Accent({ children }: { children: ReactNode }) {
  return <span className="text-brand-green">{children}</span>;
}

/** Sayfa tepesi: ortalı, dev, beyaz zemin. */
export function PageHero({
  eyebrow,
  title,
  lead,
  actions,
  breadcrumb,
  children,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("bg-white pb-12 pt-14 sm:pb-16 sm:pt-24", className)}>
      <Container>
        {breadcrumb ? <div className="mb-8 text-center text-sm text-brand-muted">{breadcrumb}</div> : null}
        <div className="mx-auto max-w-4xl text-center">
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-green">{eyebrow}</p> : null}
          <h1 className="mt-5 text-balance text-[2.6rem] font-extrabold leading-[1.0] tracking-[-0.035em] text-brand-navy sm:text-6xl lg:text-[4.6rem]">
            {title}
          </h1>
          {lead ? <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-brand-muted sm:text-xl">{lead}</p> : null}
          {actions ? <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">{actions}</div> : null}
        </div>
        {children}
      </Container>
    </section>
  );
}

/** Beyaz zeminde yuvarlak pastel kutu (başlık, vurgu, küçük bloklar için). */
export function TintBox({ index = 0, className, children }: { index?: number; className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-[28px] p-7 sm:p-9", className)} style={pastelStyle(index)}>
      {children}
    </div>
  );
}

/** Sayfa sonu çağrısı: pastel degrade kart. */
export function ClosingCta({
  title,
  lead,
  primaryHref = "/basvuru",
  primaryLabel = "Ücretsiz başla",
  secondary,
  index = 3,
}: {
  title: ReactNode;
  lead?: ReactNode;
  primaryHref?: string;
  primaryLabel?: string;
  secondary?: ReactNode;
  index?: number;
}) {
  return (
    <section className="bg-white py-16 sm:py-24">
      <Container>
        <div className="rounded-[32px] px-6 py-14 text-center sm:px-12 sm:py-20" style={pastelStyle(index)}>
          <h2 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-navy sm:text-6xl">{title}</h2>
          {lead ? <p className="mx-auto mt-5 max-w-xl text-lg text-brand-navy/70">{lead}</p> : null}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href={primaryHref} tone="navy" size="lg" className="px-9">
              {primaryLabel}
            </ButtonLink>
            {secondary}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Üstte pastel bant, altta beyaz içerik: adım/sektör kartı. */
export function BandCard({ index, href, band, children, className }: { index: number; href?: string; band: ReactNode; children: ReactNode; className?: string }) {
  const inner = (
    <>
      <div className="flex min-h-[132px] items-end p-6" style={pastelStyle(index)}>
        {band}
      </div>
      <div className="flex flex-1 flex-col p-6">{children}</div>
    </>
  );
  const classes = cn(
    "flex h-full flex-col overflow-hidden rounded-[24px] border border-brand-line bg-white shadow-[0_24px_50px_-36px_rgba(18,40,74,0.4)] transition-transform",
    href && "hover:-translate-y-1",
    className,
  );
  return href ? (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  ) : (
    <div className={classes}>{inner}</div>
  );
}

/** Kayan müşteri şeridi: yalnız gerçek müşteriler (lib/marketing/site CUSTOMER_NAMES). */
export function CustomerMarquee({ title = "Siparişlerini eKatalox'tan alan firmalar", className }: { title?: string | null; className?: string }) {
  if (CUSTOMER_NAMES.length === 0) return null;
  const names = Array.from({ length: Math.ceil(8 / CUSTOMER_NAMES.length) }, () => CUSTOMER_NAMES).flat();
  return (
    <section className={cn("border-y border-brand-line bg-white py-8", className)}>
      {title ? <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-brand-muted">{title}</p> : null}
      <div className="group relative mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]" aria-label={`Müşterilerimiz: ${CUSTOMER_NAMES.join(", ")}`}>
        <div className="flex w-max animate-[customer-marquee_75s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden className="flex shrink-0 items-center">
              {names.map((name, i) => (
                <li key={`${copy}-${i}`} className="whitespace-nowrap px-8 text-xl font-semibold tracking-[-0.01em] text-brand-navy/70 sm:px-12 sm:text-2xl">{name}</li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Pastel zeminli, ortalı içerik kutusu (telefon görseli vb.). */
export function GradientPanelLite({ index, children, className }: { index: number; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center rounded-[28px] p-8 text-center", className)} style={pastelStyle(index)}>
      {children}
    </div>
  );
}

/** Ortalı küçük sayfa yolu. */
export function Breadcrumb({ items }: { items: Array<{ href?: string; label: string }> }) {
  return (
    <nav aria-label="Sayfa yolu">
      <ol className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-sm text-brand-muted">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-2">
            {item.href ? <Link href={item.href} className="hover:text-brand-navy hover:underline">{item.label}</Link> : <span aria-current="page" className="text-brand-navy">{item.label}</span>}
            {i < items.length - 1 ? <span aria-hidden>/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Açılır-kapanır SSS listesi, yuvarlak kart. */
export function FaqList({ items }: { items: Array<{ q: string; a: string }> }) {
  return (
    <div className="divide-y divide-brand-line overflow-hidden rounded-[24px] border border-brand-line bg-white">
      {items.map((item) => (
        <details key={item.q} className="group px-6 py-5">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left text-base font-semibold text-brand-navy [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            <span aria-hidden className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-paper text-brand-muted transition-transform group-open:rotate-45">
              <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 4v12M4 10h12" /></svg>
            </span>
          </summary>
          <p className="mt-3 max-w-3xl leading-relaxed text-brand-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
