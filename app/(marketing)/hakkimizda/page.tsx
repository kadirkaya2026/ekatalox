import { marketingMetadata } from "@/lib/marketing/metadata";

import { SITE } from "@/lib/marketing/site";
import { ButtonLink, CheckList, Container, Eyebrow, Section, SectionHeading } from "@/components/marketing/ui";
import { Accent, CustomerMarquee, PageHero } from "@/components/marketing/home-v2/page-kit";

export const metadata = marketingMetadata(
  "/hakkimizda",
  "Hakkımızda",
  "eKatalox, toptancı ve üreticiler için şifreli online katalog ve WhatsApp sipariş sistemi sunar. Ürünler, bayi fiyat listeleri ve siparişler tek yerde.",
);

// Şirket künyesi (unvan, adres) lib/marketing/site.ts'de dolunca alt bilgide
// çıkar; burada uydurma tarih, sayı ya da isim yazılmaz.

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Hakkımızda"
        title={<>Toptancının kataloğunu <Accent>PDF&apos;ten kurtarmak</Accent> için çalışıyoruz.</>}
        lead="eKatalox, toptancı, üretici ve distribütörlerin bayilerine gönderdiği PDF kataloğu şifreli, canlı bir sipariş sayfasına çevirir. Komisyon almayız, aracı olmayız; bayi sizin bayiniz olarak kalır, sipariş sizin WhatsApp'ınıza gelir."
      />
      <CustomerMarquee />

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
          <div className="rounded-[24px] border border-brand-line bg-white p-6 shadow-[0_24px_50px_-36px_rgba(18,40,74,0.4)] sm:p-8">
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
