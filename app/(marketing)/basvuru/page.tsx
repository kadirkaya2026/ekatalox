import { marketingMetadata } from "@/lib/marketing/metadata";
import { SignupForm } from "@/components/marketing/signup-form";
import { Container } from "@/components/marketing/ui";
import { Accent, CustomerMarquee, PageHero } from "@/components/marketing/home-v2/page-kit";

export const metadata = marketingMetadata(
  "/basvuru",
  "Ücretsiz Online Katalog Oluşturun",
  "Ücretsiz hesabınızı oluşturun, ürünlerinizi ekleyip kataloğunuzu bayilerinizle paylaşın. Ücretsiz planda 250 ürün; kart bilgisi istenmez.",
);

type Params = { tema?: string | string[]; plan?: string | string[]; sektor?: string | string[] };

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

const POINTS = ["250 ürünle ücretsiz", "Kart istenmez", "Sipariş komisyonu yok", "Ürünlerinizi biz yükleriz"];

export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  return (
    <>
      <PageHero
        eyebrow="Ücretsiz kayıt"
        title={<>Kataloğunuzu <Accent>bugün açın.</Accent></>}
        lead="Üç kısa adım: işletme bilgileri, WhatsApp numarası, giriş bilgileri. Bitince katalog adresiniz hazır, bayilerinize şifreyi gönderirsiniz."
        className="pb-6 sm:pb-8"
      >
        <ul className="mt-8 flex flex-wrap justify-center gap-2">
          {POINTS.map((p) => (
            <li key={p} className="rounded-full border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-navy">
              ✓ {p}
            </li>
          ))}
        </ul>
      </PageHero>
      <section className="bg-white pb-16 sm:pb-24">
        <Container>
          <div className="mx-auto max-w-5xl rounded-[32px] border border-brand-line bg-white p-5 shadow-[0_40px_80px_-48px_rgba(18,40,74,0.45)] sm:p-10">
            <SignupForm initialTheme={first(params.tema)} initialPlan={first(params.plan)} initialSector={first(params.sektor)} />
          </div>
        </Container>
      </section>
      <CustomerMarquee />
    </>
  );
}
