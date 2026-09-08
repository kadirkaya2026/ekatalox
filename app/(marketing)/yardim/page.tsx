import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Container, Section, SectionHeading } from "@/components/marketing/ui";
import { SITE } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Yardım merkezi",
  description: "Kurulum, sipariş alma, magnet, ödeme ve hesap konularında yardım.",
};

const TOPICS = [
  { title: "Başlarken", desc: "Başvuru, kurulum ve ilk siparişe kadar olan yol.", href: "/nasil-calisir" },
  { title: "Sipariş alma", desc: "Sepet, WhatsApp'a düşen PDF, durum bildirimleri.", href: "/ozellikler#siparis" },
  { title: "Magnetler", desc: "QR magnet nedir, nasıl dağıtılır, panelde ne görünür.", href: "/magnet" },
  { title: "Paket ve ödeme", desc: "Esnaf ve Esnaf Plus, aylık/yıllık, deneme süresi.", href: "/fiyatlandirma" },
  { title: "Sık sorulan sorular", desc: "Müşteri uygulama kullanmaz mı, ürünleri kim girer, iptal.", href: "/sss" },
  { title: "Hesap", desc: "Giriş, şifre yenileme, panel adresi.", href: "/sifremi-unuttum" },
];

export default function HelpPage() {
  return (
    <>
      <Section tone="white" className="pb-8 sm:pb-10">
        <Container>
          <SectionHeading eyebrow="Destek" title="Yardım merkezi" lead="Aradığınızı bulamazsanız telefonla ya da e-postayla ulaşın; sorunuzu genelde aynı gün çözeriz." />
        </Container>
      </Section>
      <Section className="pt-0">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((t) => (
              <Link key={t.title} href={t.href} className="rounded-lg border border-brand-line bg-white p-5 transition-colors hover:border-brand-navy">
                <h2 className="font-semibold text-brand-navy">{t.title}</h2>
                <p className="mt-1.5 text-sm text-brand-muted">{t.desc}</p>
              </Link>
            ))}
          </div>
          <div className="mt-12 rounded-lg border border-brand-line bg-white p-6 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Destek hattı</p>
              <p className="mt-1 text-sm text-brand-muted">
                <a href={SITE.phoneHref} className="font-plex-mono font-medium text-brand-navy">{SITE.phone}</a> · <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
              </p>
            </div>
            <ButtonLink href="/iletisim" tone="navy" className="mt-4 sm:mt-0">İletişim formu</ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
