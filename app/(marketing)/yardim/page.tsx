import { marketingMetadata } from "@/lib/marketing/metadata";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/marketing/ui";
import { Accent, BandCard, ClosingCta, PageHero } from "@/components/marketing/home-v2/page-kit";
import { SITE } from "@/lib/marketing/site";

export const metadata = marketingMetadata(
  "/yardim",
  "Yardım Merkezi: Katalog Kurulumu ve Ürün Yükleme",
  "Katalog kurulumu, Excel ile ürün yükleme, bayi şifreleri, WhatsApp sipariş, paket ve hesap işlemleri için yardım alın.",
);

const TOPICS = [
  { title: "Eğitim merkezi", desc: "Ürün yüklemeden sipariş yönetimine her işin kısa, adım adım videosu.", href: "/egitim" },
  { title: "Başlarken", desc: "Kayıt, Excel ile ürün yükleme ve ilk siparişe kadar olan yol.", href: "/nasil-calisir" },
  { title: "Bayi şifreleri ve fiyat listeleri", desc: "Şifre nasıl verilir, kim hangi fiyatı görür.", href: "/ozellikler#katalog" },
  { title: "Sipariş alma", desc: "Sepet, WhatsApp'a düşen PDF, sipariş formu alanları.", href: "/ozellikler#siparis" },
  { title: "Paket ve ödeme", desc: "Ücretsiz plan, yıllık paketler, reklamlar, limitler.", href: "/fiyatlandirma" },
  { title: "Sık sorulan sorular", desc: "Bayi uygulama indirir mi, ürünleri kim yükler, iptal.", href: "/sss" },
  { title: "Hesap", desc: "Giriş, şifre yenileme, panel adresi.", href: "/sifremi-unuttum" },
];

export default function HelpPage() {
  return (
    <>
      <PageHero eyebrow="Destek" title={<>Yardım <Accent>merkezi.</Accent></>} lead="Aradığınızı bulamazsanız telefonla ya da e-postayla ulaşın; sorunuzu genelde aynı gün çözeriz." />
      <section className="bg-white pb-8">
        <Container>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((t, i) => (
              <BandCard key={t.title} index={i} href={t.href} band={<h2 className="text-2xl font-extrabold leading-tight tracking-[-0.02em] text-brand-navy">{t.title}</h2>}>
                <p className="flex-1 text-[15px] leading-relaxed text-brand-muted">{t.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green">Aç <ArrowRight className="size-4" aria-hidden /></span>
              </BandCard>
            ))}
          </div>
        </Container>
      </section>
      <ClosingCta
        title="Destek hattı her zaman açık."
        lead={<>Telefon ve WhatsApp: {SITE.phone} · {SITE.supportEmail}</>}
        primaryHref="/iletisim"
        primaryLabel="İletişim formu"
        index={3}
        secondary={<a href={SITE.phoneHref} className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 font-plex-mono text-base font-semibold text-brand-navy hover:bg-brand-paper">{SITE.phone}</a>}
      />
    </>
  );
}
