import type { Metadata } from "next";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { ESNAF_PLANS, ESNAF_TRIAL_DAYS, formatTry } from "@/lib/billing/esnaf-plans";
import { SITE } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Sık sorulan sorular",
  description:
    "Müşterim uygulama kullanmaz mı? Ürünleri kim girecek? Komisyon var mı? İptal, ödeme, deneme süresi, tekelde alkol, veresiye ve magnetlerle ilgili sorular ve yanıtları.",
  alternates: { canonical: "/sss" },
};

const [esnaf, esnafPlus] = ESNAF_PLANS;

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
    title: "Müşteri tarafı",
    items: [
      {
        q: "Müşterim uygulama kullanmaz, yaşlı müşterim çok.",
        a: "Uygulama yok. Sipariş sayfası telefonun tarayıcısında açılır; QR kodu okutmak ya da adresi yazmak yeter. Üyelik istenmez, ilk siparişte telefon ve adres yazılır, sonrakilerde kendiliğinden dolar. Alışmayan müşteriniz yine arayabilir; sayfa telefonun yerine değil, yanına gelir.",
      },
      {
        q: "Müşteri siparişi nasıl takip eder?",
        a: "Siz panelden “hazırlanıyor” ve “yola çıktı” dediğinizde müşteriye bildirim gider. Tekel bayilerinde “hazır, gelip alabilirsiniz” bildirimi gider.",
      },
      {
        q: "Müşteri nasıl öder?",
        a: "Ödeme şeklini sipariş formunda seçer: kapıda nakit ya da kapıda kart gibi sizin sunduğunuz seçenekler. eKatalox müşteriden para tahsil etmez; para doğrudan size gelir.",
      },
    ],
  },
  {
    title: "Kurulum ve kullanım",
    items: [
      {
        q: "Ürünleri kim girecek?",
        a: `Biz. Ürün listenizi ya da raf fotoğraflarınızı WhatsApp'tan gönderirsiniz; ${SITE.setupHours} saat içinde fotoğrafı ve fiyatıyla yükleriz. Sonradan fiyat değiştirmek ya da ürün eklemek panelden telefonla bir dakika sürer.`,
      },
      {
        q: "İnternet ya da bilgisayar gerekir mi?",
        a: "Bilgisayar gerekmez. Siparişler WhatsApp'ınıza gelir, panel telefondan açılır. Dükkânda telefonunuzun interneti yeterlidir.",
      },
      {
        q: "Kaç ürün yükleyebilirim?",
        a: `${esnaf.name} paketinde ${esnaf.productLimit.toLocaleString("tr-TR")}, ${esnafPlus.name} paketinde ${esnafPlus.productLimit.toLocaleString("tr-TR")} ürüne kadar. Mahalle marketlerinin büyük kısmı için ${esnaf.name} yeterlidir.`,
      },
      {
        q: "Kendi alan adımı kullanabilir miyim?",
        a: `Evet, ${esnafPlus.name} paketinde. Örneğin dukkanim.com adresinizi sipariş sayfanıza bağlarız. ${esnaf.name} paketinde adresiniz dukkan.ekatalox.com biçimindedir.`,
      },
      {
        q: "Tekel bayisiyim, alkol satabilir miyim?",
        a: "Online alkol satışı yasal değildir; alkollü ürünler sayfada görünmez. Tekel bayileri için teslimat yerine hazırlat akışı çalışır: müşteri diğer ürünlerin listesini gönderir, siz hazırlarsınız, gelip dükkândan alır. Yaş doğrulama adımı sipariş öncesinde çalışır.",
      },
      {
        q: "Veresiye takibi var mı?",
        a: `${esnafPlus.name} paketinde var. Veresiye satışlar müşteri bazında panelde tutulur, tahsilat hatırlatması tek dokunuşla gider.`,
      },
    ],
  },
  {
    title: "Ücret ve sözleşme",
    items: [
      {
        q: "Komisyon var mı?",
        a: `Yok. Sipariş sayısından bağımsız sabit ücret ödersiniz: ${esnaf.name} yıllık ${formatTry(esnaf.yearlyPrice)} ya da aylık ${formatTry(esnaf.monthlyPrice)}; ${esnafPlus.name} yıllık ${formatTry(esnafPlus.yearlyPrice)} ya da aylık ${formatTry(esnafPlus.monthlyPrice)}. Ne kadar çok sipariş alırsanız o kadar kârlıdır.`,
      },
      {
        q: "Deneme süresi nasıl işler?",
        a: `İlk ${ESNAF_TRIAL_DAYS} gün ücretsizdir; kart bilgisi istenmez. Kurulum ve magnetler deneme süresinde de yapılır. Süre sonunda devam etmek isterseniz ödemeyi yaparsınız, istemezseniz hiçbir ücret çıkmaz.`,
      },
      {
        q: "Ödemeyi nasıl yaparım?",
        a: "Havale/EFT ile ya da temsilcimiz üzerinden kredi kartıyla. Fatura kesilir.",
      },
      {
        q: "İptal etmek istersem?",
        a: "Aylık pakette istediğiniz ay bırakırsınız; sonraki ay ücret çıkmaz. Yıllık pakette hizmet dönem sonuna kadar sürer, yenileme yapılmaz.",
      },
      {
        q: "Magnetler ücretli mi, nasıl gelir?",
        a: `Hediyedir. ${esnaf.name} paketinde ${esnaf.magnetCount}, ${esnafPlus.name} paketinde ${esnafPlus.magnetCount} adet magnet eKatalox tarafından basılır ve kargoyla adresinize gönderilir. Basım ve kargo için ek ücret yoktur.`,
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
              Ücretsiz başvur
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
