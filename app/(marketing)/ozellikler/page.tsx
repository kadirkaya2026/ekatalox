import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { ESNAF_PLANS } from "@/lib/billing/esnaf-plans";
import { SITE } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Özellikler",
  description:
    "Fotoğraflı ürün listesi, PDF sipariş, konum, hazırlanıyor ve yola çıktı bildirimleri, kampanya, kupon, veresiye, satış raporu, yoğunum modu, yaş doğrulama ve magnet takibi.",
  alternates: { canonical: "/ozellikler" },
};

interface Feature {
  title: string;
  body: string;
  plus?: boolean;
}

interface FeatureGroup {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  features: Feature[];
}

const PLUS = ESNAF_PLANS[1].name;

const GROUPS: FeatureGroup[] = [
  {
    id: "siparis-alma",
    eyebrow: "Sipariş alma",
    title: "Müşteri seçer, sipariş yazılı gelir",
    lead: "Telefonda tarif yerine fotoğraflı liste. Sipariş; ürünler, adres, telefon ve ödeme şekliyle tek belgede.",
    features: [
      {
        title: "Fotoğraflı, fiyatlı ürün listesi",
        body: "Ürünler kategori kategori, fotoğrafı ve fiyatıyla görünür. Kilo, adet ve demet gibi birimler sektörünüze göre ayarlanır.",
      },
      {
        title: "Sepet ve ürün notu",
        body: "Müşteri adedi kendisi belirler; “az yağlı”, “olgun olsun” gibi notları ürünün yanına yazar.",
      },
      {
        title: "PDF sipariş, WhatsApp'a",
        body: "Sipariş; ürün listesi, tutar, adres, telefon ve ödeme şekliyle PDF olarak WhatsApp numaranıza gelir.",
      },
      {
        title: "Adres ve konum",
        body: "Adres zorunludur; müşteri isterse bulunduğu konumu da ekler. Daha önce sipariş verdiyse bilgileri kendiliğinden dolar.",
      },
      {
        title: "Hazırlat akışı (tekel)",
        body: "Teslimat yapmayan bayiler için: müşteri listeyi gönderir, siz hazırlarsınız, gelip alır. Alkollü ürünler online listede görünmez.",
      },
    ],
  },
  {
    id: "musteriyi-tutma",
    eyebrow: "Müşteriyi tutma",
    title: "Bir kez sipariş veren tekrar gelsin",
    lead: "Bildirim, kampanya ve kuponla müşteri sizde kalır. Numarası ve sipariş geçmişi sizin panelinizdedir.",
    features: [
      {
        title: "Hazırlanıyor ve yola çıktı bildirimleri",
        body: "Panelde tek dokunuş, müşteriye bildirim. “Nerede kaldı?” araması gelmez.",
      },
      {
        title: "Kampanya ve indirimli ürün sayfası",
        body: "Akşam indirimi, haftanın ürünü, bayram kampanyası. Bir kez tanımlarsınız, tüm müşterileriniz görür.",
      },
      {
        title: "Müşteri kuponu",
        body: "Sadık müşteriye ya da ilk siparişe özel indirim kuponu. Tutar ve süreyi siz belirlersiniz.",
        plus: true,
      },
      {
        title: "“Sizi özledik” bildirimi",
        body: "Bir süredir sipariş vermeyen müşteriye hatırlatma gider. Kupon eklemek isteğe bağlıdır.",
        plus: true,
      },
    ],
  },
  {
    id: "isletme",
    eyebrow: "İşletme",
    title: "Dükkânın kuralları sizin elinizde",
    lead: "Yoğun saatte kapıyı kapatın, minimum sepet koyun, teslimat ücretini belirleyin. Panel telefondan yönetilir.",
    features: [
      {
        title: "Veresiye takibi",
        body: "Veresiye satışlar müşteri bazında panelde tutulur; tahsilat hatırlatması tek dokunuşla gider.",
        plus: true,
      },
      {
        title: "Satış ve kârlılık raporu",
        body: "Günlük, haftalık ve aylık satış; en çok satan ürünler; kâr marjı. Defter yerine panel.",
        plus: true,
      },
      {
        title: "Yoğunum modu",
        body: "Kasada yığılma olduğunda sipariş almayı geçici olarak durdurursunuz; müşteri sayfada uyarıyı görür.",
      },
      {
        title: "Çalışma saatleri",
        body: "Kapalı saatlerde sipariş alınmaz ya da “açılınca hazırlanır” notuyla alınır; siz seçersiniz.",
      },
      {
        title: "Minimum sepet",
        body: "Belirlediğiniz tutarın altındaki siparişler tamamlanamaz; müşteri eksik tutarı görür.",
      },
      {
        title: "Teslimat ücreti ve ücretsiz teslimat barajı",
        body: "Teslimat ücretini ve hangi tutarın üstünde ücretsiz olacağını siz belirlersiniz; sepette otomatik hesaplanır.",
      },
      {
        title: "Yaş doğrulama",
        body: "Yaş sınırı olan ürün kategorileri için sipariş öncesi doğrulama adımı.",
      },
    ],
  },
  {
    id: "magnet-takibi",
    eyebrow: "Magnet takibi",
    title: "Hangi magnet sipariş getirdi, görürsünüz",
    lead: "Her magnetteki QR kod benzersizdir. Okutma ve ilk sipariş magnet bazında panelde listelenir.",
    features: [
      {
        title: "Benzersiz 6 haneli kod",
        body: "Her magnetin kendi kodu vardır. Aynı kodla gelen müşteri aynı magnete bağlanır.",
      },
      {
        title: "Okutma ve sipariş takibi",
        body: "Hangi magnet kaç kez okutuldu, hangisi ilk siparişi getirdi, hangi müşteriye gitti.",
        plus: true,
      },
      {
        title: "Basım ve kargo bizden",
        body: `Esnaf paketinde ${ESNAF_PLANS[0].magnetCount}, ${PLUS} paketinde ${ESNAF_PLANS[1].magnetCount} adet magnet hediyedir; basımı ve kargosu eKatalox tarafından yapılır.`,
      },
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
            title="Sipariş almaktan tahsilata, dükkânın ihtiyacı kadar"
            lead="Her özellik mahalle esnafının günlük derdinden çıktı. Fazlası yok, eksiği yok."
          />
          <nav aria-label="Özellik grupları" className="mt-8 flex flex-wrap gap-2">
            {GROUPS.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className="rounded-full border border-brand-line bg-white px-4 py-2 text-sm font-medium text-brand-ink hover:border-brand-navy"
              >
                {g.eyebrow}
              </a>
            ))}
          </nav>
          <p className="mt-6 text-sm text-brand-muted">
            <span className="mr-2 inline-block rounded-sm bg-brand-navy-soft px-2 py-0.5 text-xs font-semibold text-brand-navy">{PLUS}</span>
            işaretli özellikler yalnızca {PLUS} paketinde bulunur. Kendi alan adı (dukkanim.com) da {PLUS} paketine dahildir.
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
                    {f.plus ? (
                      <span className="rounded-sm bg-brand-navy-soft px-2 py-0.5 text-xs font-semibold text-brand-navy">{PLUS}</span>
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
              Hangi paket size uyar, birlikte bakalım.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/75">
              Paket karşılaştırması ve fiyatlar için fiyatlandırma sayfasına göz atın ya da arayın.
            </p>
            <Link href="/fiyatlandirma" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:underline">
              Fiyatlandırma <ArrowRight className="size-4" />
            </Link>
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
