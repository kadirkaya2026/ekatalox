import { marketingMetadata } from "@/lib/marketing/metadata";

import { MARKETING_WHATSAPP_HREF, WhatsAppGlyph } from "@/components/marketing/contact-dock";
import { PhoneFrame } from "@/components/marketing/phone-frame";
import { ButtonLink, CheckList, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { SITE } from "@/lib/marketing/site";
import { Accent, BandCard, ClosingCta, CustomerMarquee, PageHero } from "@/components/marketing/home-v2/page-kit";

export const metadata = marketingMetadata(
  "/nasil-calisir",
  "B2B Sipariş Sistemi Nasıl Çalışır?",
  "Hesabınızı açın, ürünlerinizi yükleyin, bayi fiyat listelerini tanımlayın. Bayileriniz PDF sipariş fişi bağlantısını WhatsApp üzerinden paylaşsın.",
);

const STEPS = [
  {
    no: "01",
    duration: "Kart bilgisi gerekmez",
    title: "Kayıt",
    body: "Firma adı, sektör, WhatsApp numaranız, e-posta ve şifrenizle hesabınızı oluşturun. Süresiz ücretsiz planı seçin veya ücretli bir paketi 14 gün deneyin.",
    detail: ["Firma adı ve sektör", "Siparişlerin geleceği WhatsApp numarası", "Firmanıza ait katalog adresi"],
  },
  {
    no: "02",
    duration: "Excel ile",
    title: "Ürün yükleme",
    body: "İsterseniz biz yükleriz: PDF kataloğunuzu, web sitenizin adresini ya da Excel listenizi WhatsApp'tan gönderin; ürünleri, görselleri ve fiyat listelerini biz kuralım, ücretsiz planda bile. Kendiniz yüklemek isterseniz panelde Excel şablonunu doldurup fotoğrafları model/SKU koduyla eşleştirerek toplu yükleyin.",
    detail: ["Excel şablonu: kod, ad, birim, koli içi, fiyat", "Varyant: renk, beden, model", "Kategori ve alt kategori düzeni"],
  },
  {
    no: "03",
    duration: "Size özel fiyat listeleri",
    title: "Bayi şifresi",
    body: "Fiyat Listeleri sayfasından bayi şifrenizi belirleyin; her şifre bir fiyat listesine bağlıdır. Adresi ve şifreyi bayilerinize WhatsApp'tan gönderin. Bayi tarayıcıda açar, şifreyi yazar, kendi fiyatıyla kataloğu görür.",
    detail: ["Şifresiz ziyaretçi isterseniz yalnız ürünleri görür", "Bayi / perakende / özel için ayrı şifre (paketinize göre)", "Şifreyi istediğiniz an değiştirin"],
  },
  {
    no: "04",
    duration: "Her sipariş",
    title: "Sipariş",
    body: "Minimum sepet tutarını ve siparişte istenecek zorunlu bilgileri belirleyin. Bayi sepetini hazırlar; oluşan siparişi Siparişlerim sayfasından takip edersiniz. Bayi PDF fişinin bağlantısını WhatsApp üzerinden paylaşır.",
    detail: ["PDF’de ürün kodu, adet, koli ve tutar", "Sabit WhatsApp numarası veya müşterinin alıcı seçimi", "Bildirimler açıksa yeni sipariş bildirimi"],
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
    body: "Adet ve koli seçimi, cari adı, not. PDF sipariş fişinin bağlantısını WhatsApp üzerinden paylaşma.",
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
      <PageHero
        eyebrow="Nasıl çalışır"
        title={<>Kayıttan ilk siparişe <Accent>dört adım.</Accent></>}
        lead="Hesabınızı açın, ürünlerinizi ekleyin ve katalog bağlantınızı bayilerinizle paylaşın. Ücretsiz planda kart bilgisi ve süre sınırı yoktur."
        actions={
          <>
            <ButtonLink href="/basvuru" tone="navy" size="lg" className="px-9">Ücretsiz başla</ButtonLink>
            <ButtonLink href={SITE.demoUrl} tone="outline" size="lg" external>Demoyu incele</ButtonLink>
          </>
        }
      />

      <Section tone="white" className="pt-0 sm:pt-0">
        <Container>
          <ol className="grid gap-6 md:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s.no}>
                <BandCard
                  index={i}
                  band={
                    <div className="flex w-full items-end justify-between">
                      <span className="text-6xl font-extrabold leading-none tracking-[-0.04em] text-brand-navy">{s.no}</span>
                      <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-brand-navy">{s.duration}</span>
                    </div>
                  }
                >
                  <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-brand-navy">{s.title}</h2>
                  <p className="mt-3 leading-relaxed text-brand-muted">{s.body}</p>
                  <CheckList items={s.detail} className="mt-5 text-[15px]" />
                </BandCard>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="white">
        <Container>
          <SectionHeading title="İlk siparişten sonra kataloğunuzu geliştirin" lead="En çok aranan ve sepete eklenen ürünleri, il ve fiyat listesi girişlerini inceleyin. İlgi gören ürünleri öne çıkarın; kampanya ve duyurularınızı güncelleyin." />
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/ozellikler/raporlar" tone="outline">Raporlarla aksiyon alın</ButtonLink>
            <ButtonLink href="/ozellikler/kurumsal-site" tone="outline">Kurumsal siteyle bayi başvurusu alın</ButtonLink>
          </div>
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
              Demoyu incele
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-brand-navy sm:text-4xl">
              Mevcut ürün listenizle başlayın
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-brand-muted">
              Ürün aktarımı desteği için listenizi WhatsApp veya e-postayla paylaşın. Dosyanızı inceleyip kapsamı, süreyi ve varsa ücreti başlamadan önce netleştirelim. Kataloğunuzu sonrasında panelden yönetebilirsiniz.
            </p>
          </div>
          <CheckList items={WE_NEED} className="lg:pt-10" />
        </Container>
      </Section>

      <CustomerMarquee />
      <ClosingCta
        title="Kataloğunuzu kurun, bayilerinize paylaşın."
        lead="Sorunuz varsa WhatsApp'tan yazın; ilk yüklemeyi birlikte planlarız."
        secondary={
          <ButtonLink href={MARKETING_WHATSAPP_HREF} tone="white" size="lg" external>
            <WhatsAppGlyph className="size-5 text-[#25D366]" /> WhatsApp&apos;tan yazın
          </ButtonLink>
        }
      />
    </>
  );
}
