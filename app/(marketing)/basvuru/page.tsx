import type { Metadata } from "next";
import { SITE } from "@/lib/marketing/site";
import { SignupForm } from "@/components/marketing/signup-form";
import { Container, Section } from "@/components/marketing/ui";

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
    <Section tone="white" className="pt-10 sm:pt-12">
      <Container>
        <h1 className="sr-only">Ücretsiz kayıt: kataloğunuzu kurun</h1>
        <SignupForm initialPlan={first(params.plan)} initialSector={first(params.sektor)} />
      </Container>
    </Section>
  );
}
