import Image from "next/image";
import Link from "next/link";
import { MapPin, ShoppingBasket, Bell, Clock3, PackageCheck, QrCode, ArrowUpRight, Languages } from "lucide-react";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { SITE } from "@/lib/marketing/site";

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
    <Section tone="navy" glow className="py-10 sm:py-14">
      <Container>
        <nav aria-label="Sayfa yolu" className="mb-8 text-sm text-white/60"><Link href="/sektorler" className="hover:text-white">Sektörler</Link><span aria-hidden> / </span><span aria-current="page">Market & Bakkallar</span></nav>
        <div className="grid items-center gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-neon">Mahallenizin marketi, müşterinizin cebinde</p>
            <h1 className="mt-5 max-w-2xl text-balance text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">Market siparişlerinizi konum bilgisiyle WhatsApp’tan alın.</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">Ürünlerinizi online kataloğunuzda sunun. Müşteriniz sepetini oluştursun, adresini ve isterse konumunu ekleyip siparişini size iletsin.</p>
            <div className="mt-8 flex flex-wrap gap-3"><ButtonLink href="/basvuru?sektor=market-bakkal">Marketinizi ücretsiz açın</ButtonLink><ButtonLink href="https://marketgo.ekatalox.com" tone="outline-dark">MarketGo demosunu incele <ArrowUpRight className="ml-2 size-4" aria-hidden /></ButtonLink><ButtonLink href="/fiyatlandirma?gorunum=market" tone="outline-dark">Market paketlerini gör</ButtonLink></div>
            <p className="mt-5 text-sm text-white/60">Uygulama indirmeden katalog erişimi · Sipariş başına eKatalox komisyonu yok</p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-brand-neon/25 bg-brand-neon/10 p-4"><QrCode className="size-6 shrink-0 text-brand-neon" aria-hidden /><p className="text-sm"><strong className="block text-white">Kurumsal pakette 200 QR magnet hediye</strong><span className="text-white/65">Market işletmelerine özel.</span></p></div>
          </div>
          <figure className="mx-auto w-full max-w-[250px] sm:max-w-[270px]">
            <div className="overflow-hidden rounded-[2rem] border-[5px] border-white/15 shadow-2xl"><Image src="/site/demo-market-iphone.png" alt="MarketGo mobil kataloğu: görselli kategoriler ve altta sabit Ara, Sepet, Kampanyalar menüsü" width={1206} height={2622} priority sizes="270px" className="h-auto w-full" /></div>
            <figcaption className="mt-3 text-center text-xs text-white/55">MarketGo demo mağazasından gerçek ekran. Görseldeki fiyat ve kampanyalar örnektir.</figcaption>
          </figure>
        </div>
      </Container>
    </Section>
    <Section tone="white"><Container>
      <SectionHeading eyebrow="Sipariş akışı" title="Kataloğu açar. Sepetini doldurur. Size iletir." />
      <ol className="mt-9 grid gap-6 md:grid-cols-3">{[
        ["Magneti okutur veya bağlantıyı açar", "Müşteriniz buzdolabındaki QR magnetten ya da paylaştığınız bağlantıdan marketinizin kataloğuna ulaşır."],
        ["Ürünleri ve teslimat bilgilerini seçer", "Ürünleri sepete ekler; adresini, sipariş notunu ve isterse konum bilgisini paylaşır."],
        ["Siparişini WhatsApp’tan gönderir", "Hazırlanan sipariş mesajını size iletir. Siz panelde siparişini takip eder, hazırlık sürecini yönetirsiniz."],
      ].map(([title, body], i) => <li key={title} className="rounded-2xl border border-brand-line p-6"><span className="font-plex-mono text-sm text-brand-green">0{i + 1}</span><h2 className="mt-4 text-xl font-semibold text-brand-navy">{title}</h2><p className="mt-3 leading-relaxed text-brand-muted">{body}</p></li>)}</ol>
    </Container></Section>
    <Section><Container className="grid items-center gap-10 lg:grid-cols-[1fr_1.5fr]">
      <figure className="mx-auto w-full max-w-[300px]"><Image src="/site/demo-konum.png" alt="Market sipariş formunda isteğe bağlı şu anki konumumu ekle seçeneği, adres ve sipariş notu" width={780} height={1688} sizes="300px" className="h-auto w-full rounded-3xl border border-brand-line shadow-lg" /><figcaption className="mt-3 text-center text-xs text-brand-muted">Gerçek sipariş ekranı; tutarlar demo ayarlarını gösterir.</figcaption></figure>
      <div><SectionHeading eyebrow="Teslimat için daha net bilgi" title="“Konum atar mısınız?” konuşmasını siparişin içinde çözün." lead="Müşteriniz yazılı adresinin yanında konumunu da ekleyebilir. Konum bağlantısı WhatsApp sipariş mesajında yer alır; teslimat için ihtiyaç duyduğunuz bilgileri birlikte görürsünüz." /><p className="mt-5 leading-relaxed text-brand-muted">Konum paylaşımı müşterinin tercihine ve cihaz iznine bağlıdır. Apartman, daire ve teslimat notu gibi ayrıntılar için adres ve sipariş notu alanlarını kullanabilirsiniz.</p></div>
    </Container></Section>
    <Section tone="white"><Container><SectionHeading eyebrow="Marketinize uygun araçlar" title="Siparişten kampanyaya, günlük işiniz için." /><div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{features.map(({ icon: Icon, title, body }) => <article key={title} className="rounded-2xl border border-brand-line p-6"><Icon className="size-6 text-brand-green" aria-hidden /><h3 className="mt-5 text-lg font-semibold text-brand-navy">{title}</h3><p className="mt-3 text-sm leading-relaxed text-brand-muted">{body}</p></article>)}</div></Container></Section>
    <Section tone="navy"><Container className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
      <div><p className="text-sm font-semibold text-brand-neon">QR MAGNET HEDİYESİ</p><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Marketinizin adresi, müşterinizin buzdolabında.</h2><p className="mt-5 text-lg leading-relaxed text-white/75">Müşterinizin yeniden sipariş vermek için bağlantınızı araması gerekmesin. QR kodlu magneti okutsun, kataloğunuzu açsın, ihtiyaçlarını sepete eklesin.</p><p className="mt-4 leading-relaxed text-white/65">Magnetlerin okutulma sayılarını ve müşteri eşleşmelerini panelinizden takip ederek dağıttığınız magnetlerin kullanımını görebilirsiniz.</p>
        <div className="mt-7 rounded-2xl border border-brand-neon/25 bg-brand-neon/10 p-6">
          <p className="text-4xl font-bold text-white">200 adet <span className="text-xl font-semibold text-brand-neon">hediye</span></p>
          <h3 className="mt-3 text-xl font-semibold">6 × 9 cm QR kodlu buzdolabı magneti</h3>
          <p className="mt-3 leading-relaxed text-white/70">Kurumsal paketi seçen market işletmelerine özel.</p>
          <div className="mt-5"><ButtonLink href="/fiyatlandirma?gorunum=market">Paket kapsamını incele</ButtonLink></div>
        </div>
      </div>
      <figure className="mx-auto w-full max-w-[320px]">
        <Image src="/site/market-qr-magnet-6x9.png" alt="Marketlere verilen 6 × 9 cm QR kodlu magnet tasarımı: Kapına Gelsin, kameranı aç ve okut" width={1419} height={2127} sizes="(max-width: 640px) 85vw, 320px" className="h-auto w-full rounded-2xl border border-white/15 shadow-2xl" />
        <figcaption className="mt-4 text-center"><span className="inline-block rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/80">6 × 9 cm · Gerçek magnet tasarımı</span></figcaption>
      </figure>
    </Container></Section>
    <Section tone="white"><Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr]"><SectionHeading eyebrow="Sık sorulanlar" title="Market sahiplerinin merak ettikleri" /><dl className="divide-y divide-brand-line">{faq.map(({ q, a }) => <div key={q} className="py-5 first:pt-0"><dt className="font-semibold text-brand-navy">{q}</dt><dd className="mt-3 leading-relaxed text-brand-muted">{a}</dd></div>)}</dl></Container></Section>
    <Section><Container><SectionHeading title="Müşterinizin göreceği kataloğu deneyin." lead="MarketGo, market kullanımını inceleyebileceğiniz demo mağazamızdır. Kategorileri, mobil sepeti ve sipariş ekranlarını keşfedin." /><div className="mt-7 flex flex-wrap gap-3"><ButtonLink href="https://marketgo.ekatalox.com">MarketGo demosunu aç</ButtonLink><ButtonLink href="/fiyatlandirma?gorunum=market" tone="outline">Market paketlerini karşılaştır</ButtonLink></div><p className="mt-5 text-sm text-brand-muted">Ürünlerinizi topluca aktarmak için <Link href="/ozellikler/toplu-urun-yukleme" className="font-semibold text-brand-green underline">toplu ürün yüklemeyi</Link>, ödeme seçenekleri için <Link href="/ozellikler/online-odeme" className="font-semibold text-brand-green underline">İyzico/Paytr entegrasyonunu</Link> inceleyin.</p></Container></Section>
  </>;
}
