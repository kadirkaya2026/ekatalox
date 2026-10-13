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
        <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-navy sm:text-5xl">Bu mağaza <span className="text-brand-green">yakında</span> burada.</h1>
        <p className="mt-4 text-brand-muted">
          Bu adres henüz bir kataloğa bağlanmadı. Firma kataloğunu yayına aldığında aynı adres doğrudan oraya açılacak; adresi saklayın, daha sonra yeniden deneyin.
        </p>
        {kod ? (
          <div className="mt-8 inline-flex flex-col items-center gap-1 rounded-[20px] border border-brand-line bg-white px-6 py-4 shadow-sm">
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
