import type { Metadata } from "next";
import { MARKETING_WHATSAPP_HREF, WhatsAppGlyph } from "@/components/marketing/contact-dock";
import { PhoneFrame } from "@/components/marketing/phone-frame";
import { ButtonLink, CheckList, Container, Section, SectionHeading } from "@/components/marketing/ui";
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
    src: "/site/toptan-giris-v2.png",
    alt: "Şifreli bayi giriş ekranı",
    title: "Bayi girişi",
    body: "Bayi şifreyi yazar, kendi fiyat listesiyle girer. Üyelik, uygulama, e-posta doğrulama yok.",
  },
  {
    src: "/site/toptan-katalog-v2.png",
    alt: "Toptan katalog ürün listesi ekranı",
    title: "Katalog",
    body: "Kategoriler, ürün kartları ve bayinin kendi fiyatı. Arama ve filtre üstte.",
  },
  {
    src: "/site/toptan-sepet-v2.png",
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
      <Section tone="navy" glow className="pb-14 pt-12 sm:pb-20 sm:pt-20">
        <Container>
          <h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-[-0.025em] text-white sm:text-5xl">
            Kayıttan ilk siparişe dört adım
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/70">
            {`Kayıt ${SITE.setupMinutes} dakika sürer, kataloğunuz o an açılır. Ürünleri Excel ile yüklersiniz ya da biz yükleriz. Ücretsiz plan, kart istenmez.`}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/basvuru" size="lg">
              Ücretsiz kataloğumu kur
            </ButtonLink>
            <ButtonLink href={SITE.demoUrl} tone="outline-dark" size="lg" external>
              Demo kataloğu aç
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <ol className="grid gap-6 md:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s.no} className="flex flex-col rounded-2xl border border-brand-line bg-white p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand-neon text-sm font-bold text-brand-dark">
                    {i + 1}
                  </span>
                  <span className="rounded-full bg-brand-paper px-3 py-1 text-xs font-medium text-brand-muted">{s.duration}</span>
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-brand-navy">{s.title}</h2>
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
            title="Katalog bayinin telefonunda böyle görünür"
            lead="Uygulama indirilmez; sayfa tarayıcıda açılır. Görseller demo kataloğumuzdan alınmış gerçek ekran görüntüleridir."
          />
          <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {SCREENS.map((sc) => (
              <figure key={sc.src} className="text-center">
                <PhoneFrame src={sc.src} alt={sc.alt} className="w-[240px] sm:w-[250px]" />
                <figcaption className="mx-auto mt-5 max-w-[280px]">
                  <span className="block font-semibold text-brand-navy">{sc.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-brand-muted">{sc.body}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-12 text-center">
            <ButtonLink href={SITE.demoUrl} tone="outline" external>
              Demo kataloğu açıp kendiniz deneyin
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-brand-navy sm:text-4xl">
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

      <Section tone="navy" glow>
        <Container className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl">
              Bugün kurun, bu hafta bayilerinize gönderin.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/75">Sorunuz varsa WhatsApp&apos;tan yazın; ilk yüklemeyi birlikte planlarız.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
            <ButtonLink href="/basvuru" size="lg">
              Ücretsiz kataloğumu kur
            </ButtonLink>
            <ButtonLink href={MARKETING_WHATSAPP_HREF} tone="outline-dark" size="lg" external>
              <WhatsAppGlyph className="size-5 text-[#25D366]" />
              WhatsApp&apos;tan yazın
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
