import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, KeyRound, MessageCircle, UploadCloud } from "lucide-react";
import { HeroComparison } from "@/components/marketing/hero-comparison";
import { PlanCards } from "@/components/marketing/plan-cards";
import { ButtonLink, Container, Eyebrow, Section, SectionHeading } from "@/components/marketing/ui";
import { TOPTAN_PLANS } from "@/lib/billing/toptan-plans";
import { SITE } from "@/lib/marketing/site";

// Ana sayfa (21 Eyl 2026 koyu tema yeniden tasarımı): PDF katalog yaptıran
// her toptancı/üretici için ücretsiz online katalog + WhatsApp sipariş.
// Koyu/yeşil SaaS görünümü — kullanıcının Gemini'ye çizdirdiği örneğe göre.
// Sunucu bileşeni.

export const metadata: Metadata = {
  title: { absolute: "eKatalox — Toptancılar için ücretsiz online katalog ve WhatsApp sipariş" },
  description:
    "PDF kataloğunuzu canlı bir sipariş sayfasına çevirin. Bayileriniz şifreyle girsin, kendi fiyat listesini görsün, WhatsApp'tan sipariş versin. Ücretsiz plan, kart istenmez, 5 dakikada kurulum.",
  alternates: { canonical: "/" },
};

const PROBLEMS = [
  {
    title: "“Fiyat değişti, PDF'i yeniden yolla” yok",
    body: "Fiyatı panelden değiştirirsiniz, bayi o an güncel fiyatı görür. Yüzlerce kişiye yeni PDF atmak, eski listeden sipariş almak biter.",
  },
  {
    title: "“Bayiye başka, perakendeye başka fiyat” derdi yok",
    body: "Her müşteri grubuna ayrı şifre, ayrı fiyat listesi. Kim hangi şifreyle girdiyse onun fiyatını görür; kimse başkasının fiyatını görmez.",
  },
  {
    title: "“Şundan 3 koli, bundan 5 paket” karmaşası yok",
    body: "Bayi sepetini doldurur, sipariş ürün kodu, adet, koli ve tutarla PDF olarak WhatsApp'ınıza düşer. Sesli mesajdan sipariş çözmek biter.",
  },
];

const STEPS = [
  {
    no: "01",
    icon: UploadCloud,
    title: "Ürünlerinizi yükleyin",
    body: "Excel'den, fotoğraftan ya da tek tek. Ürün kodu, koli içi adet, varyant ve fiyat listeleri.",
  },
  {
    no: "02",
    icon: KeyRound,
    title: "Bayilerinize şifre verin",
    body: "firmaniz.ekatalox.com adresini ve şifreyi WhatsApp'tan paylaşın; bayi kendi fiyat listesiyle girer.",
  },
  {
    no: "03",
    icon: MessageCircle,
    title: "Sipariş WhatsApp'a gelir",
    body: "Bayi sepetini doldurur, gönderir. Sipariş fişi PDF olarak WhatsApp numaranıza düşer.",
  },
];

const FEATURES = [
  { title: "Şifreli katalog", body: "Fiyatlar herkese açık değil. Bayi şifresiyle girer; şifresiz ziyaretçi isterseniz yalnız ürünleri görür." },
  { title: "Üç fiyat listesi", body: "Bayi, perakende, özel müşteri. Her şifre ayrı listeye açılır, aynı katalog üç fiyatla çalışır." },
  { title: "Koli, paket, adet", body: "Ürün başına koli içi adet ve varyant (renk, beden, model). Bayi koli seçer, tutar kendiliğinden hesaplanır." },
  { title: "WhatsApp'a PDF sipariş", body: "Sipariş fişi PDF olarak WhatsApp'ınıza gelir. Cari adı, telefon, not ve kalemler tek sayfada." },
  { title: "Kampanya ve öne çıkanlar", body: "Banner, kampanya kartı, indirimli ürün ve öne çıkanlar bölümü. Yeni gelen ürünü ilk sırada gösterin." },
  { title: "Bayilere bildirim", body: "Yeni ürün, stok geldi, kampanya başladı. Bildirim açan bayilerin telefonuna anında düşer." },
  { title: "Raporlar", body: "Kim ne zaman girdi, hangi ürünlere baktı, hangi ilden. Bugün kaç sipariş PDF'i oluştu." },
  { title: "Tema ve marka görünümü", body: "Logonuz, renkleriniz. Hazır temalardan seçin, gerçek ürünlerinizle önizleyin." },
];

const SEGMENTS = [
  "Telefon aksesuarı ve elektronik",
  "Gıda ve içecek toptancıları",
  "Tekstil, giyim ve ayakkabı",
  "Hırdavat, nalburiye ve yapı",
  "Kozmetik ve kişisel bakım",
  "Kırtasiye ve oyuncak",
  "Ambalaj ve temizlik",
  "Elektrik ve aydınlatma",
  "Ev, mutfak ve züccaciye",
  "Otomotiv ve yedek parça",
  "Üreticiler ve distribütörler",
];

const FAQ = [
  {
    q: "Ücretsiz plan gerçekten ücretsiz mi?",
    a: "Evet. Kart bilgisi istemeyiz, süre sınırı yoktur. 200 ürüne kadar kataloğunuzu yayınlar, WhatsApp'tan sipariş alırsınız. Karşılığında kataloğunuzda küçük eKatalox reklamları görünür.",
  },
  {
    q: "Reklamlar nerede görünür, bayimi rahatsız eder mi?",
    a: "Sayfanın altında ince bir bant, ürün listesinde arada bir kart ve sipariş fişinin altında bir satır. Rakip ya da üçüncü taraf reklamı değildir, yalnız eKatalox'un kendi tanıtımıdır. Herhangi bir ücretli pakete geçince tamamı kalkar.",
  },
  {
    q: "Ürünleri kim yükler?",
    a: "Siz yükleyebilirsiniz: Excel şablonu, fotoğraf ve panel. Mevcut PDF kataloğunuzu ya da Excel listenizi bize gönderirseniz ilk yüklemeyi biz yaparız.",
  },
  {
    q: "Bayim nasıl girer, uygulama indirmesi gerekir mi?",
    a: "Hayır. firmaniz.ekatalox.com adresini ve şifreyi WhatsApp'tan gönderirsiniz; bayi tarayıcıda açar, şifreyi yazar, sipariş verir. İsterse ana ekranına ekler, uygulama gibi kullanır.",
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
        "Toptancılar, üreticiler ve distribütörler için şifreli online katalog ve WhatsApp sipariş sistemi. Ücretsiz plan; ürünler bir kez yüklenir, bayiler kendi fiyat listesiyle girer, sipariş PDF olarak WhatsApp'a gelir.",
      url: SITE.url,
      inLanguage: "tr",
      offers: TOPTAN_PLANS.map((p) => ({
        "@type": "Offer",
        name: p.yearlyPrice ? `${p.name} paketi (yıllık)` : `${p.name} plan`,
        price: String(p.yearlyPrice),
        priceCurrency: "TRY",
        description: p.ads ? "Ücretsiz, eKatalox reklamlı, kart istenmez" : "Yıllık, KDV hariç, reklamsız",
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      {/* 1. Hero — koyu zemin */}
      <Section tone="navy" glow className="pb-14 pt-16 sm:pb-20 sm:pt-20">
        <Container className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
          <div>
            <Eyebrow dark>Toptancılar, üreticiler ve distribütörler için</Eyebrow>
            <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.025em] text-white sm:text-5xl lg:text-[3.4rem]">
              PDF kataloğunuz artık canlı bir sipariş sayfası.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
              Ürünlerinizi bir kez yükleyin. Bayileriniz şifreyle girsin, kendi fiyat listesini görsün, sepetini
              doldurup WhatsApp&apos;tan sipariş versin. Ücretsiz başlayın, kart istemeyiz.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/basvuru" size="lg">
                Ücretsiz kataloğumu kur
              </ButtonLink>
              <ButtonLink href={SITE.demoUrl} tone="outline-dark" size="lg" external>
                Demo kataloğu aç
              </ButtonLink>
            </div>
            <p className="mt-6 font-plex-mono text-sm text-white/45">
              Ücretsiz plan · 200 ürün · kart yok · {SITE.setupMinutes} dakikada kurulum · demo şifresi {SITE.demoPassword}
            </p>
          </div>
          <div className="flex justify-center pb-4 lg:justify-end lg:pb-0">
            <HeroComparison />
          </div>
        </Container>
      </Section>

      {/* 2. Ücretsiz nasıl ücretsiz — açık zemin, koyu kartlar */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Ücretsiz plan"
            title="Bedava kurun, yayına alın. Büyüyünce paket seçersiniz."
            lead="Ücretsiz planda kataloğunuzun altında ince bir eKatalox bandı ve ürün listesinde arada bir tanıtım kartı görünür. Reklamsız istediğiniz gün bir paket alırsınız; ürünleriniz, şifreleriniz ve bayileriniz olduğu gibi kalır."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { value: "0 ₺", label: "Ücretsiz plan, kart bilgisi istenmez" },
              { value: "200", label: "Ürün, 1 fiyat listesi, WhatsApp sipariş" },
              { value: "Süresiz", label: "Deneme değil; kapanma tarihi yok" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-brand-dark p-6 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.5)]"
              >
                <div className="font-plex-mono text-3xl font-medium tabular-nums text-brand-neon">{s.value}</div>
                <div className="mt-2 text-sm leading-relaxed text-white/60">{s.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 3. Üç dert */}
      <Section tone="white">
        <Container>
          <SectionHeading
            eyebrow="PDF katalogla üç dert"
            title="Katalogla sipariş almanın üç derdi var. Üçü de biter."
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

      {/* 4. Nasıl çalışır — koyu zemin, ikonlu kartlar + oklar */}
      <Section id="nasil-calisir" tone="navy" glow>
        <Container>
          <SectionHeading
            dark
            align="center"
            eyebrow="Nasıl çalışır"
            title="Üç adım: yükle, şifre ver, sipariş al."
            className="mx-auto"
          />
          <div className="mt-14 flex flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-center md:gap-3">
            {STEPS.map((s, i) => (
              <div key={s.no} className="flex flex-1 items-center gap-3 md:items-stretch">
                <div className="flex-1 rounded-2xl border border-white/10 bg-brand-dark-surface p-6">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-brand-neon/15 text-brand-neon">
                    <s.icon className="size-5" />
                  </div>
                  <p className="mt-4 font-plex-mono text-xs text-white/40">{s.no}</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{s.body}</p>
                </div>
                {i < STEPS.length - 1 ? (
                  <ArrowRight aria-hidden className="hidden size-5 shrink-0 rotate-90 text-white/25 md:block md:rotate-0" />
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-brand-dark-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <Eyebrow dark>Kendiniz deneyin</Eyebrow>
              <h3 className="mt-2 text-xl font-semibold text-white">Demo kataloğa bayi gibi girin</h3>
              <p className="mt-2 max-w-2xl leading-relaxed text-white/60">
                Şifre {SITE.demoPassword}. Ürünleri gezin, sepete koyun, sipariş fişinin nasıl geldiğine bakın.
              </p>
            </div>
            <ButtonLink href={SITE.demoUrl} tone="outline-dark" external className="shrink-0">
              Demoyu aç <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* 5. Özellikler */}
      <Section tone="white" id="ozellikler">
        <Container>
          <SectionHeading
            eyebrow="Özellikler"
            title="Toptan satışın gerektirdiği her şey, ücretsiz planda da var."
            lead="Ürün limiti ve fiyat listesi sayısı pakete göre değişir; işleyiş her pakette aynıdır."
          />
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <h3 className="text-lg font-semibold text-brand-navy">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-brand-muted">{f.body}</p>
              </div>
            ))}
          </div>
          <Link href="/ozellikler" className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green hover:underline">
            Tüm özellikleri inceleyin <ArrowRight className="size-4" />
          </Link>
        </Container>
      </Section>

      {/* 6. Kimler için */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Kimler için"
            title="Katalog PDF'i hazırlayıp bayiye gönderen herkes için"
            lead="Sektör fark etmez: ürün kodu, koli içi adet ve bayi fiyatı olan her toptancı aynı düzende çalışır."
          />
          <ul className="mt-10 flex flex-wrap gap-3">
            {SEGMENTS.map((s) => (
              <li key={s} className="rounded-full border border-brand-line bg-white px-4 py-2 text-sm font-medium text-brand-navy">
                {s}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* 7. Paketler — koyu zemin */}
      <Section tone="navy" glow id="paketler">
        <Container>
          <SectionHeading
            dark
            align="center"
            className="mx-auto"
            eyebrow="Paketler"
            title="Ücretsiz başlayın, büyüyünce seçin."
            lead="Fiyatlar yıllık ve KDV hariçtir. Komisyon yok, sipariş başına ücret yok. Ücretli paketlerde reklam görünmez."
          />
          <div className="mt-12">
            <PlanCards compact dark />
          </div>
          <div className="mt-8 text-center">
            <Link href="/fiyatlandirma" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-neon hover:underline">
              Paketleri karşılaştırın <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </Section>

      {/* 8. SSS */}
      <Section>
        <Container>
          <SectionHeading eyebrow="Sık sorulanlar" title="Aklınıza takılanlar" />
          <dl className="mt-10 divide-y divide-brand-line border-y border-brand-line">
            {FAQ.map((f) => (
              <div key={f.q} className="grid gap-3 py-6 md:grid-cols-[1fr_1.6fr] md:gap-10">
                <dt className="text-lg font-semibold text-brand-navy">{f.q}</dt>
                <dd className="leading-relaxed text-brand-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
          <Link href="/sss" className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green hover:underline">
            Tüm sorular <ArrowRight className="size-4" />
          </Link>
        </Container>
      </Section>

      {/* 9. Son çağrı */}
      <Section tone="navy" glow>
        <Container className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl">
              Kataloğunuzu bugün yayınlayın. Ücretsiz.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">
              {`Kayıt ${SITE.setupMinutes} dakika sürer, kataloğunuz o an açılır. İlk yükleme için Excel ya da PDF'inizi gönderin, biz yükleyelim.`}
            </p>
          </div>
          <div className="flex flex-col gap-4 lg:items-end">
            <ButtonLink href="/basvuru" size="lg">
              Ücretsiz kataloğumu kur
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
