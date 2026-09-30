import Link from "next/link";

import { marketingMetadata } from "@/lib/marketing/metadata";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { SITE } from "@/lib/marketing/site";
import { SORU_GRUPLARI, TUM_SORULAR } from "@/lib/marketing/sorular";

// /sorular (30 Eyl 2026): toptancıların Google'a yazdığı "nasıl yapılır / nedir"
// sorularına rehber. /sss ürün SSS'sidir; burası arama niyetine yönelik içeriktir.
// Aynı içerik llms.txt'de düz metin olarak da yayınlanır.
export const metadata = marketingMetadata(
  "/sorular",
  "Toptancı Kataloğu ve Fiyat Listesi Hakkında Sorular",
  "Toptancı kataloğu nasıl yapılır, bayilere fiyat listesi nasıl gönderilir, B2B sipariş nedir? Toptancıların en çok sorduğu sorulara kısa yanıtlar.",
);

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: TUM_SORULAR.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function SorularPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />

      <Section tone="white" className="pb-10 sm:pb-14">
        <Container>
          <SectionHeading
            eyebrow="Rehber"
            as="h1"
            title="Toptancıların en çok sorduğu sorular"
            lead="Katalog hazırlama, fiyat listesi gönderme, bayi siparişi ve toptancılık üzerine kısa yanıtlar. eKatalox'un özellikleriyle ilgili sorular için SSS sayfasına bakın."
          />
          <p className="mt-4 text-sm text-brand-muted">
            <Link href="/sss" className="font-semibold text-brand-navy underline-offset-4 hover:underline">
              Ürün ve paketlerle ilgili sorular →
            </Link>
          </p>
        </Container>
      </Section>

      <Section className="pt-0 sm:pt-0">
        <Container className="space-y-14">
          {SORU_GRUPLARI.map((g) => (
            <div key={g.slug} id={g.slug} className="grid gap-6 lg:grid-cols-[1fr_2.2fr] lg:gap-16">
              <h2 className="text-xl font-semibold text-brand-navy lg:sticky lg:top-24 lg:self-start">{g.title}</h2>
              <div className="divide-y divide-brand-line border-y border-brand-line">
                {g.items.map((f) => (
                  <details key={f.q} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left text-base font-semibold text-brand-ink [&::-webkit-details-marker]:hidden">
                      <span>{f.q}</span>
                      <span
                        aria-hidden
                        className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border border-brand-line text-brand-muted transition-transform group-open:rotate-45"
                      >
                        <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M10 4v12M4 10h12" />
                        </svg>
                      </span>
                    </summary>
                    <p className="mt-3 max-w-2xl leading-relaxed text-brand-muted">{f.a}</p>
                    {f.links && f.links.length > 0 ? (
                      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        {f.links.map((l) => (
                          <Link key={l.href} href={l.href} className="font-semibold text-brand-navy underline-offset-4 hover:underline">
                            {l.label} →
                          </Link>
                        ))}
                      </p>
                    ) : null}
                  </details>
                ))}
              </div>
            </div>
          ))}
        </Container>
      </Section>

      <Section tone="navy">
        <Container className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl">
              Kataloğunuzu bugün kurun, bayilere bağlantıyı gönderin.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/75">
              Ücretsiz planla başlayın; Excel listenizi yükleyin, şifreleri verin. Sorunuz olursa telefon ve WhatsApp üzerinden yardımcı oluruz.
            </p>
          </div>
          <div className="flex flex-col gap-4 lg:items-end">
            <ButtonLink href="/basvuru" tone="white" size="lg">
              Ücretsiz başla
            </ButtonLink>
            <a href={SITE.phoneHref} className="font-plex-mono text-lg text-white/85 hover:text-white">
              {SITE.phone}
            </a>
          </div>
        </Container>
      </Section>
    </>
  );
}
