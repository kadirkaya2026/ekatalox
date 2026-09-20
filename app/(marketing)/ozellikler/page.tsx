import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { SITE } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Özellikler",
  description:
    "Şifreli katalog, çoklu fiyat listesi, koli/paket/varyant, WhatsApp'a PDF sipariş, kampanya ve banner, bayilere bildirim, raporlar, kendi alan adı ve tema.",
  alternates: { canonical: "/ozellikler" },
};

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
      { title: "Fiyat listeleri", body: "Bayi, perakende, özel müşteri. Her şifre ayrı listeye açılır; kimse başkasının fiyatını görmez. Ücretsizde 1, Başlangıç'ta 3, üst paketlerde sınırsız liste." },
      { title: "Koli, paket, adet ve varyant", body: "Ürün başına koli içi adet; renk, beden, model gibi varyantlar. Bayi koli seçer, tutar kendiliğinden hesaplanır." },
      { title: "Excel ile toplu yükleme", body: "Şablonu indirin, doldurun, yükleyin. Fiyat güncellemesini de Excel ile toplu yaparsınız. Fotoğraflar toplu eklenir." },
      { title: "Kategori düzeni ve arama", body: "Kategori ve alt kategori, ürün kodu ve ada göre arama, stokta olmayanı gizleme." },
      { title: "Fiyatsız katalog modu", body: "Sadece ürünleri göstermek istediğiniz müşteriler için fiyatsız görünüm; sipariş yerine ürün listesi gönderir." },
    ],
  },
  {
    id: "siparis",
    eyebrow: "Sipariş",
    title: "Sipariş yazılı, düzenli ve WhatsApp'ınızda",
    lead: "Sesli mesajdan sipariş çözmek biter. Bayi sepetini doldurur, siz PDF alırsınız.",
    features: [
      { title: "WhatsApp'a PDF sipariş", body: "Ürün kodu, adet, koli, birim fiyat ve toplam tek sayfada. Cari adı, telefon ve not fişin üstünde." },
      { title: "Sipariş formu alanları", body: "Cari adı zorunlu; adres, telefon ve not alanlarını açıp kapatırsınız. Minimum sepet tutarı koyabilirsiniz." },
      { title: "Panelde sipariş listesi", body: "Bugün oluşan sipariş PDF'leri, tutarı ve kim oluşturdu; Genel Bakış'ta ilk bakışta." },
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
      { title: "Bayilere anlık bildirim", body: "Bildirim açan bayilerin telefonuna 'yeni ürün geldi', 'stok yenilendi', 'kampanya başladı'. Kişi, ürün ya da kategori hedefli.", from: "Profesyonel" },
      { title: "Tek link ile bildirim aboneliği", body: "firmaniz.ekatalox.com/bildirim linkini gönderin; bayi adını ve numarasını yazıp bildirimleri açar.", from: "Profesyonel" },
    ],
  },
  {
    id: "yonetim",
    eyebrow: "Yönetim",
    title: "Panel telefondan yönetilir",
    lead: "Bilgisayar gerekmez. Fiyat, stok, şifre, kampanya; hepsi telefondan bir dakikada.",
    features: [
      { title: "Raporlar", body: "Kim ne zaman girdi, hangi ürünlere baktı, hangi ilden. Bugün sitede kaç kişi var.", from: "Başlangıç" },
      { title: "Satış ve kârlılık", body: "Alış fiyatı girin; ciro, kâr ve marj raporunu görün.", from: "Kurumsal" },
      { title: "Çalışma saatleri ve kapalı modu", body: "Kapalı saatlerde sipariş alınmaz ya da notla alınır. Tatilde kataloğu tek tuşla kapatın." },
      { title: "IP engelleme ve şifre yönetimi", body: "Şifreyi paylaşan bayiyi görün, şifreyi değiştirin; şüpheli IP'yi engelleyin." },
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
      { title: "Kendi alan adınız", body: "katalog.firmaniz.com ya da firmaniz.com. DNS ayarını biz anlatırız, bağlantıyı biz yaparız.", from: "Profesyonel" },
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
            title="Toptan satışın gerektirdiği kadar, fazlası değil"
            lead="Her özellik toptancıların katalogla sipariş alırken yaşadığı bir dertten çıktı. Etiketsiz olanlar Ücretsiz planda da var."
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
