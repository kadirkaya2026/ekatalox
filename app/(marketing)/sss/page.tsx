import type { Metadata } from "next";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { SITE } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Sık sorulan sorular",
  description:
    "Ücretsiz plan gerçekten ücretsiz mi? Reklam nerede görünür? Bayi nasıl girer, ürünleri kim yükler, fiyat listeleri nasıl çalışır? Ödeme, iptal ve limitlerle ilgili yanıtlar.",
  alternates: { canonical: "/sss" },
};

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
    title: "Ücretsiz plan",
    items: [
      {
        q: "Ücretsiz plan gerçekten ücretsiz mi, süresi var mı?",
        a: "Evet, süresiz. Kart bilgisi istemeyiz, hesap kapanmaz. 200 ürün, 1 fiyat listesi ve aylık 1.000 ziyaretçiyle kataloğunuzu yayınlar, WhatsApp'tan sipariş alırsınız. Karşılığında kataloğunuzda küçük eKatalox tanıtımları görünür.",
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
        a: "Evet. Her fiyat listesinin kendi şifresi vardır: bayi şifresiyle giren bayi fiyatını, perakende şifresiyle giren perakende fiyatını görür. Ücretsiz planda 1, Başlangıç'ta 3, Profesyonel ve Kurumsal'da sınırsız liste.",
      },
      {
        q: "Şifresiz giren biri fiyatları görebilir mi?",
        a: "Hayır. Kataloğu tamamen şifreli yapabilir ya da şifresiz ziyaretçiye yalnız ürünleri fiyatsız gösterebilirsiniz. Şifreyi paylaşan bayiyi panelde görür, şifreyi bir dakikada değiştirirsiniz.",
      },
      {
        q: "Sipariş bana nasıl ulaşır?",
        a: "Bayi sepetini gönderince sipariş fişi PDF olarak WhatsApp numaranıza düşer; panelde de listelenir. Fişte ürün kodu, adet, koli, tutar, cari adı ve not vardır.",
      },
    ],
  },
  {
    title: "Kurulum ve kullanım",
    items: [
      {
        q: "Ürünleri kim yükler?",
        a: "Siz yükleyebilirsiniz: panelde Excel şablonunu doldurup yüklersiniz, fotoğrafları toplu eklersiniz. Mevcut PDF kataloğunuzu ya da Excel listenizi bize gönderirseniz ilk yüklemeyi biz yaparız.",
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
        a: "Profesyonel ve Kurumsal paketlerde. katalog.firmaniz.com gibi bir adresi kataloğunuza bağlarız; DNS ayarını adım adım anlatırız.",
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
        q: "Komisyon var mı?",
        a: "Yok. Ücretli paketler yıllık sabit ücrettir: Başlangıç 5.000 ₺, Profesyonel 10.000 ₺, Kurumsal 15.000 ₺ (KDV hariç). Sipariş sayısı ne olursa olsun değişmez.",
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <Section tone="white" className="pb-10 sm:pb-14">
        <Container>
          <SectionHeading
            eyebrow="Sık sorulan sorular"
            title="Karar vermeden önce merak edilenler"
            lead="Yanıtını bulamadığınız soru için arayın ya da WhatsApp'tan yazın; aynı gün dönüş yaparız."
          />
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
