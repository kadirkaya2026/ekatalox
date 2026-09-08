import type { Metadata } from "next";
import Link from "next/link";
import { ESNAF_TRIAL_DAYS, type BillingPeriod } from "@/lib/billing/esnaf-plans";
import { SITE } from "@/lib/marketing/site";
import { PricingTable } from "@/components/marketing/pricing-table";
import { ButtonLink, Container, Eyebrow, Section, SectionHeading } from "@/components/marketing/ui";

export const metadata: Metadata = {
  title: "Fiyatlandırma — Esnaf ve Esnaf Plus paketleri",
  description:
    "Komisyonsuz WhatsApp sipariş sistemi için iki paket: Esnaf ve Esnaf Plus. İlk 30 gün ücretsiz, kart bilgisi istenmez, kurulumu biz yapıyoruz. Fiyatlara KDV dahil değildir.",
  alternates: { canonical: "/fiyatlandirma" },
  openGraph: {
    title: "Fiyatlandırma | eKatalox",
    description: "Esnaf ve Esnaf Plus paketleri. Komisyon yok, 30 gün ücretsiz, kart istenmez.",
    url: `${SITE.url}/fiyatlandirma`,
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Fiyatlara KDV dahil mi?",
    a: "Hayır. Sayfadaki tüm tutarlar KDV hariçtir; faturada KDV ayrıca gösterilir.",
  },
  {
    q: "Aylık ve yıllık ödeme arasındaki fark ne?",
    a: "Yıllık ödemede on iki aylık tutara göre yaklaşık %40 daha az ödersiniz ve yıl boyunca fiyat sabit kalır. Aylık ödemede taahhüt yoktur.",
  },
  {
    q: "Ödemeyi nasıl yapıyorum?",
    a: "Havale/EFT ile ya da temsilcimiz aracılığıyla kartla. Sitede çevrim içi ödeme ekranı yoktur; deneme süresi bitmeden temsilciniz sizinle iletişime geçer.",
  },
  {
    q: "Deneme süresinde kart bilgisi isteniyor mu?",
    a: `Hayır. İlk ${ESNAF_TRIAL_DAYS} gün ücretsizdir, kart bilgisi istenmez. Süre sonunda devam etmezseniz herhangi bir ücret çıkmaz.`,
  },
  {
    q: "İptal etmek istersem ne olur?",
    a: "Aboneliğinizi dilediğiniz zaman iptal edebilirsiniz. Aylık ödemede kalan günler için ücret alınmaz; yıllık ödemede kalan dönem için iade yapılmaz. İptal talebini destek adresimize yazmanız yeterli.",
  },
  {
    q: "Komisyon ya da sipariş başına ücret var mı?",
    a: "Yok. Sipariş sayınız ne olursa olsun yalnız paket bedelini ödersiniz; sipariş doğrudan sizin WhatsApp numaranıza gelir.",
  },
  {
    q: "Toptancıyım, hangi paketi seçmeliyim?",
    a: "Bu paketler mahalle esnafı içindir. Toptancı ve distribütörler için bayi bazlı fiyat listeli B2B akışımız ayrı teklif edilir; iletişim sayfasından temsilci isteyin.",
  },
];

function parsePeriod(value: string | string[] | undefined): BillingPeriod {
  return value === "monthly" ? "monthly" : "yearly";
}

export default async function Page({ searchParams }: { searchParams: Promise<{ period?: string | string[] }> }) {
  const { period } = await searchParams;
  return (
    <>
      <Section tone="white" className="border-b border-brand-line">
        <Container>
          <SectionHeading
            eyebrow="Fiyatlandırma"
            title="Komisyon yok. İki paket, net fiyat."
            lead={`İlk ${ESNAF_TRIAL_DAYS} gün ücretsiz, kart bilgisi istenmez. Ürünlerinizi biz yükleriz, siparişi siz hazırlarsınız.`}
          />
          <div className="mt-10">
            <PricingTable initialPeriod={parsePeriod(period)} />
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <SectionHeading eyebrow="Sık sorulanlar" title="Ödeme ve paketler hakkında" />
          <dl className="divide-y divide-brand-line">
            {FAQ.map((item) => (
              <div key={item.q} className="py-5 first:pt-0">
                <dt className="text-base font-semibold text-brand-navy">{item.q}</dt>
                <dd className="mt-2 text-base leading-relaxed text-brand-muted">
                  {item.a}
                  {item.q.startsWith("Toptancıyım") ? (
                    <>
                      {" "}
                      <Link href="/iletisim" className="font-semibold text-brand-navy underline underline-offset-4">
                        Teklif isteyin
                      </Link>
                      .
                    </>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <Section tone="white" className="border-t border-brand-line">
        <Container className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Eyebrow>Karar veremediniz mi</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-brand-navy">
              Temsilcimiz dükkânınıza göre paketi anlatsın.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-brand-muted">
              Ürün sayınızı ve sipariş düzeninizi dinler, gerekirse denemeyi birlikte başlatırız.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <ButtonLink href={SITE.whatsappHref} external>
              WhatsApp’tan yazın
            </ButtonLink>
            <ButtonLink href={SITE.phoneHref} tone="outline" external>
              {SITE.phone}
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
