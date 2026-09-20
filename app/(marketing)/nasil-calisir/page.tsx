import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink, CheckList, Container, Eyebrow, Section, SectionHeading } from "@/components/marketing/ui";
import { SITE } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Nasıl çalışır",
  description:
    "Kayıttan ilk siparişe dört adım: 5 dakikada kayıt, ürünleri Excel ile yükleme, bayilere şifre verme ve WhatsApp'a PDF olarak düşen ilk sipariş. Ücretsiz plan, kart istenmez.",
  alternates: { canonical: "/nasil-calisir" },
};

const STEPS = [
  {
    no: "01",
    duration: `${SITE.setupMinutes} dakika`,
    title: "Kayıt",
    body: "Firma adı, sektör, WhatsApp numaranız, e-posta ve şifre. Katalog adresiniz (firmaniz.ekatalox.com) o an açılır. Kart bilgisi istenmez, hesap Ücretsiz planla başlar.",
    detail: ["Firma adı ve sektör", "Siparişlerin geleceği WhatsApp numarası", "Katalog adresiniz aynı dakika hazır"],
  },
  {
    no: "02",
    duration: "Excel ile",
    title: "Ürün yükleme",
    body: "Panelde Excel şablonunu indirin, ürün kodu, ad, koli içi adet ve fiyatları doldurup yükleyin. Fotoğrafları toplu ekleyin. Mevcut PDF ya da Excel kataloğunuzu bize gönderirseniz ilk yüklemeyi biz yaparız.",
    detail: ["Excel şablonu: kod, ad, birim, koli içi, fiyat", "Varyant: renk, beden, model", "Kategori ve alt kategori düzeni"],
  },
  {
    no: "03",
    duration: "1 dakika",
    title: "Bayi şifresi",
    body: "Ayarlar > Şifreler'den bayi şifrenizi belirleyin; her şifre bir fiyat listesine bağlıdır. Adresi ve şifreyi bayilerinize WhatsApp'tan gönderin. Bayi tarayıcıda açar, şifreyi yazar, kendi fiyatıyla kataloğu görür.",
    detail: ["Şifresiz ziyaretçi isterseniz yalnız ürünleri görür", "Bayi / perakende / özel için ayrı şifre (paketinize göre)", "Şifreyi istediğiniz an değiştirin"],
  },
  {
    no: "04",
    duration: "Her sipariş",
    title: "Sipariş",
    body: "Bayi sepetini doldurur, cari adını ve notunu yazar, gönderir. Sipariş fişi PDF olarak WhatsApp numaranıza düşer; panelde de görünür. Fiyatı değiştirdiğinizde bayi o an güncel fiyatı görür.",
    detail: ["PDF'de ürün kodu, adet, koli, tutar", "Cari adı, telefon, not", "Panelde bugünkü sipariş sayısı ve tutarı"],
  },
];

const SCREENS = [
  {
    src: "/site/toptan-katalog.png",
    alt: "Toptan katalog ürün listesi ekranı",
    title: "Katalog",
    body: "Kategoriler, ürün kartları, koli içi adet ve bayinin kendi fiyatı. Arama ve filtre üstte.",
  },
  {
    src: "/site/toptan-giris.png",
    alt: "Şifreli bayi giriş ekranı",
    title: "Bayi girişi",
    body: "Bayi şifreyi yazar, kendi fiyat listesiyle girer. Üyelik, uygulama, e-posta doğrulama yok.",
  },
  {
    src: "/site/toptan-sepet.png",
    alt: "Sepet ve sipariş özeti ekranı",
    title: "Sepet ve sipariş",
    body: "Adet ve koli seçimi, cari adı, not. Tek dokunuşla WhatsApp'a PDF sipariş.",
  },
];

const WE_NEED = [
  "Ürün listeniz (Excel, PDF katalog ya da ürün fotoğrafları)",
  "Fiyat listeleriniz (bayi, perakende, özel; tek liste de olur)",
  "Logonuz",
  "Siparişlerin geleceği WhatsApp numarası",
];

export default function NasilCalisirPage() {
  return (
    <>
      <Section tone="white" className="pb-10 sm:pb-14">
        <Container>
          <SectionHeading
            eyebrow="Nasıl çalışır"
            title="Kayıttan ilk siparişe dört adım"
            lead={`Kayıt ${SITE.setupMinutes} dakika sürer, kataloğunuz o an açılır. Ürünleri Excel ile yüklersiniz ya da biz yükleriz. Ücretsiz plan, kart istenmez.`}
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
            eyebrow="Bayinin gördüğü"
            title="Katalog bayinin telefonunda böyle görünür"
            lead="Uygulama indirilmez; sayfa tarayıcıda açılır. Görseller demo kataloğumuzdan alınmış gerçek ekran görüntüleridir."
          />
          <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {SCREENS.map((sc) => (
              <figure key={sc.src}>
                <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl border border-brand-line bg-white">
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
              Demo kataloğu telefonunuzda açın (şifre {SITE.demoPassword})
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>Biz yükleyelim derseniz</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-brand-navy sm:text-4xl">
              İlk yükleme için dört şey yeter
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-brand-muted">
              Bunları WhatsApp&apos;tan ya da e-postayla gönderin; ürünlerinizi fotoğraf ve fiyatlarıyla biz yükleriz.
              Sonrasını panelden kendiniz yönetirsiniz.
            </p>
          </div>
          <CheckList items={WE_NEED} className="lg:pt-10" />
        </Container>
      </Section>

      <Section tone="navy">
        <Container className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl">
              Bugün kurun, bu hafta bayilerinize gönderin.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/75">Sorunuz varsa arayın; ilk yüklemeyi telefonda birlikte planlarız.</p>
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
