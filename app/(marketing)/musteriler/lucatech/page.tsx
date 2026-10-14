import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { ButtonLink, Container } from "@/components/marketing/ui";
import { Accent, BandCard, Breadcrumb, ClosingCta, CustomerMarquee, PageHero, TintBox, pastelStyle } from "@/components/marketing/home-v2/page-kit";

// Müşteri hikâyesi (14 Eki 2026). Yalnız gerçek veri: ürün/varyant sayıları ve
// kullanılan özellikler Lucatech'in canlı kataloğundan (toptan.lucatech.com.tr).
export const metadata = marketingMetadata(
  "/musteriler/lucatech",
  "Lucatech: Bayi Kataloğu ve BizimHesap Entegrasyonu",
  "Lucatech 163 ürün ve 274 varyantlık toptan kataloğunu eKatalox'a taşıdı: bayiler şifreyle giriyor, onaylanan sipariş BizimHesap'a satış fişi olarak düşüyor.",
);

const NUMBERS = [
  { stat: "163", label: "ürün, 43'ü renk ve model seçenekli" },
  { stat: "274", label: "varyant tek katalogda" },
  { stat: "4", label: "fiyat listesi: bayi, perakende ve özel gruplar" },
  { stat: "2", label: "bayisi kendi kataloğunu eKatalox'ta açtı" },
];

const STEPS = [
  { title: "Katalog ve bayi şifreleri", body: "Kulaklık, şarj aleti, kablo ve aksesuar ürünleri kod, varyant ve görselleriyle yüklendi. Her bayi grubuna ayrı şifre verildi; bayi toptan.lucatech.com.tr adresini açıp kendi fiyat listesiyle giriyor." },
  { title: "Marka renkleri ve kurumsal site", body: "Katalog Lucatech'in turuncu ve koyu gri kimliğiyle giydirildi; 16 kategoriye özel banner yapıldı. Kurumsal pakete dahil tanıtım sitesi aynı adres altında yayınlandı, bayi başvuruları oradan geliyor." },
  { title: "Siparişler BizimHesap'a", body: "Panelde onaylanan her sipariş BizimHesap'a taslak satış fişi olarak düşüyor. Ürünler barkodla eşleşiyor, depo seçimi sipariş onayında yapılıyor; siparişi ikinci kez yazan kimse yok." },
  { title: "Bayilere bildirim ve bayi katalogları", body: "Kampanya ve yeni ürün haberleri bildirim açan bayilerin telefonuna gidiyor. İki Lucatech bayisi kendi müşterileri için Lucatech kataloğunun fiyatsız kopyasını eKatalox'ta açtı." },
];

export default function LucatechStoryPage() {
  return (
    <>
      <PageHero
        breadcrumb={<Breadcrumb items={[{ href: "/", label: "Ana sayfa" }, { href: "/musteriler", label: "Müşteriler" }, { label: "Lucatech" }]} />}
        eyebrow="Müşteri hikâyesi · Lucatech"
        title={<>274 varyantlı katalog, <Accent>tek adreste.</Accent></>}
        lead="Lucatech, ses ve şarj aksesuarlarını bayilerine PDF yerine şifreli katalogdan sunuyor; onaylanan sipariş BizimHesap'a kendi kendine işleniyor."
        actions={<><ButtonLink href="https://toptan.lucatech.com.tr" tone="navy" size="lg" external>Kataloğu gör</ButtonLink><ButtonLink href="/ozellikler/bizimhesap-entegrasyonu" tone="outline" size="lg">BizimHesap entegrasyonu</ButtonLink></>}
        className="pb-6 sm:pb-8"
      >
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {NUMBERS.map((n, i) => (
            <div key={n.stat + n.label} className="rounded-[24px] p-6 text-center" style={pastelStyle(i)}>
              <p className="text-5xl font-extrabold leading-none tracking-[-0.04em] text-brand-navy">{n.stat}</p>
              <p className="mt-2 text-sm font-medium text-brand-navy/70">{n.label}</p>
            </div>
          ))}
        </div>
      </PageHero>

      <section className="bg-white pb-16 sm:pb-20">
        <Container className="grid gap-6 lg:grid-cols-2">
          <figure className="overflow-hidden rounded-[24px] border border-brand-line bg-white shadow-[0_24px_50px_-36px_rgba(18,40,74,0.4)]">
            <Image src="/site/blog/lucatech-giris.webp" alt="Lucatech bayi kataloğunun şifreli giriş ekranı" width={1280} height={800} sizes="(max-width: 1024px) 100vw, 560px" className="h-auto w-full" />
            <figcaption className="px-5 py-3 text-sm text-brand-muted">Bayi girişi: her bayi grubu kendi şifresiyle kendi fiyat listesine girer.</figcaption>
          </figure>
          <figure className="overflow-hidden rounded-[24px] border border-brand-line bg-white shadow-[0_24px_50px_-36px_rgba(18,40,74,0.4)]">
            <Image src="/site/blog/lucatech-kurumsal.webp" alt="Lucatech kurumsal tanıtım sitesi" width={1280} height={680} sizes="(max-width: 1024px) 100vw, 560px" className="h-auto w-full" />
            <figcaption className="px-5 py-3 text-sm text-brand-muted">Kurumsal site: ürünler herkese açık, bayi fiyatları kataloğun içinde.</figcaption>
          </figure>
        </Container>
      </section>

      <section className="bg-white pb-16 sm:pb-20">
        <Container>
          <h2 className="text-center text-3xl font-extrabold tracking-[-0.03em] text-brand-navy sm:text-4xl">Dört adımda neler kuruldu</h2>
          <div className="mt-9 grid gap-6 md:grid-cols-2">
            {STEPS.map((s, i) => (
              <BandCard key={s.title} index={i} band={<div className="flex w-full items-end justify-between"><span className="text-5xl font-extrabold leading-none tracking-[-0.04em] text-brand-navy">0{i + 1}</span><h3 className="max-w-[60%] text-right text-xl font-extrabold leading-tight tracking-[-0.02em] text-brand-navy">{s.title}</h3></div>}>
                <p className="leading-relaxed text-brand-muted">{s.body}</p>
              </BandCard>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white pb-16 sm:pb-20">
        <Container>
          <TintBox index={0}>
            <blockquote className="text-balance text-2xl font-medium leading-snug text-brand-navy sm:text-3xl">
              “Bayilerimiz artık fiyat listesi istemiyor; şifreyle giriyor, kendi fiyatını görüyor, siparişi fiş olarak gönderiyor. Onayladığımız sipariş doğrudan BizimHesap&apos;a düşüyor, ikinci kez yazmıyoruz.”
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span className="flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-brand-dark p-2 shadow-sm"><Image src="/gate/lucatech/logo-mark.png" alt="Lucatech logosu" width={48} height={48} className="h-10 w-auto object-contain" /></span>
              <span><span className="block font-semibold text-brand-navy">Şerafettin</span><span className="block text-sm text-brand-navy/70">Lucatech · Teknoloji Firması</span></span>
            </figcaption>
          </TintBox>
          <p className="mt-8 text-center">
            <Link href="/ozellikler" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green hover:underline">
              Lucatech&apos;in kullandığı özellikler <ArrowRight className="size-4" aria-hidden />
            </Link>
          </p>
        </Container>
      </section>
      <CustomerMarquee />
      <ClosingCta title="Sizin kataloğunuz da böyle çalışsın." lead="Listenizi gönderin, kataloğu biz kuralım. Kart Yok, Komisyon Yok, Ücretsiz Başla." index={1} secondary={<Link href="/ozellikler/kurulum-destegi" className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-base font-semibold text-brand-navy hover:bg-brand-paper">Ürünlerinizi biz yükleyelim</Link>} />
    </>
  );
}
