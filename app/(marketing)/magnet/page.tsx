import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink, CheckList, Container, Eyebrow, Section, SectionHeading, Stat } from "@/components/marketing/ui";
import { ESNAF_PLANS } from "@/lib/billing/esnaf-plans";
import { SITE } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Magnet programı",
  description:
    "Her müşteriye benzersiz QR kodlu buzdolabı magneti. eKatalox basar ve kargolar; Esnaf paketinde 100, Esnaf Plus paketinde 300 adet hediye. Hangi magnetin sipariş getirdiğini panelde görürsünüz.",
  alternates: { canonical: "/magnet" },
};

const [esnaf, esnafPlus] = ESNAF_PLANS;

const HOW = [
  {
    title: "Kasada verirsiniz",
    body: "Poşete bir magnet koyarsınız ya da elden verirsiniz. “Bir dahaki siparişi buradan verin” demeniz yeter.",
  },
  {
    title: "Müşteri buzdolabına yapıştırır",
    body: "Magnet mutfakta, gözün önünde durur. Süt bittiğinde ya da misafir geldiğinde ilk aklına gelen sizin dükkânınız olur.",
  },
  {
    title: "Kodu okutur, sipariş verir",
    body: "Telefonun kamerası QR kodu okur, sipariş sayfanız açılır. Uygulama indirmez, üye olmaz; sepetini doldurur.",
  },
];

const PANEL = [
  "Her magnetin kaç kez okutulduğu",
  "Hangi magnetin ilk siparişi getirdiği",
  "Magnetin bağlandığı müşteri ve sipariş geçmişi",
  "Hiç okutulmayan magnetler (dağıtımı gözden geçirmek için)",
];

export default function MagnetPage() {
  return (
    <>
      <Section tone="white" className="pb-10 sm:pb-14">
        <Container className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <SectionHeading
            eyebrow="Magnet programı"
            title="Müşterinizin buzdolabında sizin QR kodunuz"
            lead="Her müşteriye verdiğiniz magnette size özel, 6 haneli benzersiz bir QR kod bulunur. Kod doğrudan sipariş sayfanıza götürür. Magnetleri eKatalox basar ve kargoyla gönderir; paketle birlikte hediyedir."
          />
          <figure className="mx-auto w-full max-w-[260px]">
            <div className="overflow-hidden rounded-lg border border-brand-line bg-white p-4">
              <Image src="/site/demo-qr.png" alt="Demo mağazanın sipariş sayfasına götüren örnek QR kod" width={900} height={900} sizes="260px" className="h-auto w-full" />
            </div>
            <figcaption className="mt-3 text-center text-xs text-brand-muted">
              Örnek QR: demo mağazanın sipariş sayfası. Telefonunuzla okutup deneyebilirsiniz.
            </figcaption>
          </figure>
        </Container>
      </Section>

      <Section className="pt-0 sm:pt-0">
        <Container>
          <div className="grid gap-8 rounded-lg border border-brand-line bg-white p-6 sm:grid-cols-3 sm:p-8">
            <Stat value={String(esnaf.magnetCount)} label={`${esnaf.name} paketinde hediye magnet`} />
            <Stat value={String(esnafPlus.magnetCount)} label={`${esnafPlus.name} paketinde hediye magnet`} />
            <Stat value="6 hane" label="Her magnette benzersiz kod" />
          </div>
        </Container>
      </Section>

      <Section tone="white">
        <Container>
          <SectionHeading eyebrow="Nasıl dağıtılır" title="Üç adımda müşterinin mutfağına" />
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {HOW.map((h, i) => (
              <li key={h.title} className="border-t-2 border-brand-green pt-5">
                <span className="font-plex-mono text-sm text-brand-muted">0{i + 1}</span>
                <h3 className="mt-2 text-xl font-semibold text-brand-navy">{h.title}</h3>
                <p className="mt-3 leading-relaxed text-brand-muted">{h.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>Panelde ne görürsünüz</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-brand-navy sm:text-4xl">
              Hangi magnet sipariş getirdi, hangisi çekmecede kaldı
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-brand-muted">
              Kodlar benzersiz olduğu için her okutma ve her ilk sipariş magnetine bağlanır. Böylece dağıtımın işe
              yarayıp yaramadığını tahmin etmezsiniz, görürsünüz.
            </p>
            <p className="mt-4 text-sm text-brand-muted">
              Magnet bazında sipariş takibi {esnafPlus.name} paketine dahildir. {esnaf.name} paketinde magnetler aynı
              şekilde çalışır; ayrıntılı takip raporu görünmez.
            </p>
          </div>
          <CheckList items={PANEL} className="lg:pt-10" />
        </Container>
      </Section>

      <Section tone="white">
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow="Basım ve kargo"
            title="Tasarım, basım ve gönderim eKatalox'tan"
            lead="Magnetlerde dükkân adınız, logonuz ve size özel QR kod yer alır. Kurulum tamamlandığında basıma girer ve kargoyla adresinize gelir. Ek magnet ihtiyacınız olursa panelden talep edersiniz."
          />
          <dl className="divide-y divide-brand-line border-y border-brand-line lg:pt-0">
            <div className="grid gap-1 py-4 sm:grid-cols-[1fr_1.4fr]">
              <dt className="font-semibold text-brand-navy">Üzerinde ne var</dt>
              <dd className="text-[15px] text-brand-muted">Dükkân adı, logo, QR kod, kısa yönlendirme yazısı ve 6 haneli kod.</dd>
            </div>
            <div className="grid gap-1 py-4 sm:grid-cols-[1fr_1.4fr]">
              <dt className="font-semibold text-brand-navy">Adet</dt>
              <dd className="font-plex-mono text-[15px] tabular-nums text-brand-muted">
                {esnaf.name}: {esnaf.magnetCount} · {esnafPlus.name}: {esnafPlus.magnetCount}
              </dd>
            </div>
            <div className="grid gap-1 py-4 sm:grid-cols-[1fr_1.4fr]">
              <dt className="font-semibold text-brand-navy">Ücret</dt>
              <dd className="text-[15px] text-brand-muted">Paketle birlikte hediye; basım ve kargo için ayrıca ücret alınmaz.</dd>
            </div>
            <div className="grid gap-1 py-4 sm:grid-cols-[1fr_1.4fr]">
              <dt className="font-semibold text-brand-navy">Ek magnet</dt>
              <dd className="text-[15px] text-brand-muted">Hediye adet bittiğinde panelden ek sipariş verilir; fiyat talep sırasında bildirilir.</dd>
            </div>
          </dl>
        </Container>
      </Section>

      <Section tone="navy">
        <Container className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl">
              Magnetleriniz kurulumla birlikte yola çıksın.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/75">Başvurun, kurulumu biz yapalım, magnetler kargoya versin.</p>
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
