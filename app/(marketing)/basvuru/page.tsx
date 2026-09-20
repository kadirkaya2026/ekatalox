import type { Metadata } from "next";
import { SITE } from "@/lib/marketing/site";
import { SignupForm } from "@/components/marketing/signup-form";
import { Container, Eyebrow, Section } from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "Ücretsiz kayıt — Kataloğunuzu kurun",
  description:
    "Toptancılar için ücretsiz online katalog: formu doldurun, kataloğunuz o an açılsın. Kart bilgisi istenmez, süre sınırı yok, komisyon yok.",
  alternates: { canonical: "/basvuru" },
  openGraph: {
    title: "Ücretsiz kayıt | eKatalox",
    description: "Kataloğunuzu 5 dakikada kurun. Kart istenmez.",
    url: `${SITE.url}/basvuru`,
  },
};

type Params = { plan?: string | string[]; sektor?: string | string[] };

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  return (
    <Section tone="white">
      <Container>
        <div className="max-w-3xl">
          <Eyebrow>Ücretsiz kayıt</Eyebrow>
          <h1 className="mt-3 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-brand-navy sm:text-5xl">
            Kataloğunuzu kurun.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-brand-muted">
            Formu doldurun; katalog adresiniz o an açılır, giriş bilgileri e-postanıza gelir. Kart bilgisi istenmez,
            süre sınırı yoktur. Yaklaşık {SITE.setupMinutes} dakika sürer.
          </p>
        </div>
        <div className="mt-10">
          <SignupForm initialPlan={first(params.plan)} initialSector={first(params.sektor)} />
        </div>
      </Container>
    </Section>
  );
}
