import { marketingMetadata } from "@/lib/marketing/metadata";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Lock,
  Megaphone,
  Package,
  Palette,
  Tags,
} from "lucide-react";
import { MARKETING_WHATSAPP_HREF, WhatsAppGlyph } from "@/components/marketing/contact-dock";
import { HeroOrderVisual, OrderFlowProof } from "@/components/marketing/hero-order-visual";
import { PhoneFrame } from "@/components/marketing/phone-frame";
import { PlanCards } from "@/components/marketing/plan-cards";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { TOPTAN_PLANS } from "@/lib/billing/toptan-plans";
import { CUSTOMER_NAMES, SITE } from "@/lib/marketing/site";

export const metadata = marketingMetadata(
  "/",
  "Toptancılar İçin Dijital Katalog ve Sipariş",
  "Ürünlerinizi online katalogda paylaşın, bayilerinize farklı fiyatlar gösterin ve WhatsApp üzerinden sipariş toplayın. 250 ürünle ücretsiz başlayın.",
);

// Ana sayfa (24 Eyl 2026 reklam öncesi yeniden düzen; tema 21 Eyl koyu/yeşil).
// Hedef: Instagram/Meta reklamından gelen toptancı ilk ekranda ne olduğunu
// anlasın ve "Ücretsiz kataloğumu kur"a ya da WhatsApp'a geçsin.
// Sıra: hero (katalog + WhatsApp'a düşen sipariş) → müşteri şeridi → PDF'le
// önce/sonra → 3 adım (gerçek ekran görüntüleri) → özellikler → paketler →
// SSS → son çağrı. Eski "Ücretsiz plan" ve "Kimler için" bölümleri kaldırıldı
// (bilgisi hero, paketler ve SSS'de). Sunucu bileşeni.

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
    after: "Ürün kodu, adet, koli ve tutarı içeren PDF sipariş fişinin bağlantısını bayi WhatsApp üzerinden paylaşır.",
  },
];

const STEPS = [
  {
    title: "Ürünlerinizi yükleyin",
    body: "Ürünlerinizi panelden veya Excel şablonuyla ekleyin. Mevcut listenizi aktarmak için desteğe ihtiyacınız varsa bize yazın.",
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
    body: "Bayi sepetini doldurur, PDF sipariş fişinin bağlantısıyla WhatsApp'a geçer ve mesajı gönderir.",
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
  { icon: Lock, title: "Fiyatlarınız kontrollü paylaşılır", body: "Ürünlerinizi herkese tanıtın; bayi fiyatlarını şifreli listelerle paylaşın. Açık kurumsal sayfalarda fiyat yayınlanmaz.", href: "/ozellikler/bayi-fiyat-listeleri" },
  { icon: Tags, title: "Her bayiye kendi fiyatı", body: "Bayi, perakende ve özel müşteriler aynı kataloğu kendi fiyat listeleriyle açsın. Ayrı PDF’lerle uğraşmayın.", href: "/ozellikler/bayi-fiyat-listeleri" },
  { icon: Package, title: "Sipariş kuralları size ait", body: "Adet ve koliyle sipariş alın, minimum sepet tutarını belirleyin. Müşteri formunda hangi bilgilerin zorunlu olacağını seçin.", href: "/ozellikler/whatsapp-siparis" },
  { icon: FileText, title: "Siparişlerim’de takip edin", body: "Siparişleri panelde görün. Bildirimleri açtıysanız yeni siparişten haberdar olun; WhatsApp için sabit alıcıyı veya müşteri seçimini kullanın.", href: "/ozellikler/whatsapp-siparis" },
  { icon: FileSpreadsheet, title: "Ürün ve fotoğrafları toplu yükleyin", body: "Excel/CSV listenizi aktarın. Görselleri ürün kodlarıyla eşleştirerek toplu yükleyin, ürünleri tek tek eklemekle zaman kaybetmeyin.", href: "/ozellikler/toplu-urun-yukleme" },
  { icon: Megaphone, title: "Duyurun, çalışma saatlerini belirleyin", body: "Kampanya kartları ve açılış duyurusu hazırlayın. Çalışma saatlerinizi ayarlayın; kapalı olduğunuzda müşteriyi bilgilendirin.", href: "/ozellikler/kampanya-bildirimleri" },
  { icon: BellRing, title: "Kampanyayı müşterinize ulaştırın", body: "Bildirim izni veren müşterilerinize yeni ürün, kampanya ve stok duyuruları gönderin.", href: "/ozellikler/kampanya-bildirimleri", plan: "Profesyonel ve üzeri" },
  { icon: BarChart3, title: "Aramalardan aksiyon alın", body: "En çok aranan ve sepete eklenen ürünleri, il–fiyat listesi girişlerini görün. Ürün sıralaması ve kampanyalarınızı buna göre düzenleyin.", href: "/ozellikler/raporlar", plan: "Başlangıç ve üzeri" },
  { icon: Palette, title: "Kurumsal siteniz pakete dahil", body: "Firmanızı SEO uyumlu açık sayfalarda tanıtın. Bayimiz ol formuyla başvuru alın; ayrıca kurumsal site paket ücreti ödemeyin.", href: "/ozellikler/kurumsal-site", plan: "Kurumsal" },
  { icon: CreditCard, title: "Kataloğunuzdan ödeme alın", body: "İyzico/Paytr entegrasyonuyla kataloğunuzdan ödeme alın.", href: "/ozellikler/online-odeme", plan: "Kurumsal" },
];

const FAQ = [
  {
    q: "Ücretsiz plan gerçekten ücretsiz mi?",
    a: "Evet. Kart bilgisi istemeyiz, süre sınırı yoktur. 250 ürün, 2 fiyat listesi ve aylık 1.000 ziyaretçi sınırıyla kataloğunuzu yayınlar, WhatsApp'tan sipariş alırsınız. Karşılığında kataloğunuzda küçük eKatalox reklamları görünür.",
  },
  {
    q: "Reklamlar nerede görünür, bayimi rahatsız eder mi?",
    a: "Sayfanın altında ince bir bant, ürün listesinde arada bir kart ve sipariş fişinin altında bir satır. Rakip ya da üçüncü taraf reklamı değildir, yalnız eKatalox'un kendi tanıtımıdır. Herhangi bir ücretli pakete geçince tamamı kalkar.",
  },
  {
    q: "Ürünleri kim yükler?",
    a: "Ürünlerinizi panelden veya Excel şablonuyla kendiniz ekleyebilirsiniz. PDF ya da Excel listenizin aktarımı için destek isterseniz WhatsApp'tan bize ulaşın; listenizi inceleyip yapılacak işi ve kapsamını birlikte netleştirelim.",
  },
  {
    q: "Bayim nasıl girer, uygulama indirmesi gerekir mi?",
    a: "Hayır. firmaniz.ekatalox.com adresini ve şifreyi WhatsApp'tan gönderirsiniz; bayi tarayıcıda açar, şifreyi yazar, sipariş verir. İsterse ana ekranına ekler, uygulama gibi kullanır.",
  },
  {
    q: "Ücretsiz plan ile 14 günlük deneme arasındaki fark ne?",
    a: "Ücretsiz plan süre sınırı olmadan, kendi limitleriyle kullanılır. Ücretli bir paket seçerseniz o paketi 14 gün deneyebilirsiniz. Ödeme yapılmazsa deneme sonunda hesabınız Ücretsiz plana geçer; ücretsiz planın limitleri ve reklamları uygulanır.",
  },
  {
    q: "Sipariş için komisyon öder miyim?",
    a: "Hayır. Sipariş başına ücret veya komisyon alınmaz. Bayiniz sepetini hazırlar, oluşan PDF fişinin bağlantısını WhatsApp üzerinden size gönderir. Ücretli paketlerde yıllık paket bedeli ve KDV uygulanır. Online ödeme kullanırsanız ödeme sağlayıcısının işlem ücretleri ayrıca geçerlidir.",
  },
];

const HERO_POINTS = ["Ücretsiz plan, süre sınırı yok", "Kart bilgisi istenmez", "250 ürünle ücretsiz başlangıç"];

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
        "Toptancılar, üreticiler ve distribütörler için şifreli online katalog ve WhatsApp sipariş sistemi. Ücretsiz plan; ürünler bir kez yüklenir, bayiler kendi fiyat listesiyle girer, bayi PDF sipariş fişinin bağlantısını WhatsApp üzerinden paylaşır.",
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />

      {/* 1. Hero — koyu zemin; görsel: katalog + WhatsApp'a düşen sipariş */}
      <Section tone="navy" glow className="pb-14 pt-12 sm:pb-20 sm:pt-20">
        <Container className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div>
            <p className="text-sm font-medium text-brand-neon">Toptancılar ve üreticiler için</p>
            <h1 className="mt-3 text-balance text-[2.35rem] font-bold leading-[1.05] tracking-[-0.025em] text-white sm:text-5xl lg:text-[3.4rem]">
              Bayiniz ürününü seçsin. Siparişi WhatsApp’a gelsin.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
              Ürünlerinizi ve güncel fiyatlarınızı tek katalogda paylaşın. Bayileriniz kendi fiyatıyla sepetini
              hazırlasın; ürün, adet ve tutar bilgileri düzenli bir sipariş fişinde toplansın.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/basvuru" size="lg">
                Ücretsiz başla
              </ButtonLink>
              <ButtonLink href={SITE.demoUrl} tone="outline-dark" size="lg" external>
                Demoyu incele
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

      {/* 2. Müşteri şeridi — başlık altında sağdan sola sonsuz kayan firma adları.
          Yalnız gerçek müşteriler (lib/marketing/site.ts CUSTOMER_NAMES). Liste
          ekranı dolduracak kadar tekrarlanır, iki kopya yan yana -50% kayar. */}
      {CUSTOMER_NAMES.length > 0 ? (
        <section className="border-b border-brand-line bg-white py-9 sm:py-10">
          <p className="flex items-center justify-center gap-3 px-5 text-center text-xl font-bold tracking-[-0.02em] text-brand-navy sm:text-[1.7rem]">
            <span aria-hidden className="relative flex size-3 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-neon opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-3 rounded-full bg-brand-neon" />
            </span>
            Siparişlerini eKatalox&apos;tan alan firmalar
          </p>
          <div
            className="group relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
            aria-label={`Müşterilerimiz: ${CUSTOMER_NAMES.join(", ")}`}
          >
            <div className="flex w-max animate-[customer-marquee_75s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
              {[0, 1].map((copy) => (
                <ul key={copy} aria-hidden className="flex shrink-0 items-center">
                  {Array.from({ length: Math.ceil(8 / CUSTOMER_NAMES.length) }, () => CUSTOMER_NAMES)
                    .flat()
                    .map((name, i) => (
                      <li
                        key={`${copy}-${i}`}
                        className="whitespace-nowrap px-8 text-xl font-semibold tracking-[-0.01em] text-brand-muted sm:px-12 sm:text-2xl"
                      >
                        {name}
                      </li>
                    ))}
                </ul>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <Section tone="paper" className="py-12 sm:py-20">
        <Container>
          <div className="mb-9 grid gap-4 lg:grid-cols-2 lg:items-end">
            <SectionHeading eyebrow="KATALOGDAN SİPARİŞE" title="Mesajı görün. Fişi açın. Siparişi hazırlayın." />
            <p className="max-w-lg text-base leading-relaxed text-brand-muted lg:pb-1">WhatsApp mesajından ürün ve tutar detaylarına kadar gerçek sipariş akışını inceleyin.</p>
          </div>
          <OrderFlowProof />
        </Container>
      </Section>

      {/* 3. PDF'le önce / eKatalox'la sonra */}
      <Section tone="white">
        <Container>
          <SectionHeading title="Fiyat paylaşımını ve sipariş toplamayı tek düzene taşıyın." />
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
            <ButtonLink href={SITE.demoUrl} tone="outline-dark" external className="shrink-0">
              Demoyu incele
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* 5. Özellikler + sektörler tek cümlede */}
      <Section tone="white" id="ozellikler">
        <Container>
          <SectionHeading
            title="Daha az yazışma. Daha düzenli sipariş."
            lead="Şifreli katalog, farklı fiyat listeleri ve PDF sipariş fişi ücretsiz planda. Raporlar Başlangıç, bayi bildirimleri Profesyonel ve üzeri paketlerde."
          />
          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <f.icon className="size-5 text-brand-green" aria-hidden />
                <h3 className="mt-3 font-semibold text-brand-navy">{f.title}</h3>
                {"plan" in f ? <p className="mt-1 text-xs font-semibold text-brand-green">{f.plan}</p> : null}
                <p className="mt-1.5 text-[15px] leading-relaxed text-brand-muted">{f.body}</p>
                <Link href={f.href} className="mt-3 inline-block text-sm font-semibold text-brand-green hover:underline">Ayrıntıları inceleyin →</Link>
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
            title="Ürün sayınıza ve bayi düzeninize uygun paketi seçin."
            lead="250 ürünle süresiz ücretsiz başlayın veya ücretli paketleri 14 gün deneyin. Ücretli paketler yıllık, KDV hariç ve reklamsızdır. Sipariş komisyonu yoktur."
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
              İlk adım: ürünlerinize bir katalog açın.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">
              250 ürün ve 2 fiyat listesiyle ücretsiz başlayın. Ürünlerinizi ekleyin, katalog bağlantınızı bayilerinizle paylaşın. Listenizi aktarmak için desteğe ihtiyacınız varsa birlikte bakalım.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
            <ButtonLink href="/basvuru" size="lg">
              Ücretsiz başla
            </ButtonLink>
            <ButtonLink href={MARKETING_WHATSAPP_HREF} tone="outline-dark" size="lg" external>
              <WhatsAppGlyph className="size-5 text-[#25D366]" />
              Kurulum desteği al
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
