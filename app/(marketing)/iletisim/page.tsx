import type { Metadata } from "next";
import { SITE } from "@/lib/marketing/site";
import { ContactForm } from "@/components/marketing/contact-form";
import { ButtonLink, Container, Eyebrow, Section } from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "İletişim ve demo talebi",
  description:
    "Demo, fiyat teklifi ya da destek için eKatalox ekibine ulaşın. Telefon, WhatsApp ve e-posta; iletişim formuna bir iş günü içinde dönüş.",
  alternates: { canonical: "/iletisim" },
  openGraph: {
    title: "İletişim | eKatalox",
    description: "Demo, teklif ve destek için bize ulaşın.",
    url: `${SITE.url}/iletisim`,
  },
};

const DEPARTMENTS = [
  { name: "Satış", email: SITE.salesEmail, desc: "Demo, paket seçimi, toptancı teklifi" },
  { name: "Destek", email: SITE.supportEmail, desc: "Panel, sipariş akışı, teknik sorun" },
  { name: "Kurumsal", email: "kurumsal@ekatalox.com", desc: "Anlaşma, ortaklık, basın" },
];

type Params = { konu?: string | string[] };

export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const { konu } = await searchParams;
  const subject = Array.isArray(konu) ? konu[0] : konu;
  return (
    <>
      <Section tone="white" className="border-b border-brand-line">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow>İletişim</Eyebrow>
            <h1 className="mt-3 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-brand-navy sm:text-5xl">
              Konuşalım.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-brand-muted">
              Demo, fiyat teklifi ya da destek. Telefonla hemen, formla bir iş günü içinde.
            </p>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div className="space-y-8">
            <div className="rounded-lg border border-brand-line bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-muted">Telefon ve WhatsApp</p>
              <a href={SITE.phoneHref} className="mt-2 block font-plex-mono text-2xl font-medium text-brand-navy">
                {SITE.phone}
              </a>
              <p className="mt-1 text-sm text-brand-muted">Hafta içi 09:00 - 18:00 telefonla; WhatsApp her zaman.</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <ButtonLink href={SITE.whatsappHref} external>
                  WhatsApp’tan yazın
                </ButtonLink>
                <ButtonLink href={SITE.demoUrl} tone="outline" external>
                  Örnek mağazayı açın
                </ButtonLink>
              </div>
            </div>

            <ul className="divide-y divide-brand-line rounded-lg border border-brand-line bg-white">
              {DEPARTMENTS.map((d) => (
                <li key={d.name} className="px-6 py-4">
                  <p className="font-semibold text-brand-navy">{d.name}</p>
                  <p className="text-sm text-brand-muted">{d.desc}</p>
                  <a href={`mailto:${d.email}`} className="mt-1 inline-block text-sm font-medium text-brand-ink underline underline-offset-4">
                    {d.email}
                  </a>
                </li>
              ))}
            </ul>

            <p className="text-sm leading-relaxed text-brand-muted">
              Başvurmaya hazırsanız formu atlayın:{" "}
              <a href="/basvuru" className="font-semibold text-brand-navy underline underline-offset-4">
                ücretsiz başvuru sayfası
              </a>
              .
            </p>
          </div>

          <ContactForm initialSubject={subject} />
        </Container>
      </Section>
    </>
  );
}
