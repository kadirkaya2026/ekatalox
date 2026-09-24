import type { Metadata } from "next";
import { PhoneFrame } from "@/components/marketing/phone-frame";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { SITE } from "@/lib/marketing/site";

// Gerçek referans (firma adı, alıntı, fotoğraf) gelene kadar bu sayfa
// dizinlenmez ve menüde yer almaz; canlı örnek mağazayı gösterir.
export const metadata: Metadata = {
  title: "Canlı örnek katalog",
  description: "eKatalox ile kurulmuş örnek bir toptan katalog.",
  robots: { index: false, follow: false },
};

export default function CustomersPage() {
  return (
    <>
      <Section tone="white">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Canlı örnek" title="Bayinizin göreceği ekran tam olarak bu." lead={`Demo kataloğu telefonunuzda açın (şifre ${SITE.demoPassword}), ürünlere bakın, sepete atın. Sizin kataloğunuz kendi logonuz ve ürünlerinizle aynı şekilde kurulur.`} />
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={SITE.demoEnterUrl} external>Demo kataloğu aç</ButtonLink>
              <ButtonLink href="/basvuru" tone="outline">Ücretsiz kur</ButtonLink>
            </div>
          </div>
          <PhoneFrame src="/site/toptan-hero-iphone-v3.png" alt="Örnek toptan katalog, telefon görünümü" priority />
        </Container>
      </Section>
      <Section>
        <Container>
          <SectionHeading title="Sipariş akışından iki ekran" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {[
              { src: "/site/toptan-giris.png", alt: "Şifreli bayi girişi", title: "Bayi girişi", text: "Bayi şifreyi yazar, kendi fiyat listesiyle kataloğa girer." },
              { src: "/site/toptan-sepet.png", alt: "Sepet ve sipariş özeti", title: "Sepet ve sipariş", text: "Adet ve koli seçimi, cari adı, not; sipariş size PDF olarak düşer." },
            ].map((s) => (
              <figure key={s.src} className="rounded-lg border border-brand-line bg-white p-5">
                <PhoneFrame src={s.src} alt={s.alt} className="w-56 sm:w-56" />
                <figcaption className="mt-4">
                  <p className="font-semibold">{s.title}</p>
                  <p className="mt-1 text-sm text-brand-muted">{s.text}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
