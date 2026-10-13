// Beacons tarzı taslak (14 Eki 2026): iç sayfalar için ortak parçalar.
// Sunucu bileşenleri; renkler globals.css brand-* token'ları.
import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink, Container } from "@/components/marketing/ui";
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
