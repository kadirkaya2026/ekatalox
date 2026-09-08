import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink, CheckList, Container, Eyebrow, Section, SectionHeading } from "@/components/marketing/ui";
import { ESNAF_PLANS, ESNAF_TRIAL_DAYS } from "@/lib/billing/esnaf-plans";
import { SITE } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Nasıl çalışır",
  description:
    "Başvurudan ilk siparişe dört adım: 5 dakikalık başvuru, 2 saatte kurulum, kargoyla gelen QR magnetler ve WhatsApp'a PDF olarak düşen ilk sipariş.",
  alternates: { canonical: "/nasil-calisir" },
};

const STEPS = [
  {
    no: "01",
    duration: "5 dakika",
    title: "Başvuru",
    body: "Formu doldurursunuz: dükkân adı, sektör, WhatsApp numaranız. Mağaza adresiniz anında açılır (dukkan.ekatalox.com). Kart bilgisi istenmez; ilk 30 gün ücretsizdir.",
    detail: ["Dükkân adı ve sektör seçimi", "Sipariş alacağınız WhatsApp numarası", "Mağaza adresiniz aynı dakika hazır"],
  },
  {
    no: "02",
    duration: `${SITE.setupHours} saat`,
    title: "Kurulum",
    body: "Ürünlerinizi fotoğrafı ve fiyatıyla biz yükleriz. Logonuzu, çalışma saatlerinizi, teslimat bölgenizi ve minimum sepet tutarınızı sizinle birlikte ayarlarız. Siz onaylarsınız, sayfa yayına girer.",
    detail: ["Ürün listesi ve fotoğraflar bizde", "Logo, renkler ve kategori düzeni", "Çalışma saati, teslimat ücreti, minimum sepet"],
  },
  {
    no: "03",
    duration: "Kargo ile",
    title: "Magnet dağıtımı",
    body: `Size özel QR kodlu buzdolabı magnetleri basılır ve kargoyla gelir. Esnaf paketinde ${ESNAF_PLANS[0].magnetCount}, Esnaf Plus paketinde ${ESNAF_PLANS[1].magnetCount} adet hediyedir. Poşete koyar, kasada verirsiniz; müşteri buzdolabına yapıştırır.`,
    detail: ["Her magnette benzersiz 6 haneli kod", "Kod doğrudan sipariş sayfanıza götürür", "Hangi magnetin sipariş getirdiği panelde görünür"],
  },
  {
    no: "04",
    duration: "Her sipariş",
    title: "İlk sipariş",
    body: "Müşteri kodu okutur, ürünleri seçer, adresini ve ödeme şeklini yazar. Sipariş WhatsApp'ınıza PDF olarak gelir. Panelden “hazırlanıyor” ve “yola çıktı” dersiniz; müşteriye bildirim gider.",
    detail: ["PDF'de ürünler, adres, telefon ve ödeme şekli", "Tek dokunuşla sipariş durumu bildirimi", "Tekel bayilerinde teslimat yerine hazırlat akışı"],
  },
];

const SCREENS = [
  {
    src: "/site/demo-oneri.png",
    alt: "Sepete uygun ürün önerisi ekranı",
    title: "Öneri ekranı",
    body: "Müşteri sepetini tamamlarken yanına iyi giden ürünleri görür. Unutulan ürün, ek satış olur.",
  },
  {
    src: "/site/demo-siparis-bilgileri.png",
    alt: "Sipariş bilgileri formu",
    title: "Sipariş bilgileri",
    body: "Ödeme şekli, telefon, ad ve adres zorunludur. Daha önce sipariş verdiyse bilgiler kendiliğinden dolar.",
  },
  {
    src: "/site/demo-konum.png",
    alt: "Konum ekleme seçeneği ve sipariş notu alanı",
    title: "Konum ve not",
    body: "Müşteri isterse bulunduğu konumu ekler, sipariş notu yazar. Teslimat ücreti ve ücretsiz teslimat barajı sizin ayarınızdır.",
  },
];

const WE_NEED = [
  "Ürün listeniz (varsa fiyat listesi, yoksa raf fotoğrafları yeterli)",
  "Ürün fotoğrafları (çekemiyorsanız biz tamamlarız)",
  "Logonuz ya da tabelanızın fotoğrafı",
  "Sipariş alacağınız WhatsApp numarası",
  "Çalışma saatleriniz",
  "Teslimat bölgeniz, teslimat ücretiniz ve minimum sepet tutarınız",
];

export default function NasilCalisirPage() {
  return (
    <>
      <Section tone="white" className="pb-10 sm:pb-14">
        <Container>
          <SectionHeading
            eyebrow="Nasıl çalışır"
            title="Başvurudan ilk siparişe dört adım"
            lead={`Başvuru 5 dakika, kurulum ${SITE.setupHours} saat sürer. Ürünleri biz yükleriz; siz yalnızca onaylarsınız. İlk ${ESNAF_TRIAL_DAYS} gün ücretsizdir.`}
          />
        </Container>
      </Section>

      <Section className="pt-0 sm:pt-0">
        <Container>
          <ol className="grid gap-6 md:grid-cols-2">
            {STEPS.map((s) => (
              <li key={s.no} className="flex flex-col rounded-lg border border-brand-line bg-white p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="font-plex-mono text-sm font-medium text-brand-green">{s.no}</span>
                  <span className="rounded-full bg-brand-paper px-3 py-1 font-plex-mono text-xs text-brand-muted">{s.duration}</span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-brand-navy">{s.title}</h2>
                <p className="mt-3 leading-relaxed text-brand-muted">{s.body}</p>
                <CheckList items={s.detail} className="mt-5 text-[15px]" />
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="white">
        <Container>
          <SectionHeading
            eyebrow="Müşterinin gördüğü"
            title="Sipariş sayfası müşterinin telefonunda böyle görünür"
            lead="Uygulama indirilmez; sayfa tarayıcıda açılır. Görseller demo mağazamızdan alınmış gerçek ekran görüntüleridir."
          />
          <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {SCREENS.map((sc) => (
              <figure key={sc.src}>
                <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl border border-brand-line bg-[#121212]">
                  <Image src={sc.src} alt={sc.alt} width={780} height={1688} sizes="(min-width: 640px) 280px, 80vw" className="h-auto w-full" />
                </div>
                <figcaption className="mx-auto mt-4 max-w-[280px]">
                  <span className="block font-semibold text-brand-navy">{sc.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-brand-muted">{sc.body}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-10">
            <ButtonLink href={SITE.demoUrl} tone="outline" external>
              Demo mağazayı telefonunuzda açın
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>Sizden ne isteriz</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-brand-navy sm:text-4xl">
              Kurulum için altı şey yeter
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-brand-muted">
              Bilgisayar gerekmez. Bunları WhatsApp&apos;tan gönderirsiniz, gerisini biz yaparız. Eksik olanı birlikte
              tamamlarız.
            </p>
          </div>
          <CheckList items={WE_NEED} className="lg:pt-10" />
        </Container>
      </Section>

      <Section tone="navy">
        <Container className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl">
              Bugün başvurun, bu hafta sipariş alın.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/75">
              Sorunuz varsa arayın; kurulumu telefonda birlikte planlarız.
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
