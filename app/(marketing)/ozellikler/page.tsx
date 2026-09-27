import { marketingMetadata } from "@/lib/marketing/metadata";

import Link from "next/link";
import { MARKETING_FEATURES } from "@/lib/marketing/features";
import { ArrowRight } from "lucide-react";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { SITE } from "@/lib/marketing/site";

export const metadata = marketingMetadata(
  "/ozellikler",
  "Dijital Katalog ve B2B Sipariş Özellikleri",
  "Şifreli bayi kataloğu, farklı fiyat listeleri, toplu ürün yükleme, WhatsApp sipariş, kampanya bildirimleri ve raporlama özelliklerini inceleyin.",
);

type PlanTag = "Başlangıç" | "Profesyonel" | "Kurumsal";

interface Feature {
  title: string;
  body: string;
  /** Yalnız bu paket ve üstünde. Boşsa ücretsiz planda da var. */
  from?: PlanTag;
}

interface FeatureGroup {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  features: Feature[];
}

const GROUPS: FeatureGroup[] = [
  {
    id: "katalog",
    eyebrow: "Katalog",
    title: "PDF yerine canlı katalog",
    lead: "Ürünleri bir kez yüklersiniz; fiyat değişince bayi o an güncelini görür. Yeni PDF göndermek biter.",
    features: [
      { title: "Şifreli bayi girişi", body: "Fiyatlar herkese açık değil. Bayi şifresiyle girer; şifresiz ziyaretçi isterseniz yalnız ürünleri, fiyatsız görür." },
      { title: "Fiyat listeleri", body: "Bayi, perakende, özel müşteri. Her şifre ayrı listeye açılır; bayi, giriş yaptığı listeye ait fiyatları görür. Ücretsiz planda 2, Başlangıç'ta 3, Profesyonel'de 15; Kurumsal'da sınırsız fiyat listesi." },
      { title: "Koli, paket, adet ve varyant", body: "Ürün başına koli içi adet; renk, beden, model gibi varyantlar. Bayi koli seçer, tutar kendiliğinden hesaplanır." },
      { title: "Excel ile toplu yükleme", body: "Şablonu indirin, doldurun, yükleyin. Fiyat güncellemesini de Excel ile toplu yaparsınız. Görselleri model/SKU koduyla eşleştirerek toplu yükleyin; ZIP dosyalarını kullanın." },
      { title: "Kategori düzeni ve arama", body: "Kategori ve alt kategori, ürün kodu ve ada göre arama, stokta olmayanı gizleme." },
      { title: "Fiyatsız katalog modu", body: "Sadece ürünleri göstermek istediğiniz müşteriler için fiyatsız görünüm; sipariş yerine ürün listesi gönderir." },
    ],
  },
  {
    id: "siparis",
    eyebrow: "Sipariş",
    title: "Sipariş yazılı, düzenli ve WhatsApp'ınızda",
    lead: "Sesli mesajdan sipariş çözmek biter. Bayi sepetini doldurur, PDF sipariş fişinin bağlantısını WhatsApp üzerinden paylaşır.",
    features: [
      { title: "WhatsApp'a PDF sipariş", body: "Ürün kodu, adet, koli, birim fiyat ve toplam düzenli bir PDF fişinde. Cari adı, telefon ve not fişin üstünde." },
      { title: "Sipariş formu alanları", body: "Ad, telefon, adres ve not alanlarının görünürlüğünü ve zorunluluğunu siz seçin. İhtiyacınız olan bilgileri isteyin; sipariş formunu sade tutun." },
      { title: "Siparişlerim ve yeni sipariş bildirimi", body: "Siparişlerinizi Siparişlerim sayfasından takip edin. Bildirimleri açtıysanız yeni sipariş geldiğinde haberdar olun." },
      { title: "Minimum sepet tutarı", body: "Minimum sepet tutarı belirleyin; müşteri siparişini belirlediğiniz tutara tamamlasın. Tek para birimli sepetlerde uygulanır." },
      { title: "WhatsApp alıcısını seçme", body: "Siparişi kayıtlı numaranıza yönlendirin veya bu seçeneği kapatıp müşterinizin kendi toptancısı dahil istediği kişiye göndermesine izin verin. Mesajı müşteri WhatsApp’ta gönderir." },
      { title: "İyzico/Paytr ile ödeme", body: "İyzico/Paytr entegrasyonuyla kataloğunuzdan ödeme alın.", from: "Kurumsal" },
      { title: "Sepet önerileri", body: "Sepetteki ürünle birlikte alınanları önerir; bayi eksik kalemi hatırlar, sepet büyür." },
      { title: "Ödeme ve vade ayarları", body: "Peşin indirimi, kart taksit seçenekleri, vadeye göre fiyat notu. Bayi sipariş verirken görür.", from: "Profesyonel" },
    ],
  },
  {
    id: "pazarlama",
    eyebrow: "Bayiyi tutma",
    title: "Kampanya, bildirim, öne çıkanlar",
    lead: "Yeni gelen ürünü, kampanyayı ve indirimi bayi kataloğu açar açmaz görsün; ya da telefonuna bildirim düşsün.",
    features: [
      { title: "Banner ve kampanya kartları", body: "Üstte banner, altında kampanya kartları. Tarih aralığı ve fiyat listesine göre kampanya tanımlayın." },
      { title: "İndirimli ürün ve öne çıkanlar", body: "İndirim etiketi, indirimli ürünler bölümü, öne çıkan ürünler ve çok satanlar." },
      { title: "Bayilere anlık bildirim", body: "Bildirim açan bayilerin telefonuna 'yeni ürün geldi', 'stok yenilendi', 'kampanya başladı'. Bildirim izni ve cihaz desteğine bağlıdır.", from: "Profesyonel" },
      { title: "Açılış duyurusu", body: "Duyuru penceresine kendi başlığınızı ve metninizi yazın. Teslimat takvimi, kampanya koşulları ve önemli haberleri katalog açılışında gösterin." },
      { title: "Tek link ile bildirim aboneliği", body: "firmaniz.ekatalox.com/bildirim linkini gönderin; bayi adını ve numarasını yazıp bildirimleri açar.", from: "Profesyonel" },
    ],
  },
  {
    id: "yonetim",
    eyebrow: "Yönetim",
    title: "Panel telefondan yönetilir",
    lead: "Bilgisayar gerekmez. Fiyat, stok, şifre, kampanya; hepsi telefondan bir dakikada.",
    features: [
      { title: "Raporlar", body: "En çok aranan kelimeleri, sonuçsuz aramaları, görüntülenen ve sepete eklenen ürünleri görün. Ürün bilgisi, sıralama ve kampanyalarınızı buna göre düzenleyin.", from: "Başlangıç" },
      { title: "İl ve fiyat listesi raporu", body: "Hangi illerden hangi fiyat listelerine giriş yapıldığını inceleyin. Bölgesel ilgiye ve bayi gruplarınıza göre aksiyon alın.", from: "Başlangıç" },
      { title: "Satış ve kârlılık", body: "Alış fiyatı girin; ciro, kâr ve marj raporunu görün.", from: "Kurumsal" },
      { title: "Çalışma saatleri ve kapalı modu", body: "Çalışma gün ve saatlerinizi belirleyin. Gerektiğinde mağazayı manuel kapatın; “Mağazamız şu an kapalıdır” mesajıyla müşterilerinizi bilgilendirin." },
      { title: "IP engelleme ve şifre yönetimi", body: "Giriş şifrelerinizi ve erişimleri yönetin; gerektiğinde şifreyi değiştirin veya şüpheli IP’yi engelleyin." },
    ],
  },
  {
    id: "marka",
    eyebrow: "Marka",
    title: "Sizin adınız, sizin renkleriniz",
    lead: "Bayi eKatalox'u değil sizi görür: logonuz, renkleriniz, isterseniz kendi alan adınız.",
    features: [
      { title: "Hazır temalar ve gerçek önizleme", body: "Temayı kendi ürünlerinizle gerçek katalogda önizleyin, beğenirseniz uygulayın." },
      { title: "Gelişmiş görünüm", body: "Yazı tipi, kart stili, üst bölüm ve alt bilgi düzeni, ana sayfa blokları." },
      { title: "Pakete dahil kurumsal site", body: "Kurumsal pakette firmanızı ve ürünlerinizi tanıtan sitenizi ayrıca kurumsal site paket ücreti ödemeden oluşturun.", from: "Kurumsal" },
      { title: "Bayimiz ol formu", body: "Kurumsal sitenizden bayi başvuruları alın; gelen talepleri panelden inceleyin.", from: "Kurumsal" },
      { title: "Aramalara uygun açık tanıtım", body: "Firmanızı ve ürünlerinizi Google ve yapay zekâ destekli aramaların erişebileceği SEO uyumlu açık sayfalarda tanıtın. Bayi fiyatları açık kurumsal sayfalarda yayınlanmaz.", from: "Kurumsal" },
      { title: "Kendi alan adınız", body: "katalog.firmaniz.com ya da firmaniz.com. DNS ayarını biz anlatırız, bağlantıyı biz yaparız.", from: "Kurumsal" },
      { title: "Ana ekrana ekleme", body: "Bayi kataloğu telefonuna uygulama gibi ekler; sizin logonuzla açılır, bildirim alır." },
    ],
  },
];

export default function OzelliklerPage() {
  return (
    <>
      <Section tone="white" className="pb-10 sm:pb-14">
        <Container>
          <SectionHeading
            eyebrow="Özellikler"
            as="h1"
            title="Toptan satışın gerektirdiği kadar, fazlası değil"
            lead="Bayi fiyatlarından sipariş kurallarına, raporlardan kurumsal sitenize kadar işletmenizin günlük işlerini tek yerden yönetin. Etiketsiz özellikler Ücretsiz planda da var."
          />
          <nav aria-label="Özellik grupları" className="mt-8 flex flex-wrap gap-2">
            {GROUPS.map((g) => (
              <a key={g.id} href={`#${g.id}`} className="rounded-full border border-brand-line bg-white px-4 py-2 text-sm font-medium text-brand-ink hover:border-brand-navy">
                {g.eyebrow}
              </a>
            ))}
          </nav>
          <p className="mt-6 text-sm text-brand-muted">
            <span className="mr-2 inline-block rounded-sm bg-brand-navy-soft px-2 py-0.5 text-xs font-semibold text-brand-navy">Paket adı</span>
            işaretli özellikler o paket ve üstünde bulunur.
          </p>
        </Container>
      </Section>

      {GROUPS.map((g, i) => (
        <Section key={g.id} id={g.id} tone={i % 2 === 0 ? "paper" : "white"} className="scroll-mt-20">
          <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
            <SectionHeading eyebrow={g.eyebrow} title={g.title} lead={g.lead} />
            <dl className="divide-y divide-brand-line border-y border-brand-line">
              {g.features.map((f) => (
                <div key={f.title} className="grid gap-2 py-5 sm:grid-cols-[1fr_1.4fr] sm:gap-8">
                  <dt className="flex flex-wrap items-center gap-2 font-semibold text-brand-navy">
                    {f.title}
                    {f.from ? (
                      <span className="rounded-sm bg-brand-navy-soft px-2 py-0.5 text-xs font-semibold text-brand-navy">{f.from}</span>
                    ) : null}
                  </dt>
                  <dd className="text-[15px] leading-relaxed text-brand-muted">{f.body}</dd>
                </div>
              ))}
            </dl>
          </Container>
        </Section>
      ))}

      <Section tone="white">
        <Container>
          <SectionHeading title="İşinize nasıl uyduğunu ayrıntılarıyla görün" lead="Kullanım örnekleri, paket kapsamı ve kurulum bilgileri." />
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {MARKETING_FEATURES.map((feature) => <Link key={feature.slug} href={`/ozellikler/${feature.slug}`} className="rounded-2xl border border-brand-line p-6 hover:border-brand-green">
              <h3 className="font-semibold text-brand-navy">{feature.title} →</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">{feature.lead}</p>
            </Link>)}
          </div>
        </Container>
      </Section>

      <Section tone="navy">
        <Container className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl">
              Ücretsiz planla başlayın, gerisini kullanırken görün.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/75">Paket karşılaştırması ve fiyatlar için fiyatlandırma sayfasına bakın ya da arayın.</p>
            <Link href="/fiyatlandirma" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:underline">
              Fiyatlandırma <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="flex flex-col gap-4 lg:items-end">
            <ButtonLink href="/basvuru" tone="white" size="lg">
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
