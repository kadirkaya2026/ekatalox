import type { Metadata } from "next";
import { ButtonLink, Container, Section } from "@/components/marketing/ui";

// Henüz bir bayiye atanmamış QR kodu okutulduğunda buraya düşülür
// (bkz. app/t/[slug]/route.ts). Kod görünür kalır ki bayi telefonda
// "şu kod bende" diyebilsin.
export const metadata: Metadata = {
  title: "Mağaza yakında",
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ kod?: string }> }) {
  const { kod } = await searchParams;
  return (
    <Section>
      <Container className="max-w-lg text-center">
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-brand-navy">Bu mağaza yakında burada</h1>
        <p className="mt-4 text-brand-muted">
          Okuttuğunuz kod henüz bir mağazaya bağlanmadı. Mağaza sayfasını yayına aldığında bu kod doğrudan oraya yönlendirecek; magnetinizi saklayın, yeniden okutmanız yeterli.
        </p>
        {kod ? (
          <div className="mt-8 inline-flex flex-col items-center gap-1 rounded-lg border border-brand-line bg-white px-6 py-4">
            <span className="text-[11px] uppercase tracking-[0.2em] text-brand-muted">Kod</span>
            <span className="font-plex-mono text-xl tracking-[0.3em] text-brand-navy">{kod.toUpperCase()}</span>
          </div>
        ) : null}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" tone="navy">eKatalox nedir?</ButtonLink>
          <ButtonLink href="/basvuru" tone="outline">Mağaza açmak istiyorum</ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
