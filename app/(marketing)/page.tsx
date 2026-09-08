import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CommissionCalculator } from "@/components/marketing/commission-calculator";
import { PhoneFrame } from "@/components/marketing/phone-frame";
import { ButtonLink, CheckList, Container, Eyebrow, Section, SectionHeading } from "@/components/marketing/ui";
import { ESNAF_PLANS, ESNAF_TRIAL_DAYS, formatTry } from "@/lib/billing/esnaf-plans";
import { SECTORS } from "@/lib/marketing/sectors";
import { SITE } from "@/lib/marketing/site";

// Ana sayfa (8 Eyl 2026 yeniden konumlandırma): mahalle esnafı için
// komisyonsuz WhatsApp sipariş sistemi. Sunucu bileşeni; tek istemci parçası
// komisyon hesaplayıcı. Görseller public/site altındaki gerçek ekran görüntüleri.

export const metadata: Metadata = {
  title: "eKatalox — Mahallenizin siparişi WhatsApp'ınıza gelsin",
  description:
    "Market, tekel, manav, kasap ve petshoplar için komisyonsuz WhatsApp sipariş sistemi. Kurulumu 2 saatte biz yapıyoruz, 1 ay ücretsiz, QR magnetler hediye.",
  alternates: { canonical: "/" },
};

const PROBLEMS = [
  {
    title: "“Hangi üründen, kaç tane?” yok",
    body: "Müşteri ürünü fotoğrafından seçer, adedi kendisi yazar. Telefonda marka ve gramaj tarif etmek biter.",
  },
  {
    title: "Yanlış sipariş yok",
    body: "Sipariş; ürün listesi, adres, telefon ve ödeme şekliyle PDF olarak WhatsApp'ınıza düşer. Sözlü aktarım, unutulan kalem kalmaz.",
  },
  {
    title: "“Nerede kaldı?” araması yok",
    body: "Hazırlanıyor ve yola çıktı bildirimleri tek dokunuşla müşteriye gider. Telefon sizin için çalmaz.",
  },
];

const STEPS = [
  {
    no: "01",
    title: "Müşteri sipariş sayfanızı açar",
    body: "Buzdolabındaki QR magneti okutur ya da adresi yazar. Uygulama indirmez; sayfa tarayıcıda açılır. Sepetini doldurur, eksik kalan ürünler için öneri görür.",
    image: { src: "/site/demo-oneri.png", alt: "Sipariş sayfasında sepetteki ürünlere uygun öneri ekranı" },
  },
  {
    no: "02",
    title: "Adres, telefon ve ödeme şeklini yazar",
    body: "Daha önce sipariş verdiyse bilgileri kendiliğinden dolar. İsterse konumunu ekler, sipariş notu yazar. Teslimat ücreti ve ücretsiz teslimat barajı sizin ayarınıza göre hesaplanır.",
    image: { src: "/site/demo-siparis-bilgileri.png", alt: "Sipariş bilgileri formu: ödeme yöntemi, telefon, ad ve adres" },
  },
  {
    no: "03",
    title: "Sipariş WhatsApp'ınıza PDF olarak gelir",
    body: "Siz hazırlarsınız, panelden “hazırlanıyor” ve “yola çıktı” dersiniz; müşteriye bildirim gider. Tekel bayilerinde teslimat yerine hazırlat akışı çalışır, müşteri dükkândan alır.",
    image: { src: "/site/demo-konum.png", alt: "Adres alanı, konum ekleme seçeneği ve sipariş notu" },
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/ekatalox-logo-rgb-v2.png`,
      telephone: SITE.phone,
      email: SITE.salesEmail,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      name: SITE.name,
      url: SITE.url,
      publisher: { "@id": `${SITE.url}/#organization` },
      inLanguage: "tr",
    },
    {
      "@type": "SoftwareApplication",
      name: SITE.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Market, tekel, manav, kasap, çiçekçi ve petshoplar için komisyonsuz WhatsApp sipariş sistemi. Müşteri ürünleri telefonundan seçer, sipariş adres ve telefonuyla WhatsApp'a PDF olarak gelir. Kurulum eKatalox tarafından yapılır.",
      url: SITE.url,
      inLanguage: "tr",
      offers: ESNAF_PLANS.map((p) => ({
        "@type": "Offer",
        name: `${p.name} paketi (yıllık)`,
        price: String(p.yearlyPrice),
        priceCurrency: "TRY",
        description: `${ESNAF_TRIAL_DAYS} gün ücretsiz deneme, komisyon yok`,
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      {/* 1. Hero */}
      <Section tone="white" className="pb-0 sm:pb-0">
        <Container className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div>
            <Eyebrow>Market, tekel, manav, kasap ve petshoplar için</Eyebrow>
            <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.025em] text-brand-navy sm:text-5xl lg:text-[3.5rem]">
              Mahallenizin siparişi WhatsApp&apos;ınıza gelsin.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-brand-muted">
              Müşteriniz dükkânınızı telefonundan gezsin, sepetini doldursun; sipariş adresiyle ve telefonuyla yazılı
              gelsin. Komisyon yok, aracı yok, müşteri sizin.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/basvuru" size="lg">
                Ücretsiz başvur
              </ButtonLink>
              <ButtonLink href={SITE.demoUrl} tone="outline" size="lg" external>
                Demo mağazayı aç
              </ButtonLink>
            </div>
            <p className="mt-6 font-plex-mono text-sm text-brand-muted">
              {SITE.setupHours} saatte kurulum · 1 ay ücretsiz · komisyon yok
            </p>
          </div>
          <div className="pb-8 lg:pb-0">
            <PhoneFrame src="/site/demo-market-iphone.png" alt="Demo market sipariş sayfasının iPhone ekran görüntüsü" priority />
          </div>
        </Container>
        <div className="mt-16 border-b border-brand-line" />
      </Section>

      {/* 2. Komisyon hesaplayıcı */}
      <Section id="komisyon">
        <Container>
          <SectionHeading
            eyebrow="Komisyon hesabı"
            title="Sipariş başına komisyon mu, yılda bir sabit ücret mi?"
            lead="Aylık sipariş sayınızı ve ortalama sepetinizi girin. Ödediğiniz komisyon oranını kendiniz belirleyin; sonucu eKatalox'un yıllık sabit ücretiyle karşılaştırın."
          />
          <div className="mt-10">
            <CommissionCalculator />
          </div>
        </Container>
      </Section>

      {/* 3. Üç dert, üç çözüm */}
      <Section tone="white">
        <Container>
          <SectionHeading
            eyebrow="Üç dert, üç çözüm"
            title="Telefonla sipariş almanın üç derdi var. Üçü de biter."
          />
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {PROBLEMS.map((p, i) => (
              <div key={p.title} className="border-t-2 border-brand-green pt-5">
                <span className="font-plex-mono text-sm text-brand-muted">0{i + 1}</span>
                <h3 className="mt-2 text-xl font-semibold text-brand-navy">{p.title}</h3>
                <p className="mt-3 leading-relaxed text-brand-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 4. Nasıl çalışır */}
      <Section id="nasil-calisir">
        <Container>
          <SectionHeading
            eyebrow="Nasıl çalışır"
            title="Müşteri seçer, siz hazırlarsınız. Arada telefon yok."
            lead="Aşağıdaki ekranlar demo mağazamızdan alınmış gerçek ekran görüntüleridir."
          />
          <ol className="mt-12 space-y-16">
            {STEPS.map((s, i) => (
              <li
                key={s.no}
                className={`grid items-center gap-8 md:grid-cols-2 md:gap-16 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
              >
                <div>
                  <span className="font-plex-mono text-sm font-medium text-brand-green">{s.no}</span>
                  <h3 className="mt-2 text-2xl font-semibold text-brand-navy">{s.title}</h3>
                  <p className="mt-4 text-lg leading-relaxed text-brand-muted">{s.body}</p>
                </div>
                <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl border border-brand-line bg-[#121212]">
                  <Image
                    src={s.image.src}
                    alt={s.image.alt}
                    width={780}
                    height={1688}
                    sizes="(min-width: 768px) 300px, 80vw"
                    className="h-auto w-full"
                  />
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-14 rounded-lg border border-brand-line bg-white p-6 sm:p-8">
            <Eyebrow>Sipariş nereden gelir</Eyebrow>
            <h3 className="mt-2 text-xl font-semibold text-brand-navy">QR magnet: müşterinin buzdolabında, sizin adresiniz</h3>
            <p className="mt-3 max-w-3xl leading-relaxed text-brand-muted">
              Her müşteriye verdiğiniz buzdolabı magnetinde size özel bir QR kod bulunur. Müşteri kodu okutur, doğrudan
              sipariş sayfanıza gelir. Magnetler eKatalox tarafından basılır ve kargoyla size ulaşır; Esnaf paketinde 100,
              Esnaf Plus paketinde 300 adet hediyedir.
            </p>
            <Link href="/magnet" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green hover:underline">
              Magnet programını inceleyin <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </Section>

      {/* 5. Kimler için */}
      <Section tone="white">
        <Container>
          <SectionHeading
            eyebrow="Kimler için"
            title="Mahallede sipariş alan her dükkân için"
            lead="Sektörünüze göre hazırlanmış ürün düzeni ve sipariş akışıyla başlarsınız."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SECTORS.map((s) => (
              <Link
                key={s.slug}
                href={`/${s.slug}`}
                className="group flex flex-col rounded-lg border border-brand-line bg-white p-5 transition-colors hover:border-brand-navy"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-green">{s.label}</span>
                <span className="mt-3 text-balance text-lg font-semibold leading-snug text-brand-navy">{s.headline}</span>
                <span className="mt-auto flex items-center gap-1 pt-5 text-sm font-medium text-brand-muted group-hover:text-brand-navy">
                  İncele <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* 6. Paketler */}
      <Section id="paketler">
        <Container>
          <SectionHeading
            eyebrow="Paketler"
            title="İki paket, sabit ücret, komisyon yok"
            lead={`İlk ${ESNAF_TRIAL_DAYS} gün ücretsiz; kart bilgisi istenmez. Yıllık ödemede iki paket de daha uygundur.`}
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {ESNAF_PLANS.map((plan) => (
              <div
                key={plan.slug}
                className={`flex flex-col rounded-lg border bg-white p-6 sm:p-8 ${plan.featured ? "border-brand-navy" : "border-brand-line"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-2xl font-semibold text-brand-navy">{plan.name}</h3>
                  {plan.featured ? (
                    <span className="rounded-full bg-brand-navy-soft px-3 py-1 text-xs font-semibold text-brand-navy">Önerilen</span>
                  ) : null}
                </div>
                <p className="mt-1 text-brand-muted">{plan.tagline}</p>
                <div className="mt-6 flex flex-wrap items-baseline gap-x-2">
                  <span className="font-plex-mono text-4xl font-medium tabular-nums text-brand-navy">{formatTry(plan.yearlyPrice)}</span>
                  <span className="text-sm text-brand-muted">/ yıl</span>
                </div>
                <p className="mt-1 font-plex-mono text-sm tabular-nums text-brand-muted">
                  ya da {formatTry(plan.monthlyPrice)} / ay
                </p>
                <CheckList items={plan.features.slice(0, 4)} className="mt-6 text-[15px]" />
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href="/basvuru" tone={plan.featured ? "primary" : "navy"}>
                    Ücretsiz başla
                  </ButtonLink>
                  <ButtonLink href="/fiyatlandirma" tone="outline">
                    Tüm özellikler
                  </ButtonLink>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 7. Son çağrı */}
      <Section tone="navy">
        <Container className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl">
              Kurulumu {SITE.setupHours} saatte yapalım, bugün sipariş almaya başlayın.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">
              Başvuru 5 dakika sürer. Ürünlerinizi biz yükleriz, magnetleriniz kargoya verilir, ilk siparişiniz
              WhatsApp&apos;ınıza düşer.
            </p>
          </div>
          <div className="flex flex-col gap-4 lg:items-end">
            <ButtonLink href="/basvuru" tone="white" size="lg">
              Ücretsiz başvur
            </ButtonLink>
            <a href={SITE.phoneHref} className="font-plex-mono text-lg text-white/85 hover:text-white">
              {SITE.phone}
            </a>
          </div>
        </Container>
      </Section>
    </>
  );
}
