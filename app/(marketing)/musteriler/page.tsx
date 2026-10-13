import type { Metadata } from "next";
import { PhoneFrame } from "@/components/marketing/phone-frame";
import { ButtonLink, Container } from "@/components/marketing/ui";
import { Accent, ClosingCta, CustomerMarquee, GradientPanelLite, PageHero } from "@/components/marketing/home-v2/page-kit";
import { SITE } from "@/lib/marketing/site";

// Gerçek referans (firma adı, alıntı, fotoğraf) gelene kadar bu sayfa
// dizinlenmez ve menüde yer almaz; canlı örnek mağazayı gösterir.
export const metadata: Metadata = {
  title: "Canlı örnek katalog",
  description: "eKatalox ile kurulmuş örnek bir toptan katalog.",
  robots: { index: false, follow: false },
};

const SCREENS = [
  { src: "/site/toptan-giris-v2.png", alt: "Şifreli bayi girişi", title: "Bayi girişi", text: "Bayi şifreyi yazar, kendi fiyat listesiyle kataloğa girer." },
  { src: "/site/toptan-katalog-v2.png", alt: "Örnek toptan katalog", title: "Katalog", text: "Kategoriler, ürün kartları ve bayinin kendi fiyatı." },
  { src: "/site/toptan-sepet-v2.png", alt: "Sepet ve sipariş özeti", title: "Sepet ve sipariş", text: "Adet ve koli seçimi, cari adı, not; sipariş PDF fiş olarak WhatsApp'a gider." },
];

export default function CustomersPage() {
  return (
    <>
      <PageHero
        eyebrow="Canlı örnek"
        title={<>Bayinizin göreceği ekran <Accent>tam olarak bu.</Accent></>}
        lead="Demo kataloğu telefonunuzda açın, ürünlere bakın, sepete atın. Sizin kataloğunuz kendi logonuz ve ürünlerinizle aynı şekilde kurulur."
        actions={<><ButtonLink href={SITE.demoUrl} tone="navy" size="lg" external>Demo kataloğu aç</ButtonLink><ButtonLink href="/basvuru" tone="outline" size="lg">Ücretsiz kur</ButtonLink></>}
      />
      <section className="bg-white pb-8">
        <Container>
          <div className="grid gap-6 sm:grid-cols-3">
            {SCREENS.map((s, i) => (
              <GradientPanelLite key={s.src} index={i}>
                <PhoneFrame src={s.src} alt={s.alt} className="w-[200px] sm:w-[200px]" />
                <p className="mt-6 text-xl font-extrabold tracking-[-0.02em] text-brand-navy">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-brand-navy/70">{s.text}</p>
              </GradientPanelLite>
            ))}
          </div>
        </Container>
      </section>
      <CustomerMarquee />
      <ClosingCta title="Aynısını kendi ürünlerinizle kurun." lead="250 ürünle ücretsiz, kart istenmez, komisyon yok." index={2} />
    </>
  );
}
