import type { Metadata } from "next";
import { ESNAF_TRIAL_DAYS } from "@/lib/billing/esnaf-plans";
import { SITE } from "@/lib/marketing/site";
import { ButtonLink, CheckList, Container, Eyebrow, Section, SectionHeading } from "@/components/marketing/ui";

// Şirket künyesi (unvan, adres) lib/marketing/site.ts'de dolunca alt bilgide
// çıkar; burada uydurma tarih, sayı ya da isim yazılmaz.
export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "eKatalox mahalle esnafı için komisyonsuz WhatsApp sipariş sistemi kurar. Kurulumu ekibimiz yapar, sipariş doğrudan dükkânın WhatsApp'ına gelir.",
  alternates: { canonical: "/hakkimizda" },
  openGraph: {
    title: "Hakkımızda | eKatalox",
    description: "Mahalle esnafı için komisyonsuz WhatsApp sipariş sistemi kuran ekip.",
    url: `${SITE.url}/hakkimizda`,
  },
};

export default function Page() {
  return (
    <>
      <Section tone="white" className="border-b border-brand-line">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow>Hakkımızda</Eyebrow>
            <h1 className="mt-3 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-brand-navy sm:text-5xl">
              Esnafın telefonunu susturmak için çalışıyoruz.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-brand-muted">
              eKatalox, mahalle marketinden kasaba, manavdan petshopa; dükkânların siparişi telefon yerine WhatsApp’tan
              yazılı almasını sağlar. Komisyon almayız, aracı olmayız; müşteri dükkânın müşterisi olarak kalır.
            </p>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow="Neden"
            title="Sipariş platformları esnafın müşterisini alıyor"
            lead="Her siparişten komisyon kesen uygulamalar dükkânı bir listeye dönüştürür. Biz tersini yapıyoruz: sipariş sayfası dükkânın kendi adresinde, sipariş dükkânın kendi telefonunda."
          />
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              Esnafın derdi teknik değil. Telefonda tarif edilen sipariş, unutulan not, yanlış giden poşet. Bunun için
              karmaşık bir e-ticaret sitesi gerekmiyor; müşterinin telefonundan rafı görüp seçebildiği, siparişin de
              WhatsApp’a PDF olarak düştüğü sade bir sayfa yetiyor.
            </p>
            <p>
              Kurulumu esnafa bırakmıyoruz. Ürünleri fotoğraf ve fiyatıyla biz yüklüyoruz, QR magnetleri biz basıyoruz,
              tema ve teslimat ayarlarını birlikte yapıyoruz. Dükkân sahibi yalnız siparişi hazırlıyor.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="white">
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionHeading eyebrow="Nasıl çalışıyoruz" title="Küçük ekip, doğrudan iletişim" />
          <CheckList
            items={[
              "Kurulum, ürün yükleme ve destek aynı ekipten; aracı yok.",
              `İlk ${ESNAF_TRIAL_DAYS} gün ücretsiz, kart bilgisi istemeyiz.`,
              "Ödeme havale/EFT ile ya da temsilci aracılığıyla; sitede çevrim içi ödeme yok.",
              "Tekel bayilerinde teslimat açmayız; alkol ve tütün internetten satılmaz.",
              "Sitede yalnız gerçek rakam ve gerçek örnek kullanırız.",
            ]}
          />
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow="İletişim"
            title="Bize doğrudan ulaşın"
            lead="Satış ve destek için tek hat. Hafta içi mesai saatlerinde telefonla, her zaman WhatsApp ve e-posta ile."
          />
          <div className="rounded-lg border border-brand-line bg-white p-6">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-brand-muted">Telefon ve WhatsApp</dt>
                <dd className="mt-1">
                  <a href={SITE.phoneHref} className="font-plex-mono text-lg font-medium text-brand-navy">
                    {SITE.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-brand-muted">Satış</dt>
                <dd className="mt-1">
                  <a href={`mailto:${SITE.salesEmail}`} className="font-medium text-brand-ink">
                    {SITE.salesEmail}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-brand-muted">Destek</dt>
                <dd className="mt-1">
                  <a href={`mailto:${SITE.supportEmail}`} className="font-medium text-brand-ink">
                    {SITE.supportEmail}
                  </a>
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/iletisim">İletişim formu</ButtonLink>
              <ButtonLink href="/basvuru" tone="outline">
                Ücretsiz başvurun
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
