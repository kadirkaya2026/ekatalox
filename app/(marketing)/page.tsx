import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  FileSpreadsheet,
  FileText,
  Lock,
  Megaphone,
  Package,
  Palette,
  Tags,
} from "lucide-react";
import { MARKETING_WHATSAPP_HREF, WhatsAppGlyph } from "@/components/marketing/contact-dock";
import { HeroOrderVisual } from "@/components/marketing/hero-order-visual";
import { PhoneFrame } from "@/components/marketing/phone-frame";
import { PlanCards } from "@/components/marketing/plan-cards";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { TOPTAN_PLANS } from "@/lib/billing/toptan-plans";
import { CUSTOMER_NAMES, SITE } from "@/lib/marketing/site";

// Ana sayfa (24 Eyl 2026 reklam öncesi yeniden düzen; tema 21 Eyl koyu/yeşil).
// Hedef: Instagram/Meta reklamından gelen toptancı ilk ekranda ne olduğunu
// anlasın ve "Ücretsiz kataloğumu kur"a ya da WhatsApp'a geçsin.
// Sıra: hero (katalog + WhatsApp'a düşen sipariş) → müşteri şeridi → PDF'le
// önce/sonra → 3 adım (gerçek ekran görüntüleri) → özellikler → paketler →
// SSS → son çağrı. Eski "Ücretsiz plan" ve "Kimler için" bölümleri kaldırıldı
// (bilgisi hero, paketler ve SSS'de). Sunucu bileşeni.

export const metadata: Metadata = {
  title: { absolute: "eKatalox — Toptancılar için ücretsiz online katalog ve WhatsApp sipariş" },
  description:
    "PDF kataloğunuzu canlı bir sipariş sayfasına çevirin. Bayileriniz şifreyle girsin, kendi fiyat listesini görsün, WhatsApp'tan sipariş versin. Ücretsiz plan, kart istenmez, 5 dakikada kurulum.",
  alternates: { canonical: "/" },
};

const BEFORE_AFTER = [
  {
    before: "Fiyat değişince yeni PDF hazırlayıp yüzlerce bayiye tekrar gönderiyorsunuz.",
    after: "Fiyatı panelde değiştirirsiniz, bayi o an güncel fiyatı görür.",
  },
  {
    before: "Bayiye başka, perakendeye başka fiyat için ayrı ayrı PDF tutuyorsunuz.",
    after: "Her müşteri grubuna ayrı şifre; kim hangi şifreyle girdiyse yalnız kendi fiyatını görür.",
  },
  {
    before: "Siparişler sesli mesajla, ekran görüntüsüyle, “şundan 3 koli” diye geliyor.",
    after: "Sipariş ürün kodu, adet, koli ve tutarla tek sayfa PDF olarak WhatsApp'ınıza düşer.",
  },
];

const STEPS = [
  {
    title: "Ürünlerinizi yükleyin",
    body: "Excel'den, fotoğraftan ya da tek tek. PDF'inizi gönderirseniz ilk yüklemeyi biz yaparız.",
    image: null,
    alt: "Ürün listesi Excel dosyası",
  },
  {
    title: "Bayilerinize şifre verin",
    body: "firmaniz.ekatalox.com adresini ve şifreyi WhatsApp'tan paylaşın. Uygulama indirmek gerekmez.",
    image: "/site/toptan-giris-v2.png",
    alt: "Bayinin şifreyle giriş ekranı",
  },
  {
    title: "Sipariş WhatsApp'a gelir",
    body: "Bayi sepetini doldurup gönderir, sipariş fişi PDF olarak WhatsApp numaranıza düşer.",
    image: "/site/toptan-sepet-v2.png",
    alt: "Bayinin sepeti ve WhatsApp ile sipariş düğmesi",
  },
];

// 1. adım görseli: demo mağazanın (demotoptan) gerçek ilk 8 ürünü, kod ve
// fiyatları DB'den (24 Eyl 2026), adlar kısaltılmış.
const EXCEL_ROWS = [
  ["BSU-001", "Baseus Pudding USB-C Lightning 20W", "499"],
  ["BSU-002", "Toocki Dual Band Wi-Fi Adaptörü", "599"],
  ["BSU-003", "Toocki Tangxin USB-C Lightning 27W", "499"],
  ["BSU-004", "Toocki 20W PD Yaylı Kablo", "499"],
  ["BSU-005", "Toocki 100W Type-C Kablo", "599"],
  ["BSU-006", "Toocki 66W USB-A Type-C Kablo", "499"],
  ["BSU-007", "Baseus Fish-Eye 100W Kablo", "599"],
  ["BSU-008", "Baseus Fish Eye Lightning 2A", "699"],
];

function ExcelSheet({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="flex aspect-[71.9/150] w-full flex-col overflow-hidden rounded-[10%/4.8%] border border-white/15 bg-white text-left shadow-[0_24px_48px_-24px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center gap-1.5 bg-[#107C41] px-[7%] py-[6%] text-[clamp(8px,2.6vw,12px)] font-semibold text-white">
        <FileSpreadsheet className="size-[1.2em] shrink-0" aria-hidden />
        urunler.xlsx
      </div>
      <div className="grid grid-cols-[auto_1fr_auto] gap-x-[6%] border-b border-black/10 bg-[#F3F4F6] px-[7%] py-[4%] text-[clamp(6px,1.9vw,9px)] font-semibold text-black/55">
        <span>Kod</span>
        <span>Ürün</span>
        <span>Fiyat</span>
      </div>
      <div className="flex-1 divide-y divide-black/5">
        {EXCEL_ROWS.map(([code, name, price]) => (
          <div
            key={code}
            className="grid grid-cols-[auto_1fr_auto] gap-x-[6%] px-[7%] py-[4.5%] text-[clamp(6px,1.9vw,9px)] leading-tight text-black/80"
          >
            <span className="tabular-nums text-black/50">{code}</span>
            <span className="truncate">{name}</span>
            <span className="tabular-nums">₺{price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: Lock, title: "Şifreli katalog", body: "Fiyatlar herkese açık değil. Şifresiz ziyaretçi isterseniz yalnız ürünleri görür." },
  { icon: Tags, title: "Ayrı fiyat listeleri", body: "Bayi, perakende, özel müşteri. Aynı katalog her şifrede kendi fiyatıyla açılır." },
  { icon: Package, title: "Koli, paket, adet", body: "Koli içi adet ve varyant (renk, beden, model). Tutar kendiliğinden hesaplanır." },
  { icon: FileText, title: "WhatsApp'a PDF sipariş", body: "Cari adı, telefon, not ve kalemler tek sayfada, doğrudan WhatsApp'ınızda." },
  { icon: Megaphone, title: "Kampanya ve öne çıkanlar", body: "Banner, kampanya kartı, indirimli ürün. Yeni gelen ürünü ilk sırada gösterin." },
  { icon: BellRing, title: "Bayilere bildirim", body: "Yeni ürün, stok geldi, kampanya başladı. Bildirim açan bayinin telefonuna düşer." },
  { icon: BarChart3, title: "Raporlar", body: "Kim ne zaman girdi, hangi ürünlere baktı, hangi ilden. Bugün kaç sipariş geldi." },
  { icon: Palette, title: "Kendi logonuz ve renkleriniz", body: "Hazır temalardan seçin, gerçek ürünlerinizle önizleyin." },
];

const FAQ = [
  {
    q: "Ücretsiz plan gerçekten ücretsiz mi?",
    a: "Evet. Kart bilgisi istemeyiz, süre sınırı yoktur. 250 ürüne kadar kataloğunuzu yayınlar, WhatsApp'tan sipariş alırsınız. Karşılığında kataloğunuzda küçük eKatalox reklamları görünür.",
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

const HERO_POINTS = ["Ücretsiz plan, süre sınırı yok", "Kart bilgisi istenmez", `${SITE.setupMinutes} dakikada kurulum`];

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

      {/* 1. Hero — koyu zemin; görsel: katalog + WhatsApp'a düşen sipariş */}
      <Section tone="navy" glow className="pb-14 pt-12 sm:pb-20 sm:pt-20">
        <Container className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
          <div>
            <p className="text-sm font-medium text-brand-neon">Toptancılar ve üreticiler için</p>
            <h1 className="mt-3 text-balance text-[2.35rem] font-bold leading-[1.05] tracking-[-0.025em] text-white sm:text-5xl lg:text-[3.4rem]">
              PDF kataloğunuz artık canlı bir sipariş sayfası.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
              Ürünlerinizi bir kez yükleyin. Bayileriniz şifreyle girsin, kendi fiyatını görsün, sepetini doldurup
              WhatsApp&apos;tan sipariş versin.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/basvuru" size="lg">
                Ücretsiz kataloğumu kur
              </ButtonLink>
              <ButtonLink href={SITE.demoEnterUrl} tone="outline-dark" size="lg" external>
                Demo kataloğu aç
              </ButtonLink>
            </div>
            <ul className="mt-7 flex flex-col gap-2 text-[15px] text-white/65 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {HERO_POINTS.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-brand-neon" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <HeroOrderVisual />
        </Container>
      </Section>

      {/* 2. Müşteri şeridi — yalnız gerçek müşteriler (lib/marketing/site.ts) */}
      {CUSTOMER_NAMES.length > 0 ? (
        <section className="border-b border-brand-line bg-white py-7">
          <Container className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-center sm:gap-10">
            <p className="text-sm text-brand-muted">Siparişlerini eKatalox&apos;tan alan firmalar</p>
            <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2">
              {CUSTOMER_NAMES.map((name) => (
                <li key={name} className="text-2xl font-bold tracking-[-0.02em] text-brand-navy/80">
                  {name}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {/* 3. PDF'le önce / eKatalox'la sonra */}
      <Section tone="white">
        <Container>
          <SectionHeading title="PDF katalogla sipariş almanın üç derdi, üçü de biter." />
          <div className="mt-10 overflow-hidden rounded-2xl border border-brand-line">
            <div className="hidden grid-cols-2 bg-brand-paper text-sm font-semibold text-brand-muted md:grid">
              <p className="px-6 py-3">PDF katalogla</p>
              <p className="border-l border-brand-line px-6 py-3 text-brand-green">eKatalox ile</p>
            </div>
            {BEFORE_AFTER.map((row) => (
              <div key={row.after} className="grid border-t border-brand-line first:border-t-0 md:grid-cols-2 md:first:border-t">
                <p className="px-6 pb-2 pt-5 leading-relaxed text-brand-muted line-through decoration-brand-muted/40 md:py-5">
                  {row.before}
                </p>
                <p className="flex gap-3 px-6 pb-5 pt-1 font-medium leading-relaxed text-brand-navy md:border-l md:border-brand-line md:py-5">
                  <Check className="mt-1 size-4 shrink-0 text-brand-green" aria-hidden />
                  {row.after}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 4. Nasıl çalışır — gerçek ekran görüntüleri; gerçekten sıralı olduğu için numaralı */}
      <Section id="nasil-calisir" tone="navy" glow>
        <Container>
          <SectionHeading dark align="center" title="Üç adımda sipariş almaya başlayın." className="mx-auto" />
          <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-8">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex items-center gap-5 md:flex-col md:text-center">
                <div className="w-[112px] shrink-0 md:w-[190px]">
                  {s.image ? (
                    <PhoneFrame src={s.image} alt={s.alt} className="w-full sm:w-full" />
                  ) : (
                    <ExcelSheet label={s.alt} />
                  )}
                </div>
                <div className="md:mt-2">
                  <p className="flex items-center gap-2.5 text-lg font-semibold text-white md:justify-center">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-neon text-sm font-bold text-brand-dark">
                      {i + 1}
                    </span>
                    {s.title}
                  </p>
                  <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-white/65 md:mx-auto">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mx-auto mt-14 flex max-w-3xl flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center sm:flex-row sm:justify-between sm:p-7 sm:text-left">
            <div>
              <h3 className="text-lg font-semibold text-white">Bayi gibi girip kendiniz deneyin</h3>
              <p className="mt-1 text-white/65">Ürünleri gezin, sepete koyun, sipariş fişinin nasıl geldiğine bakın.</p>
            </div>
            <ButtonLink href={SITE.demoEnterUrl} tone="outline-dark" external className="shrink-0">
              Demo kataloğu aç
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* 5. Özellikler + sektörler tek cümlede */}
      <Section tone="white" id="ozellikler">
        <Container>
          <SectionHeading
            title="Toptan satışın gerektirdiği her şey, ücretsiz planda da var."
            lead="Ürün limiti ve fiyat listesi sayısı pakete göre değişir; işleyiş her pakette aynıdır."
          />
          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <f.icon className="size-5 text-brand-green" aria-hidden />
                <h3 className="mt-3 font-semibold text-brand-navy">{f.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-brand-muted">{f.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 max-w-3xl border-t border-brand-line pt-8 leading-relaxed text-brand-muted">
            <span className="font-semibold text-brand-navy">Sektör fark etmez.</span> Telefon aksesuarı, gıda, tekstil,
            hırdavat, kozmetik, kırtasiye, ambalaj, elektrik, züccaciye, yedek parça: ürün kodu, koli içi adet ve bayi
            fiyatı olan her toptancı aynı düzende çalışır.
          </p>
          <Link href="/ozellikler" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green hover:underline">
            Tüm özellikleri inceleyin <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Container>
      </Section>

      {/* 6. Paketler — koyu zemin */}
      <Section tone="navy" glow id="paketler">
        <Container>
          <SectionHeading
            dark
            align="center"
            className="mx-auto"
            title="Ücretsiz başlayın, büyüyünce paket seçin."
            lead="Fiyatlar yıllık ve KDV hariçtir. Komisyon yok, sipariş başına ücret yok. Ücretli paketlerde reklam görünmez."
          />
          <div className="mt-12">
            <PlanCards compact dark />
          </div>
          <div className="mt-8 text-center">
            <Link href="/fiyatlandirma" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-neon hover:underline">
              Paketleri karşılaştırın <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </Container>
      </Section>

      {/* 7. SSS */}
      <Section>
        <Container>
          <SectionHeading title="Aklınıza takılanlar" />
          <dl className="mt-10 divide-y divide-brand-line border-y border-brand-line">
            {FAQ.map((f) => (
              <div key={f.q} className="grid gap-3 py-6 md:grid-cols-[1fr_1.6fr] md:gap-10">
                <dt className="text-lg font-semibold text-brand-navy">{f.q}</dt>
                <dd className="leading-relaxed text-brand-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
          <Link href="/sss" className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green hover:underline">
            Tüm sorular <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Container>
      </Section>

      {/* 8. Son çağrı — kayıt + WhatsApp */}
      <Section tone="navy" glow>
        <Container className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl">
              Kataloğunuzu bugün yayınlayın. Ücretsiz.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">
              {`Kayıt ${SITE.setupMinutes} dakika sürer, kataloğunuz o an açılır. Sorunuz varsa WhatsApp'tan yazın, Excel ya da PDF'inizi gönderin, ilk yüklemeyi biz yapalım.`}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
            <ButtonLink href="/basvuru" size="lg">
              Ücretsiz kataloğumu kur
            </ButtonLink>
            <ButtonLink href={MARKETING_WHATSAPP_HREF} tone="outline-dark" size="lg" external>
              <WhatsAppGlyph className="size-5 text-[#25D366]" />
              WhatsApp&apos;tan yazın
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
