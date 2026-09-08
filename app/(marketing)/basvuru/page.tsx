import type { Metadata } from "next";
import { ESNAF_TRIAL_DAYS } from "@/lib/billing/esnaf-plans";
import { SITE } from "@/lib/marketing/site";
import { SignupForm } from "@/components/marketing/signup-form";
import { Container, Eyebrow, Section } from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "Ücretsiz başvuru — Mağazanızı kuralım",
  description: `Dükkânınız için WhatsApp sipariş sayfası: formu doldurun, ürünlerinizi biz yükleyelim. İlk ${ESNAF_TRIAL_DAYS} gün ücretsiz, kart bilgisi istenmez, komisyon yok.`,
  alternates: { canonical: "/basvuru" },
  openGraph: {
    title: "Ücretsiz başvuru | eKatalox",
    description: `Mağazanızı kuralım. İlk ${ESNAF_TRIAL_DAYS} gün ücretsiz, kart istenmez.`,
    url: `${SITE.url}/basvuru`,
  },
};

type Params = { plan?: string | string[]; period?: string | string[]; sektor?: string | string[] };

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  return (
    <Section tone="white">
      <Container>
        <div className="max-w-3xl">
          <Eyebrow>Başvuru</Eyebrow>
          <h1 className="mt-3 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-brand-navy sm:text-5xl">
            Mağazanızı kuralım.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-brand-muted">
            Formu doldurun; adresiniz hemen açılır, ürünlerinizi ekibimiz yükler. İlk {ESNAF_TRIAL_DAYS} gün ücretsiz, kart bilgisi
            istenmez.
          </p>
        </div>
        <div className="mt-10">
          <SignupForm initialPlan={first(params.plan)} initialPeriod={first(params.period)} initialSector={first(params.sektor)} />
        </div>
      </Container>
    </Section>
  );
}
