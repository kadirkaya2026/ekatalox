import Image from "next/image";
import Link from "next/link";
import { MapPin, ShoppingBasket, Bell, Clock3, PackageCheck, QrCode, ArrowUpRight, Languages } from "lucide-react";
import { ButtonLink, Container } from "@/components/marketing/ui";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { SITE } from "@/lib/marketing/site";
import { Accent, BandCard, Breadcrumb, ClosingCta, CustomerMarquee, FaqList, PageHero, TintBox, pastelStyle } from "@/components/marketing/home-v2/page-kit";

export const metadata = marketingMetadata("/sektorler/market-bakkal", "Market ve Bakkal Sipariş Programı: Online Katalog", "Marketiniz için online katalog, konumlu WhatsApp siparişi, mobil sepet ve kampanya bildirimleri. Kurumsal pakette marketlere 200 QR magnet hediye.");
const features = [
  { icon: Languages, title: "Yabancı müşterileriniz için İngilizce, Almanca ve Rusça", body: "Kataloğunuzda yabancı müşterileriniz için İngilizce, Almanca ve Rusça dil seçenekleri mevcuttur. Müşterileriniz dil menüsünden tercih ettikleri dili seçerek kataloğunuzu kullanabilir." },
  { icon: MapPin, title: "Siparişin yanında müşterinizin konumu", body: "Müşteriniz isterse cihazından konum paylaşımına izin verir. Konum bağlantısı WhatsApp sipariş mesajına eklenir; yazılı adresle birlikte teslimat için kullanabilirsiniz." },
  { icon: ShoppingBasket, title: "Mobilde her an erişilen sepet", body: "Müşteriniz ürünleri incelerken ekranın altındaki sabit sepet alanına kolayca ulaşır. Ürün adetlerini düzenler, toplamını görür ve sipariş bilgilerine geçer." },
  { icon: PackageCheck, title: "Siparişler tek yerde, durumları takipte", body: "Bildirim izni veren müşterilerinize “Siparişiniz onaylandı”, “Siparişiniz hazırlanıyor” ve “Siparişiniz yola çıktı” bildirimleri gönderin. Müşteriniz Sipariş Takip sayfasından da siparişinin hangi aşamada olduğunu görsün." },
  { icon: Bell, title: "Bir süredir sipariş vermeyen müşterinizi geri kazanın", body: "Bildirim izni veren müşterilerinize hafta sonuna özel kampanya bildirimleri gönderin. Sürekli sipariş veren ama uzun zamandır alışveriş yapmayan müşterilerinize marketinizi hatırlatın, yeniden sipariş vermelerini teşvik edin. Bildirim gönderme Profesyonel ve Kurumsal paketlerde bulunur." },
  { icon: Clock3, title: "Çalışma saatleri ve kapalı mağaza durumu", body: "Mağazanızın çalışma saatlerini belirleyin; kapalı olduğunuzda müşterinizi bilgilendirin. Sipariş almaya ilişkin ayarları işletmenizin çalışma düzenine göre yönetin." },
  { icon: ShoppingBasket, title: "Sipariş koşullarını siz belirleyin", body: "Minimum sepet tutarını ve müşteriden istenen bilgilerin zorunluluğunu ayarlayın. Teslimat ücreti ve ücretsiz teslimat eşiğiyle sipariş maliyetlerini müşterinize açıkça gösterin." },
];
const faq = [
  { q: "Müşterim uygulama indirmek zorunda mı?", a: "Hayır. Katalog bağlantısı veya QR magnet üzerinden tarayıcıda açılır. Müşteriniz ürünleri seçip sepetini oluşturabilir." },
  { q: "Konum paylaşmak zorunlu mu?", a: "Hayır. Müşteriniz konum eklemeyi seçer ve cihazındaki konum iznini onaylarsa konum bağlantısı sipariş mesajına eklenir. Yazılı adres ve sipariş notu alanları da kullanılabilir." },
  { q: "Sipariş WhatsApp üzerinden nasıl gönderilir?", a: "Müşteri sepetini ve bilgilerini tamamladığında sipariş mesajı hazırlanır. WhatsApp üzerinden gönderimi müşteri tamamlar. Konum paylaşmışsa bağlantısı da mesajda yer alır; sipariş kayıtları panelden takip edilebilir." },
  { q: "200 adet QR magnet hangi pakette hediye?", a: "Market işletmelerine Kurumsal pakette 200 adet QR kodlu magnet hediye edilir. Müşteriniz magneti okutarak marketinizin kataloğuna ulaşır. Bu hediye market işletmelerine özeldir." },
  { q: "Marketler ve toptancılar için fiyatlar farklı mı?", a: "Hayır. Aynı paketlerin fiyatları ve limitleri ortaktır. Sektöre göre kullanım örnekleri değişir; marketlere özel 200 magnet hediyesi Kurumsal pakette sunulur." },
  { q: "Her müşteriye bildirim gönderebilir miyim?", a: "Kampanya bildirimleri bildirim izni veren müşterilere gönderilir. Bildirimlerin ulaşması müşterinin cihazına, tarayıcısına ve izin ayarlarına bağlıdır. Kampanya bildirimi gönderme Profesyonel ve Kurumsal paketlerde bulunur." },
];
const FLOW = [
  ["Magneti okutur veya bağlantıyı açar", "Müşteriniz buzdolabındaki QR magnetten ya da paylaştığınız bağlantıdan marketinizin kataloğuna ulaşır."],
  ["Ürünleri ve teslimat bilgilerini seçer", "Ürünleri sepete ekler; adresini, sipariş notunu ve isterse konum bilgisini paylaşır."],
  ["Siparişini WhatsApp’tan gönderir", "Hazırlanan sipariş mesajını size iletir. Siz panelde siparişini takip eder, hazırlık sürecini yönetirsiniz."],
];

// TASLAK (14 Eki 2026): market sayfası Beacons dilinde; metinler ve şema aynı.
export default function MarketPage() {
  const schema = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana sayfa", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Sektörler", item: `${SITE.url}/sektorler` },
      { "@type": "ListItem", position: 3, name: "Market & Bakkallar", item: `${SITE.url}/sektorler/market-bakkal` },
    ] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />

    <PageHero
      breadcrumb={<Breadcrumb items={[{ href: "/sektorler", label: "Sektörler" }, { label: "Market & Bakkallar" }]} />}
      eyebrow="Mahallenizin marketi, müşterinizin cebinde"
      title={<>Market siparişlerinizi konum bilgisiyle <Accent>WhatsApp’tan alın.</Accent></>}
      lead="Ürünlerinizi online kataloğunuzda sunun. Müşteriniz sepetini oluştursun, adresini ve isterse konumunu ekleyip siparişini size iletsin."
      actions={<><ButtonLink href="/basvuru?sektor=market-bakkal" tone="navy" size="lg" className="px-9">Marketinizi ücretsiz açın</ButtonLink><ButtonLink href="https://marketgo.ekatalox.com" tone="outline" size="lg" external>MarketGo demosunu incele <ArrowUpRight className="size-4" aria-hidden /></ButtonLink></>}
      className="pb-6 sm:pb-8"
    >
      <p className="mt-6 text-center text-sm text-brand-muted">Uygulama indirmeden katalog erişimi · Sipariş başına eKatalox komisyonu yok</p>
      <div className="relative mx-auto mt-12 flex max-w-5xl flex-col items-center gap-8 overflow-hidden rounded-[32px] p-8 sm:flex-row sm:p-12" style={pastelStyle(0)}>
        <figure className="w-full max-w-[250px] shrink-0 sm:max-w-[270px]">
          <div className="overflow-hidden rounded-[2rem] border-[5px] border-white/70 shadow-2xl"><Image src="/site/demo-market-iphone.png" alt="MarketGo mobil kataloğu: görselli kategoriler ve altta sabit Ara, Sepet, Kampanyalar menüsü" width={1206} height={2622} priority sizes="270px" className="h-auto w-full" /></div>
          <figcaption className="mt-3 text-center text-xs text-brand-navy/60">MarketGo demo mağazasından gerçek ekran. Fiyat ve kampanyalar örnektir.</figcaption>
        </figure>
        <div className="text-left">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-white/80 p-4"><QrCode className="size-7 shrink-0 text-brand-navy" aria-hidden /><p className="text-sm"><strong className="block text-brand-navy">Kurumsal pakette 200 QR magnet hediye</strong><span className="text-brand-navy/70">Market işletmelerine özel.</span></p></div>
          <h2 className="mt-6 text-3xl font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-navy sm:text-4xl">Kataloğu açar. Sepetini doldurur. Size iletir.</h2>
          <ol className="mt-6 space-y-3">
            {FLOW.map(([title, body], i) => <li key={title} className="flex gap-3 rounded-2xl bg-white/70 p-4"><span className="text-2xl font-extrabold tracking-[-0.03em] text-brand-navy">0{i + 1}</span><span><span className="block font-semibold text-brand-navy">{title}</span><span className="block text-sm leading-relaxed text-brand-navy/70">{body}</span></span></li>)}
          </ol>
        </div>
      </div>
    </PageHero>

    <section className="bg-white pb-16 sm:pb-20">
      <Container className="grid items-center gap-8 lg:grid-cols-[1fr_1.5fr]">
        <div className="flex justify-center rounded-[28px] p-8" style={pastelStyle(3)}>
          <figure className="w-full max-w-[280px]"><Image src="/site/demo-konum.png" alt="Market sipariş formunda isteğe bağlı şu anki konumumu ekle seçeneği, adres ve sipariş notu" width={780} height={1688} sizes="280px" className="h-auto w-full rounded-3xl border border-white/70 shadow-lg" /><figcaption className="mt-3 text-center text-xs text-brand-navy/60">Gerçek sipariş ekranı; tutarlar demo ayarlarını gösterir.</figcaption></figure>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-green">Teslimat için daha net bilgi</p>
          <h2 className="mt-3 text-balance text-3xl font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-navy sm:text-5xl">“<Accent>Konum atar mısınız?</Accent>” konuşmasını siparişin içinde çözün.</h2>
          <p className="mt-5 text-lg leading-relaxed text-brand-muted">Müşteriniz yazılı adresinin yanında konumunu da ekleyebilir. Konum bağlantısı WhatsApp sipariş mesajında yer alır; teslimat için ihtiyaç duyduğunuz bilgileri birlikte görürsünüz.</p>
          <p className="mt-4 leading-relaxed text-brand-muted">Konum paylaşımı müşterinin tercihine ve cihaz iznine bağlıdır. Apartman, daire ve teslimat notu gibi ayrıntılar için adres ve sipariş notu alanlarını kullanabilirsiniz.</p>
        </div>
      </Container>
    </section>

    <section className="bg-white pb-16 sm:pb-20">
      <Container>
        <h2 className="text-center text-3xl font-extrabold tracking-[-0.03em] text-brand-navy sm:text-4xl">Siparişten kampanyaya, günlük işiniz için.</h2>
        <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }, i) => <BandCard key={title} index={i + 1} band={<div className="flex w-full items-end gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-brand-navy"><Icon className="size-6" aria-hidden /></span><h3 className="text-xl font-extrabold leading-tight tracking-[-0.02em] text-brand-navy">{title}</h3></div>}>
            <p className="text-[15px] leading-relaxed text-brand-muted">{body}</p>
          </BandCard>)}
        </div>
      </Container>
    </section>

    <section className="bg-white pb-16 sm:pb-20">
      <Container>
        <div className="grid items-center gap-10 overflow-hidden rounded-[32px] bg-brand-dark p-8 text-white sm:p-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-neon">QR magnet hediyesi</p>
            <h2 className="mt-4 text-balance text-3xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">Marketinizin adresi, müşterinizin buzdolabında.</h2>
            <p className="mt-5 text-lg leading-relaxed text-white/75">Müşterinizin yeniden sipariş vermek için bağlantınızı araması gerekmesin. QR kodlu magneti okutsun, kataloğunuzu açsın, ihtiyaçlarını sepete eklesin.</p>
            <p className="mt-4 leading-relaxed text-white/65">Magnetlerin okutulma sayılarını ve müşteri eşleşmelerini panelinizden takip ederek dağıttığınız magnetlerin kullanımını görebilirsiniz.</p>
            <div className="mt-7 rounded-2xl border border-brand-neon/25 bg-brand-neon/10 p-6">
              <p className="text-4xl font-extrabold tracking-[-0.03em] text-white">200 adet <span className="text-xl font-semibold text-brand-neon">hediye</span></p>
              <h3 className="mt-3 text-xl font-semibold">6 × 9 cm QR kodlu buzdolabı magneti</h3>
              <p className="mt-3 leading-relaxed text-white/70">Kurumsal paketi seçen market işletmelerine özel.</p>
              <div className="mt-5"><ButtonLink href="/fiyatlandirma?gorunum=market">Paket kapsamını incele</ButtonLink></div>
            </div>
          </div>
          <figure className="mx-auto w-full max-w-[320px]">
            <Image src="/site/market-qr-magnet-6x9.png" alt="Marketlere verilen 6 × 9 cm QR kodlu magnet tasarımı: Kapına Gelsin, kameranı aç ve okut" width={1419} height={2127} sizes="(max-width: 640px) 85vw, 320px" className="h-auto w-full rounded-2xl border border-white/15 shadow-2xl" />
            <figcaption className="mt-4 text-center"><span className="inline-block rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/80">6 × 9 cm · Gerçek magnet tasarımı</span></figcaption>
          </figure>
        </div>
      </Container>
    </section>

    <section className="bg-white pb-16 sm:pb-20">
      <Container className="max-w-4xl">
        <h2 className="text-center text-3xl font-extrabold tracking-[-0.03em] text-brand-navy sm:text-4xl">Market sahiplerinin merak ettikleri</h2>
        <div className="mt-8"><FaqList items={faq} /></div>
      </Container>
    </section>

    <section className="bg-white pb-8">
      <Container>
        <TintBox index={2} className="text-center">
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-brand-navy sm:text-4xl">Müşterinizin göreceği kataloğu deneyin.</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-brand-navy/70">MarketGo, market kullanımını inceleyebileceğiniz demo mağazamızdır. Kategorileri, mobil sepeti ve sipariş ekranlarını keşfedin.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3"><ButtonLink href="https://marketgo.ekatalox.com" tone="navy" external>MarketGo demosunu aç</ButtonLink><ButtonLink href="/fiyatlandirma?gorunum=market" tone="white">Market paketlerini karşılaştır</ButtonLink></div>
          <p className="mt-5 text-sm text-brand-navy/70">Ürünlerinizi topluca aktarmak için <Link href="/ozellikler/toplu-urun-yukleme" className="font-semibold text-brand-navy underline">toplu ürün yüklemeyi</Link>, ödeme seçenekleri için <Link href="/ozellikler/online-odeme" className="font-semibold text-brand-navy underline">İyzico/Paytr entegrasyonunu</Link> inceleyin.</p>
        </TintBox>
      </Container>
    </section>
    <CustomerMarquee />
    <ClosingCta title="Marketinizi bugün açın, ilk siparişi bu hafta alın." lead="250 ürünle ücretsiz, kart istenmez, komisyon yok." primaryHref="/basvuru?sektor=market-bakkal" primaryLabel="Marketinizi ücretsiz açın" index={0} />
  </>;
}
