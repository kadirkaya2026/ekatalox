import type { Metadata } from "next";
import Image from "next/image";
import { PhoneFrame } from "@/components/marketing/phone-frame";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { SITE } from "@/lib/marketing/site";

// Gerçek referans (dükkân adı, alıntı, fotoğraf) gelene kadar bu sayfa
// dizinlenmez ve menüde yer almaz; canlı örnek mağazayı gösterir.
export const metadata: Metadata = {
  title: "Canlı örnek mağaza",
  description: "eKatalox ile kurulmuş örnek bir market sipariş sayfası.",
  robots: { index: false, follow: false },
};

export default function CustomersPage() {
  return (
    <>
      <Section tone="white">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Canlı örnek" title="Müşterinizin göreceği ekran tam olarak bu." lead="Örnek mağazayı telefonunuzda açın, ürünlere bakın, sepete atın. Sizin mağazanız kendi logonuz ve ürünlerinizle aynı şekilde kurulur." />
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={SITE.demoUrl} external>Demo mağazayı aç</ButtonLink>
              <ButtonLink href="/basvuru" tone="outline">Ücretsiz başvur</ButtonLink>
            </div>
          </div>
          <PhoneFrame src="/site/demo-market-iphone.png" alt="Örnek market mağazası, telefon görünümü" priority />
        </Container>
      </Section>
      <Section>
        <Container>
          <SectionHeading title="Sipariş akışından iki ekran" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {[
              { src: "/site/demo-oneri.png", alt: "Unuttunuz mu? öneri ekranı", title: "Sepette hatırlatma", text: "Sepete göre yanına iyi gidecek ürünler önerilir; sepet tutarı büyür." },
              { src: "/site/demo-siparis-bilgileri.png", alt: "Sipariş bilgileri formu", title: "Sipariş bilgileri", text: "Ödeme yöntemi, telefon, ad ve adres alınır; sipariş size PDF olarak düşer." },
            ].map((s) => (
              <figure key={s.src} className="rounded-lg border border-brand-line bg-white p-5">
                <div className="mx-auto w-56 overflow-hidden rounded-xl bg-black">
                  <Image src={s.src} alt={s.alt} width={780} height={1688} className="h-auto w-full" />
                </div>
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
