import Link from "next/link";
import { DESIGNS, designSector } from "@/lib/storefront/sector-design/config";
import { MARKET_SIGNUP_SECTOR, TOPTAN_SECTOR_OPTIONS } from "@/lib/billing/toptan-plans";
import { Container } from "@/components/marketing/ui";
import { Accent, PageHero, pastelStyle } from "@/components/marketing/home-v2/page-kit";

export const metadata = { title: "Sektörünüze özel 33 dijital katalog teması", description: "11 sektör için perakende ve toptan satışa uygun 33 tema. Canlı demoları deneyin, temanızı seçerek ücretsiz dijital kataloğunuzu oluşturun.", alternates: { canonical: "https://www.ekatalox.com/temalar" } };

// TASLAK (14 Eki 2026): Beacons tarzı düzen; içerik ve linkler aynı.
export default async function Page({ searchParams }: { searchParams: Promise<{ sektor?: string }> }) {
  const { sektor } = await searchParams;
  const selected = TOPTAN_SECTOR_OPTIONS.some((s) => s.value === sektor) ? sektor : undefined;
  return (
    <>
      <PageHero
        eyebrow="11 sektör · 33 tasarım"
        title={<>Mağazanıza <Accent>yakışan temayı</Accent> bulun.</>}
        lead="Demoyu açın, ürünleri ve sepeti deneyin. Kayıt olduktan sonra sektörünüzün üç temasından birini kendi ürünlerinizle önizleyin; renkleri, görselleri ve yazıları düzenleyip yayınlayın."
      >
        <nav aria-label="Tema sektörleri" className="mt-10 flex flex-wrap justify-center gap-2">
          <Link className={`rounded-full px-4 py-2 text-sm font-semibold ${!selected ? "bg-brand-dark text-white" : "border border-brand-line bg-white text-brand-navy"}`} href="/temalar">Tümü</Link>
          {TOPTAN_SECTOR_OPTIONS.map((s) => (
            <Link key={s.value} aria-current={selected === s.value ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-semibold ${selected === s.value ? "bg-brand-dark text-white" : "border border-brand-line bg-white text-brand-navy hover:border-brand-navy"}`} href={`/temalar?sektor=${s.value}`}>
              {s.label}
            </Link>
          ))}
        </nav>
      </PageHero>
      <section className="bg-white pb-20">
        <Container>
          {TOPTAN_SECTOR_OPTIONS.filter((s) => !selected || s.value === selected).map((s, si) => (
            <section key={s.value} className="mb-16">
              <h2 className="mb-6 text-3xl font-extrabold tracking-[-0.03em] text-brand-navy">{s.label}</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {s.value === MARKET_SIGNUP_SECTOR ? (
                  /* Market sektörünün hazır teması: MarketGo demo mağazası (14 Eki 2026). */
                  <article className="flex flex-col overflow-hidden rounded-[24px] border border-brand-line bg-white shadow-[0_24px_50px_-36px_rgba(18,40,74,0.4)]">
                    <a href="https://marketgo.ekatalox.com" target="_blank" rel="noopener noreferrer" className="block p-3 pb-0">
                      <div className="overflow-hidden rounded-[16px] p-3 pb-0" style={pastelStyle(si)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img loading="lazy" src="/temalar/marketgo-desktop.png" alt="MarketGo market teması: kampanya bannerı, görselli kategoriler ve sepet" className="aspect-video w-full rounded-t-lg object-cover object-top shadow-md" />
                      </div>
                    </a>
                    <div className="flex flex-1 flex-col gap-4 p-6">
                      <h3 className="text-xl font-extrabold tracking-[-0.02em] text-brand-navy">MarketGo</h3>
                      <p className="flex-1 text-sm leading-6 text-brand-muted">Beyaz, ferah market vitrini. Kampanya bannerı, görselli kategoriler, mobilde uygulama gibi alt menü, müşteri üyeliği ve sipariş takibi, kapıda ya da online ödemeli sipariş ekranı.</p>
                      <div className="flex flex-wrap gap-2">
                        <a className="rounded-full bg-brand-dark px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy" href="https://marketgo.ekatalox.com" target="_blank" rel="noopener noreferrer">Canlı demoyu aç</a>
                        <Link className="rounded-full border border-brand-line px-4 py-2.5 text-sm font-semibold text-brand-navy hover:border-brand-navy" href={`/basvuru?sektor=${s.value}`}>Bu temayı seç</Link>
                      </div>
                    </div>
                  </article>
                ) : null}
                {DESIGNS.filter((d) => designSector(d.id) === s.value).map((d, di) => (
                  <article key={d.id} className="flex flex-col overflow-hidden rounded-[24px] border border-brand-line bg-white shadow-[0_24px_50px_-36px_rgba(18,40,74,0.4)]">
                    <Link href={`/tema-demo/${d.id}`} className="block p-3 pb-0">
                      <div className="overflow-hidden rounded-[16px] p-3 pb-0" style={pastelStyle(si + di)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img loading="lazy" src={`/temalar/${d.id}-desktop.png`} alt={`${d.name} dijital katalog teması`} className="aspect-video w-full rounded-t-lg object-cover object-top shadow-md" />
                      </div>
                    </Link>
                    <div className="flex flex-1 flex-col gap-4 p-6">
                      <h3 className="text-xl font-extrabold tracking-[-0.02em] text-brand-navy">{d.name}</h3>
                      <p className="flex-1 text-sm leading-6 text-brand-muted">{d.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Link className="rounded-full bg-brand-dark px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy" href={`/tema-demo/${d.id}`}>Canlı demoyu aç</Link>
                        <Link className="rounded-full border border-brand-line px-4 py-2.5 text-sm font-semibold text-brand-navy hover:border-brand-navy" href={`/basvuru?sektor=${s.value}&tema=${d.id}`}>Bu temayı seç</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </Container>
      </section>
    </>
  );
}
