import type { Metadata } from "next";
import { SITE } from "@/lib/marketing/site";
import { ButtonLink, CheckList, Container, Eyebrow, Section, SectionHeading } from "@/components/marketing/ui";

// Şirket künyesi (unvan, adres) lib/marketing/site.ts'de dolunca alt bilgide
// çıkar; burada uydurma tarih, sayı ya da isim yazılmaz.
export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "eKatalox, toptancı ve üreticilerin PDF kataloğunu şifreli online kataloğa çevirir. Bayi kendi fiyatını görür, sipariş WhatsApp'a PDF olarak gelir. Ücretsiz plan, komisyon yok.",
  alternates: { canonical: "/hakkimizda" },
  openGraph: {
    title: "Hakkımızda | eKatalox",
    description: "Toptancılar için ücretsiz online katalog ve WhatsApp sipariş sistemi kuran ekip.",
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
              Toptancının kataloğunu PDF&apos;ten kurtarmak için çalışıyoruz.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-brand-muted">
              eKatalox, toptancı, üretici ve distribütörlerin bayilerine gönderdiği PDF kataloğu şifreli, canlı bir sipariş
              sayfasına çevirir. Komisyon almayız, aracı olmayız; bayi sizin bayiniz olarak kalır, sipariş sizin
              WhatsApp&apos;ınıza gelir.
            </p>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow="Neden"
            title="PDF katalog her fiyat değişiminde eskiyor"
            lead="Yüzlerce bayiye yeni PDF atmak, kimin hangi listeden baktığını bilmemek, sesli mesajdan sipariş çözmek. Biz tersini yapıyoruz: tek katalog, şifreye göre fiyat, sipariş yazılı."
          />
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              Toptancının derdi teknik değil. Bayi başka, perakende başka fiyat; koli içi adet; eski listeden gelen
              sipariş. Bunun için pahalı bir B2B sitesi gerekmiyor; bayinin telefonundan şifreyle girip kendi fiyatını
              gördüğü, siparişin WhatsApp&apos;a PDF olarak düştüğü sade bir katalog yetiyor.
            </p>
            <p>
              Bu yüzden kataloğu ücretsiz veriyoruz. Ürünlerini yükleyen herkes bugün yayına girsin; büyüyünce reklamsız
              paket alsın. Kullanmayan kimseden para istemiyoruz.
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
              "Ücretsiz plan süresiz; kart bilgisi istemeyiz.",
              "Ödeme havale/EFT ile ya da temsilci aracılığıyla; sitede çevrim içi ödeme yok.",
              "Ücretsiz planda yalnız kendi tanıtımımızı gösteririz; üçüncü taraf reklamı almayız.",
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
                Ücretsiz kurun
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
