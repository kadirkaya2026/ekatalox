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
import { RotatingWord } from "@/components/marketing/home-v2/rotating-word";
import { GateMock, GradientPanel, HeroCollage, OrdersMock, PriceListMock, WhatsAppMock } from "@/components/marketing/home-v2/visuals";
import { PlanTagCards } from "@/components/marketing/home-v2/plan-tag-cards";
import { CustomerMarquee } from "@/components/marketing/home-v2/page-kit";
import { Sparkles } from "lucide-react";
import { TOPTAN_PLANS } from "@/lib/billing/toptan-plans";
import { CUSTOMER_NAMES, SITE } from "@/lib/marketing/site";

export const metadata = marketingMetadata(
  "/",
  "Toptan Sipariş Programı ve Şifreli Bayi Kataloğu",
  "Toptancılar için şifreli online katalog ve WhatsApp sipariş programı. Bayilerinize ayrı fiyat listesi gösterin, Excel'den ürün yükleyin. Ücretsiz başlayın.",
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
      areaServed: { "@type": "Country", name: "Türkiye" },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        telephone: SITE.phone,
        email: SITE.salesEmail,
        availableLanguage: ["Turkish"],
      },
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
      "@id": `${SITE.url}/#software`,
      name: SITE.name,
      alternateName: "eKatalox B2B Katalog ve WhatsApp Sipariş Programı",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "B2B toptan sipariş ve bayi kataloğu yazılımı",
      operatingSystem: "Web",
      publisher: { "@id": `${SITE.url}/#organization` },
      areaServed: { "@type": "Country", name: "Türkiye" },
      availableLanguage: ["tr", "en", "de", "ru"],
      isAccessibleForFree: true,
      audience: {
        "@type": "BusinessAudience",
        audienceType: "Toptancılar, üreticiler, distribütörler, ithalatçılar ve marketler",
      },
      featureList: [
        "Bayilere şifreli online katalog",
        "Bayiye özel fiyat listeleri (bayi, perakende, özel müşteri)",
        "WhatsApp üzerinden PDF sipariş fişi",
        "Excel/CSV ile toplu ürün ve görsel yükleme",
        "Adet, paket ve koli ile sipariş",
        "Minimum sepet tutarı ve sipariş kuralları",
        "Bayilere kampanya ve stok bildirimi",
        "Sipariş takibi ve raporlar",
        "Kendi alan adı ve kurumsal tanıtım sitesi",
        "Sektöre özel katalog temaları",
      ],
      keywords:
        "toptancı sipariş programı, bayi kataloğu, B2B sipariş yazılımı, WhatsApp sipariş sistemi, dijital katalog, online katalog, bayi fiyat listesi, toptan satış programı",
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


// ---- TASLAK (14 Eki 2026): Beacons tarzı ana sayfa; worktree taslak/anasayfa-beacons ----
const ROTATING = ["bayinizin cebinde.", "WhatsApp'ta.", "her zaman güncel.", "şifreyle korunur.", "tek linkte."];

const PILLARS = [
  {
    key: "gate",
    accent: "Şifreli",
    rest: " katalog.",
    body: "Ürünler herkese açık, fiyatlar şifrenin arkasında. Bayi firmaniz.ekatalox.com adresini açar, şifresini yazar, kendi fiyatını görür. Uygulama indirmez, hesap açmaz.",
    from: "#DDF6E7",
    to: "#8FD9AF",
    visual: <GateMock />,
    href: "/ozellikler/bayi-fiyat-listeleri",
  },
  {
    key: "wa",
    accent: "WhatsApp",
    rest: "'tan sipariş.",
    body: "Bayi sepetini doldurur, tek dokunuşla WhatsApp'a geçer. Mesajda ürün kodu, adet ve tutarı olan PDF fişin linki hazır gelir. Sesli mesaj, ekran görüntüsü, “şundan 3 koli” biter.",
    from: "#FFE9C7",
    to: "#FFB173",
    visual: <WhatsAppMock />,
    href: "/ozellikler/whatsapp-siparis",
  },
  {
    key: "price",
    accent: "Her bayiye",
    rest: " kendi fiyatı.",
    body: "Bayi, perakende, özel müşteri: aynı katalog, ayrı şifre, ayrı fiyat listesi. Fiyat değişince panelde bir kez düzeltirsiniz, herkes o an güncel fiyatı görür.",
    from: "#EAE4FF",
    to: "#B9A6FF",
    visual: <PriceListMock />,
    href: "/ozellikler/bayi-fiyat-listeleri",
  },
  {
    key: "panel",
    accent: "Panelden",
    rest: " yönetin.",
    body: "Gelen siparişi onaylayın, adet ve fiyatı düzeltin, güncel fişi WhatsApp'tan geri gönderin. Yeni sipariş geldiğinde telefonunuza bildirim düşer.",
    from: "#DCEBFF",
    to: "#8FBDFF",
    visual: <OrdersMock />,
    href: "/ozellikler/whatsapp-siparis",
  },
];

const AI_CHIPS = ["llms.txt otomatik", "İşletme kartı", "Google ve Bing", "Sektör sayfaları", "Vitrin araması", "Kurumsal site"];

const PROOF = [
  { value: "0 ₺", label: "komisyon, sipariş başına ücret yok" },
  { value: "2 dk", label: "bayinin ilk siparişi için gereken süre" },
  { value: "250", label: "ürünle süresiz ücretsiz" },
  { value: "24 sa", label: "içinde kurulum desteği" },
];

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />

      {/* 1. Hero — beyaz zemin, dev başlık, dönen kelime, kolaj paneli */}
      <section className="bg-white pb-10 pt-14 sm:pt-24">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-green">Toptancılar için WhatsApp sipariş ve bayi kataloğu</p>
            <h1 className="mt-5 text-balance text-[2.9rem] font-extrabold leading-[0.98] tracking-[-0.035em] text-brand-navy sm:text-7xl lg:text-[6rem]">
              Kataloğunuz
              <br />
              <RotatingWord words={ROTATING} className="text-brand-green" />
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-brand-muted sm:text-xl">
              Bayiniz şifreyle girer, kendi fiyatını görür, sepetini WhatsApp&apos;tan sipariş fişi olarak gönderir. 250 ürünle ücretsiz, kart istenmez, komisyon yok.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/basvuru" tone="navy" size="lg" className="bg-brand-dark px-9 hover:bg-brand-navy">
                Ücretsiz başla
              </ButtonLink>
              <ButtonLink href={SITE.demoUrl} tone="outline" size="lg" external>
                Demoyu incele
              </ButtonLink>
            </div>
          </div>
          <HeroCollage />
        </Container>
      </section>

      {/* 2. Müşteri şeridi */}
      <CustomerMarquee />

      {/* 3. Dört sütun: her biri pastel panel + tek vurgulu kelime */}
      <section className="bg-white py-20 sm:py-28" id="ozellikler">
        <Container>
          <h2 className="mx-auto max-w-3xl text-balance text-center text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-navy sm:text-6xl">
            Toptancı işini yürütmek için gereken her şey eKatalox&apos;ta.
          </h2>
          <div className="mt-16 space-y-20 sm:mt-24 sm:space-y-28">
            {PILLARS.map((p, i) => (
              <div key={p.key} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                  <h3 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-navy sm:text-5xl">
                    <span className="text-brand-green">{p.accent}</span>
                    {p.rest}
                  </h3>
                  <p className="mt-5 max-w-md text-lg leading-relaxed text-brand-muted">{p.body}</p>
                  <Link href={p.href} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green hover:underline">
                    Ayrıntıları inceleyin <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>
                <GradientPanel from={p.from} to={p.to} tilt={i % 2 === 0 ? -3 : 3} className={i % 2 === 1 ? "lg:order-1" : undefined}>
                  {p.visual}
                </GradientPanel>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 4. Siyah blok: yapay zekâ görünürlüğü */}
      <section className="bg-white pb-20 sm:pb-28">
        <Container>
          <div className="relative overflow-hidden rounded-[32px] bg-brand-dark px-6 py-16 text-center text-white sm:px-12 sm:py-24">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-neon/25 blur-[120px]" />
            <div className="relative">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-white/10">
                <Sparkles className="size-8 text-brand-neon" />
              </div>
              <h2 className="mx-auto mt-6 max-w-2xl text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
                Firmanız ChatGPT&apos;ye sorulunca da bulunsun.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
                Kurumsal sitenize otomatik <b className="text-white">llms.txt</b> ve işletme kartı eklenir; Google, Bing ve yapay zekâ asistanları toptancınızı doğru anlatır. Siz hiçbir şey yapmazsınız.
              </p>
              <div className="mx-auto mt-9 flex max-w-2xl flex-wrap justify-center gap-2.5">
                {AI_CHIPS.map((c) => (
                  <span key={c} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold">{c}</span>
                ))}
              </div>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-brand-neon">Kurumsal pakette</p>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Rakamlar */}
      <section className="border-y border-brand-line bg-brand-paper py-12">
        <Container className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROOF.map((s) => (
            <div key={s.value} className="text-center lg:text-left">
              <p className="text-4xl font-extrabold tracking-tight text-brand-navy sm:text-5xl">{s.value}</p>
              <p className="mt-1 text-sm text-brand-muted">{s.label}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* 6. Paketler: eğik rozet bulutu kartları */}
      <section className="bg-white py-20 sm:py-28" id="paketler">
        <Container>
          <h2 className="mx-auto max-w-3xl text-balance text-center text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-navy sm:text-6xl">
            En iyi toptancı araçları, en düşük fiyatla, tek yerde.
          </h2>
          <div className="mx-auto mt-16 max-w-5xl sm:mt-20">
            <PlanTagCards />
          </div>
          <p className="mt-14 text-center">
            <Link href="/fiyatlandirma" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green hover:underline">
              Başlangıç ve Kurumsal dahil tüm paketleri karşılaştırın <ArrowRight className="size-4" aria-hidden />
            </Link>
          </p>
        </Container>
      </section>

      {/* 7. Tek büyük alıntı */}
      <section className="bg-white pb-20 sm:pb-28">
        <Container>
          <h2 className="mx-auto max-w-2xl text-balance text-center text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-navy sm:text-5xl">
            Siparişini düzene sokan toptancılar eKatalox&apos;u seviyor.
          </h2>
          <figure className="relative mx-auto mt-12 max-w-4xl rounded-[32px] border-2 border-brand-green/40 bg-brand-paper px-8 py-12 text-center sm:px-16 sm:py-16">
            <span className="absolute left-6 top-5 rounded-full bg-brand-amber-soft px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-amber">
              Taslak · gerçek alıntıyla değişecek
            </span>
            <blockquote className="text-balance text-2xl font-medium leading-snug text-brand-navy sm:text-[2rem]">
              “Eskiden her bayiye ayrı PDF atıyordum, fiyat değişince hepsini yeniden yapıyordum. Şimdi fiyatı panelde değiştiriyorum, sipariş WhatsApp&apos;a fiş olarak geliyor. İlk haftada 17 sipariş aldım.”
            </blockquote>
            <figcaption className="mt-8 flex items-center justify-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-brand-dark text-base font-bold text-white">YÇ</span>
              <span className="text-left">
                <span className="block font-semibold text-brand-navy">Yusuf Çoltu</span>
                <span className="block text-sm text-brand-muted">qoop · tekstil aksesuar toptancısı</span>
              </span>
            </figcaption>
          </figure>
        </Container>
      </section>

      {/* 8. SSS (kısaltılmış) */}
      <Section tone="paper">
        <Container>
          <SectionHeading title="Aklınıza takılanlar" />
          <dl className="mt-10 divide-y divide-brand-line border-y border-brand-line">
            {FAQ.slice(0, 4).map((f) => (
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

      {/* 9. Son çağrı: pastel degrade kart */}
      <section className="bg-white py-20 sm:py-28">
        <Container>
          <div className="rounded-[32px] px-6 py-16 text-center sm:px-12 sm:py-20" style={{ backgroundImage: "linear-gradient(135deg, #DDF6E7 0%, #CDE9FF 55%, #EAE4FF 100%)" }}>
            <h2 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-navy sm:text-6xl">
              Instagram bio&apos;nuzdaki link kataloğunuz olsun.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-brand-navy/70">
              Ürünlerinizi yükleyin, bayilerinize şifreyi gönderin. Bugün açın, ilk sipariş bu hafta gelsin.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/basvuru" tone="navy" size="lg" className="bg-brand-dark px-9 hover:bg-brand-navy">Ücretsiz başla</ButtonLink>
              <ButtonLink href={MARKETING_WHATSAPP_HREF} tone="white" size="lg" external>
                <WhatsAppGlyph className="size-5 text-[#25D366]" /> Kurulum desteği al
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
