import { marketingMetadata } from "@/lib/marketing/metadata";

import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { SITE } from "@/lib/marketing/site";

export const metadata = marketingMetadata(
  "/sss",
  "Sık Sorulan Sorular: Paketler ve Bayi Şifreleri",
  "Ücretsiz plan, bayi şifreleri, fiyat listeleri, ürün yükleme, WhatsApp sipariş ve paket limitleri hakkındaki sorularınıza yanıt bulun.",
);

interface Faq {
  q: string;
  a: string;
}

interface FaqGroup {
  title: string;
  items: Faq[];
}

const GROUPS: FaqGroup[] = [
{
  "title": "Sipariş kuralları ve takip",
  "items": [
    {
      "q": "Minimum sepet tutarı belirleyebilir miyim?",
      "a": "Evet. Minimum sepet tutarını panelden belirleyebilirsiniz. Bu kontrol tek para birimli sepetlerde uygulanır; birden fazla para birimi içeren sepetlerde uygulanmaz."
    },
    {
      "q": "Müşteri bilgilerinin zorunluluğunu seçebilir miyim?",
      "a": "Evet. Sipariş formunda ad, telefon, adres ve not alanlarının görünürlük ve zorunluluk ayarlarını seçebilirsiniz. İşletmenize gerekli alanları zorunlu tutup gerekmeyenleri kapatabilirsiniz."
    },
    {
      "q": "Siparişleri panelde takip edebilir miyim?",
      "a": "Evet. Siparişler Siparişlerim sayfasında takip edilir. Bildirimleri açtıysanız yeni sipariş geldiğinde bildirim alırsınız."
    },
    {
      "q": "Sipariş her zaman kayıtlı WhatsApp numarama mı gider?",
      "a": "Sabit alıcı seçeneğini kullanırsanız WhatsApp paylaşımı kayıtlı numaranıza yönlenir. Bu seçeneği kapatırsanız müşteriniz göndereceği kişiyi, örneğin kendi toptancısını, WhatsApp üzerinden seçebilir. Paylaşımı tamamlamak için mesajı müşteriniz gönderir."
    },
    {
      "q": "Katalogdan online ödeme alabilir miyim?",
      "a": "İyzico/Paytr entegrasyonuyla kataloğunuzdan ödeme alın. Kurumsal paket kapsamındaki entegrasyon için sağlayıcı hesabınız ve kurulum ihtiyacınız birlikte değerlendirilir. Sağlayıcının işlem ücretleri ve sözleşme koşulları ayrıca geçerlidir."
    }
  ]
},{
  "title": "Raporlar ve müşteri iletişimi",
  "items": [
    {
      "q": "En çok aranan ve sepete eklenen ürünleri görebilir miyim?",
      "a": "Başlangıç ve üzeri paketlerde arama terimlerini, sonuçsuz aramaları, ürün görüntülenmelerini ve sepete eklemeleri inceleyebilirsiniz. Ürün adlarını, görsellerini, sıralamasını ve kampanyaları buna göre düzenleyebilirsiniz. Sepete ekleme sayısı tamamlanmış satış sayısı değildir."
    },
    {
      "q": "Hangi illerden hangi fiyat listesine giriş olduğunu görebilir miyim?",
      "a": "Evet. Başlangıç ve üzeri paketlerde il ve fiyat listesi girişlerini inceleyebilirsiniz. Konum bilgisi yaklaşık bir göstergedir; müşterinin kesin adresi değildir."
    },
    {
      "q": "Müşterilerime kampanya bildirimi gönderebilir miyim?",
      "a": "Profesyonel ve Kurumsal paketlerde bildirim izni veren müşterilerinize kampanya, ürün ve stok duyuruları gönderebilirsiniz. Bunlar tarayıcı/cihaz bildirimleridir; otomatik WhatsApp veya SMS mesajı değildir."
    },
    {
      "q": "Duyuru penceresinin metnini kendim yazabilir miyim?",
      "a": "Evet. Panelden açılış duyurusunun başlığını ve içeriğini düzenleyebilirsiniz. Kampanya koşullarını, teslimat tarihlerini veya işletmenizle ilgili önemli haberleri paylaşabilirsiniz."
    },
    {
      "q": "Çalışma saatlerini ve mağaza kapalı mesajını ayarlayabilir miyim?",
      "a": "Evet. Çalışma gün ve saatlerinizi belirleyebilir, gerektiğinde mağazanızı manuel kapatabilirsiniz. Kapalı durumda müşterileriniz mağazanın kapalı olduğunu belirten mesajla bilgilendirilir."
    }
  ]
},{
  "title": "Kurumsal site ve fiyat gizliliği",
  "items": [
    {
      "q": "Kurumsal site ve Bayimiz ol formu pakete dahil mi?",
      "a": "Evet. Kurumsal pakette ayrıca kurumsal site paket ücreti ödemeden firma ve ürün tanıtım sitenizi oluşturabilir, Bayimiz ol formundan başvuru alabilirsiniz. Başvurular panelden incelenir. Alan adı satın alma ve yenileme giderleri ayrıca değerlendirilir."
    },
    {
      "q": "Kurumsal sitem Google ve yapay zekâ aramalarına uygun mu?",
      "a": "Açık tanıtım sayfaları SEO uyumlu başlıklar, taranabilir içerik, site haritası ve yapılandırılmış verilerle sunulur. Bu altyapı Google ve yapay zekâ destekli arama sistemlerinin içeriğe erişmesini kolaylaştırır. Hangi aramada gösterileceği ilgili sistemin değerlendirmesine bağlıdır."
    },
    {
      "q": "Bayi fiyatlarım Google’da yayınlanır mı?",
      "a": "Açık kurumsal ürün sayfalarında bayi fiyatları yayınlanmaz. Katalog fiyatları, geçerli fiyat listesi erişimiyle görüntülenir. Herkese açık ürün açıklamalarına veya görsellere sizin yazdığınız fiyatlar bu korumadan bağımsızdır."
    },
    {
      "q": "Ürünleri ve fotoğrafları toplu yükleyebilir miyim?",
      "a": "Evet. Excel/XLSX veya CSV dosyalarıyla ürünlerinizi aktarabilir; görselleri model/SKU kodlarıyla eşleştirerek toplu yükleyebilirsiniz. Toplu görsel aracında ZIP dosyaları da kullanılabilir. Paketinizin ürün limiti geçerlidir."
    }
  ]
},
  {
    title: "Ücretsiz plan",
    items: [
      {
        q: "Ücretsiz plan gerçekten ücretsiz mi, süresi var mı?",
        a: "Evet, süresiz. Kart bilgisi istemeyiz, hesap kapanmaz. 250 ürün, 2 fiyat listesi ve aylık 1.000 ziyaretçiyle kataloğunuzu yayınlar, WhatsApp'tan sipariş alırsınız. Karşılığında kataloğunuzda küçük eKatalox tanıtımları görünür.",
      },
      {
        q: "Reklam derken ne görünüyor, bayimi rahatsız eder mi?",
        a: "Sayfanın altında ince bir 'Bu katalog eKatalox ile yapıldı' bandı, ürün listesinde arada bir tanıtım kartı, ürün detayında ve sipariş fişinin altında bir satır. Rakip ya da üçüncü taraf reklamı değildir; yalnız eKatalox'un kendi tanıtımıdır. Sipariş akışını kesmez. Herhangi bir ücretli pakete geçince tamamı kalkar.",
      },
      {
        q: "Ücretsizden ücretliye geçince ne değişir?",
        a: "Reklamlar kalkar, ürün ve fiyat listesi limitleri artar, pakete göre raporlar, kendi alan adınız ve bildirim gönderme açılır. Ürünleriniz, şifreleriniz ve bayileriniz olduğu gibi kalır; hiçbir şeyi yeniden kurmazsınız.",
      },
    ],
  },
  {
    title: "Bayi tarafı",
    items: [
      {
        q: "Bayim uygulama indirmek zorunda mı?",
        a: "Hayır. firmaniz.ekatalox.com adresini ve şifreyi WhatsApp'tan gönderirsiniz; bayi tarayıcıda açar, şifreyi yazar, sipariş verir. İsterse ana ekranına ekler, uygulama gibi kullanır ve bildirim alır.",
      },
      {
        q: "Farklı bayilere farklı fiyat gösterebilir miyim?",
        a: "Evet. Her fiyat listesinin kendi şifresi vardır: bayi şifresiyle giren bayi fiyatını, perakende şifresiyle giren perakende fiyatını görür. Ücretsiz planda 2, Başlangıç'ta 3, Profesyonel'de 15, Kurumsal'da sınırsız fiyat listesi bulunur.",
      },
      {
        q: "Şifresiz giren biri fiyatları görebilir mi?",
        a: "Hayır. Kataloğu tamamen şifreli yapabilir ya da şifresiz ziyaretçiye yalnız ürünleri fiyatsız gösterebilirsiniz. Fiyat listelerini ve giriş şifrelerini panelden yönetirsiniz.",
      },
      {
        q: "Sipariş bana nasıl ulaşır?",
        a: "Bayi sepetini hazırlayınca PDF sipariş fişi oluşur ve sipariş panelde listelenir. Bayi, fişin bağlantısıyla WhatsApp'a geçer ve mesajı göndererek sizinle paylaşır. Fişte ürün kodu, adet, koli, tutar, cari adı ve not vardır.",
      },
    ],
  },
  {
    title: "Kurulum ve kullanım",
    items: [
      {
        q: "Ürünleri kim yükler?",
        a: "Panelde Excel şablonunu doldurup ürünlerinizi yükleyebilir, fotoğrafları ekleyebilirsiniz. Mevcut PDF veya Excel listenizin aktarımı için destek isterseniz bize ulaşın; listenizi inceleyip işin kapsamını birlikte netleştirelim.",
      },
      {
        q: "Fiyatları nasıl güncellerim?",
        a: "Tek ürünü panelden, tümünü Excel ile. Değişiklik anında yayına girer; bayi kataloğu açtığında güncel fiyatı görür.",
      },
      {
        q: "Koli ve varyant var mı?",
        a: "Var. Ürün başına koli içi adet tanımlarsınız; bayi koli seçer, tutar hesaplanır. Renk, beden, model gibi varyantlar tek üründe toplanır.",
      },
      {
        q: "Kendi alan adımı kullanabilir miyim?",
        a: "Kurumsal pakette. katalog.firmaniz.com gibi bir adresi kataloğunuza bağlarız; DNS ayarını adım adım anlatırız.",
      },
      {
        q: "Bilgisayar gerekir mi?",
        a: "Gerekmez. Panel telefondan açılır; siparişler WhatsApp'a gelir. Excel yüklemesi için bilgisayar daha rahattır ama şart değildir.",
      },
    ],
  },
  {
    title: "Ücret ve sözleşme",
    items: [
      {
        q: "Ücretli paketlerin denemesi bitince ne olur?",
        a: "Ücretli paket seçerek kayıt olduğunuzda o paketi 14 gün deneyebilirsiniz. Ödeme yapılmazsa hesabınız Ücretsiz plana geçer; ücretsiz plan limitleri ve eKatalox reklamları uygulanır. Süresiz ücretsiz planı kullanmak için ücretli denemeye başlamanız gerekmez.",
      },
      {
        q: "Komisyon var mı?",
        a: "Yok. Ücretli paketler yıllık sabit ücrettir: Başlangıç 5.000 ₺, Profesyonel 10.000 ₺, Kurumsal 15.000 ₺ (KDV hariç). eKatalox sipariş başına komisyon almaz. Online ödeme sağlayıcısının işlem ücretleri ayrıca geçerlidir.",
      },
      {
        q: "Paketimi yıl ortasında yükseltebilir miyim?",
        a: "Evet, istediğiniz zaman. Yeniden tam ücret ödemezsiniz: mevcut paketinizin kalan süresine ait tutar, yeni paketin güncel fiyatından düşülür ve yeni paketiniz yükseltme gününden itibaren 1 yıl geçerli olur. Örneğin Başlangıç paketini (5.000 ₺) 4 ay kullandıktan sonra Kurumsal'a (15.000 ₺) geçerseniz, kalan 8 ayın 3.333 ₺'lik karşılığı düşülür ve 11.667 ₺ ödersiniz; Kurumsal paketiniz o günden itibaren 12 ay sürer. Ürünleriniz, şifreleriniz ve bayileriniz olduğu gibi kalır.",
      },
      {
        q: "Paket fiyatları değişirse ne olur?",
        a: "Ödediğiniz fiyat, paket döneminiz bitene kadar değişmez. Paket yükseltme ve yenilemelerde o günkü güncel fiyat geçerlidir; yükseltmede düşülen kalan süre tutarı ise sizin ödediğiniz fiyat üzerinden hesaplanır.",
      },
      {
        q: "Ödemeyi nasıl yaparım?",
        a: "Havale/EFT ile ya da temsilcimiz üzerinden kartla. Fatura kesilir; ödeme sonrası paket aynı gün açılır.",
      },
      {
        q: "İptal etmek istersem?",
        a: "Ücretsiz planda iptal diye bir şey yok; kullanmazsanız katalog durur. Yıllık paketlerde hizmet dönem sonuna kadar sürer, yenilemezseniz hesap Ücretsiz plana düşer; kataloğunuz açık kalır.",
      },
      {
        q: "Ürün limitim dolarsa?",
        a: "Bir üst pakete geçersiniz ya da +1.000 ürün eklentisi alırsınız. Limit dolduğunda yeni ürün eklenemez ama mevcut katalog çalışmaya devam eder.",
      },
    ],
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: GROUPS.flatMap((g) =>
    g.items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  ),
};

export default function SssPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />

      <Section tone="white" className="pb-10 sm:pb-14">
        <Container>
          <SectionHeading
            eyebrow="Sık sorulan sorular"
            as="h1"
            title="Karar vermeden önce merak edilenler"
            lead="Katalog kurma, bayi girişi ve paket seçimiyle ilgili yanıtlar. Sorunuz burada yoksa telefon veya WhatsApp üzerinden bize ulaşın."
          />
          <p className="mt-4 text-sm text-brand-muted">
            <a href="/sorular" className="font-semibold text-brand-navy underline-offset-4 hover:underline">
              Toptancı kataloğu, fiyat listesi ve B2B sipariş hakkında genel sorular →
            </a>
          </p>
        </Container>
      </Section>

      <Section className="pt-0 sm:pt-0">
        <Container className="space-y-14">
          {GROUPS.map((g) => (
            <div key={g.title} className="grid gap-6 lg:grid-cols-[1fr_2.2fr] lg:gap-16">
              <h2 className="text-xl font-semibold text-brand-navy lg:sticky lg:top-24 lg:self-start">{g.title}</h2>
              <div className="divide-y divide-brand-line border-y border-brand-line">
                {g.items.map((f) => (
                  <details key={f.q} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left text-base font-semibold text-brand-ink [&::-webkit-details-marker]:hidden">
                      <span>{f.q}</span>
                      <span
                        aria-hidden
                        className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border border-brand-line text-brand-muted transition-transform group-open:rotate-45"
                      >
                        <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M10 4v12M4 10h12" />
                        </svg>
                      </span>
                    </summary>
                    <p className="mt-3 max-w-2xl leading-relaxed text-brand-muted">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </Container>
      </Section>

      <Section tone="navy">
        <Container className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl">
              Sorunuz kaldıysa arayın, birlikte bakalım.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/75">
              Hafta içi mesai saatlerinde telefon ve WhatsApp üzerinden ulaşabilirsiniz.
            </p>
          </div>
          <div className="flex flex-col gap-4 lg:items-end">
            <ButtonLink href="/basvuru" tone="white" size="lg">
              Ücretsiz başla
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
