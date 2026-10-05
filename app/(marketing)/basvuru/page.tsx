import { marketingMetadata } from "@/lib/marketing/metadata";

import { SignupForm } from "@/components/marketing/signup-form";
import { Container, Section } from "@/components/marketing/ui";

export const metadata = marketingMetadata(
  "/basvuru",
  "Ücretsiz Online Katalog Oluşturun",
  "Ücretsiz hesabınızı oluşturun, ürünlerinizi ekleyip kataloğunuzu bayilerinizle paylaşın. Ücretsiz planda 250 ürün; kart bilgisi istenmez.",
);

type Params = { tema?: string | string[]; plan?: string | string[]; sektor?: string | string[] };

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  return (
    <Section tone="white" className="pt-10 sm:pt-12">
      <Container>
        <h1 className="sr-only">Ücretsiz kayıt: kataloğunuzu kurun</h1>
        <SignupForm initialTheme={first(params.tema)} initialPlan={first(params.plan)} initialSector={first(params.sektor)} />
      </Container>
    </Section>
  );
}
