// Sektör sayfası (8 Eyl 2026): SECTORS tanımından beslenen tek sunucu bileşeni.
// /market, /tekel, /manav ... rotaları getSector(slug) ile bunu çağırır.
import Link from "next/link";
import type { Metadata } from "next";
import type { SectorDefinition } from "@/lib/marketing/sectors";
import { SITE } from "@/lib/marketing/site";
import { ESNAF_PLANS, ESNAF_TRIAL_DAYS, formatTry, getPlanPrice, yearlySavingsPct } from "@/lib/billing/esnaf-plans";
import { getThemeForSector } from "@/lib/storefront/esnaf-themes";
import { PhoneFrame } from "@/components/marketing/phone-frame";
import { ButtonLink, CheckList, Container, Eyebrow, Section, SectionHeading } from "@/components/marketing/ui";

export function buildSectorMetadata(sector: SectorDefinition): Metadata {
  const title = `${sector.name} için WhatsApp sipariş sistemi`;
  return {
    title,
    description: `${sector.headline} ${sector.sub}`,
    alternates: { canonical: `/${sector.slug}` },
    openGraph: {
      title: `${title} | eKatalox`,
      description: sector.sub,
      url: `${SITE.url}/${sector.slug}`,
    },
  };
}

/** Ekran görüntüsü market/tekel içindir; öteki sektörlerde sahte görsel yerine kategori paneli. */
const SCREENSHOT_SECTORS = new Set(["market", "tekel"]);

export function SectorPage({ sector }: { sector: SectorDefinition }) {
  const wholesale = Boolean(sector.wholesale);
  const primaryHref = wholesale ? "/iletisim" : "/basvuru";
  const primaryLabel = wholesale ? "Teklif isteyin" : `${ESNAF_TRIAL_DAYS} gün ücretsiz başlayın`;
  const showPhone = SCREENSHOT_SECTORS.has(sector.slug);

  return (
    <>
      {/* Giriş */}
      <Section tone="white" className="border-b border-brand-line">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>{sector.name}</Eyebrow>
            <h1 className="mt-3 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-brand-navy sm:text-5xl">
              {sector.headline}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-brand-muted">{sector.sub}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={primaryHref} size="lg">
                {primaryLabel}
              </ButtonLink>
              <ButtonLink href={SITE.demoUrl} tone="outline" size="lg" external>
                Örnek mağazayı açın
              </ButtonLink>
            </div>
            {!wholesale ? (
              <p className="mt-4 text-sm text-brand-muted">
                Kart bilgisi istenmez. Kurulumu biz yaparız, yaklaşık {SITE.setupHours} saat sürer.
              </p>
            ) : null}
          </div>
          {showPhone ? (
            <PhoneFrame src="/site/demo-market-iphone.png" alt="eKatalox örnek market mağazası, telefon görünümü" priority />
          ) : (
            <SampleCategoriesPanel sector={sector} />
          )}
        </Container>
      </Section>

      {/* Dertler */}
      <Section>
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow="Bugünkü durum"
            title="Telefonla sipariş almanın dertleri"
            lead="Telefon çalar, tezgâh durur. Söylenen unutulur, yanlış anlaşılır, geri döner."
          />
          <ul className="space-y-4">
            {sector.pains.map((pain, i) => (
              <li key={pain} className="flex gap-4 border-l-2 border-brand-line pl-4">
                <span className="font-plex-mono text-sm text-brand-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-base leading-relaxed">{pain}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Kazanımlar */}
      <Section tone="white">
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow="eKatalox ile"
            title="Sipariş yazılı gelir, siz hazırlarsınız"
            lead="Müşteri telefonundan seçer; sipariş adresi, telefonu ve notuyla WhatsApp'ınıza PDF olarak düşer."
          />
          <CheckList items={sector.wins} />
        </Container>
      </Section>

      {/* Sektöre özel not */}
      {sector.pickupOnly ? <PickupNote /> : null}
      {wholesale ? <WholesaleNote /> : null}

      {/* Tema */}
      {!wholesale ? <ThemeNote sector={sector} /> : null}

      {/* Paket özeti */}
      {!wholesale ? <PackagesTeaser /> : null}

      {/* Kapanış */}
      <Section tone="navy">
        <Container className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl">
              Mahallenizin siparişi WhatsApp’ınıza gelsin.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/80">
              Komisyon yok, aracı yok, müşteri sizin. {wholesale ? "Bayi akışınızı temsilcimizle birlikte kuralım." : `İlk ${ESNAF_TRIAL_DAYS} gün ücretsiz.`}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <ButtonLink href={primaryHref} tone="white" size="lg">
              {wholesale ? "Temsilciyle görüşün" : "Hemen başvurun"}
            </ButtonLink>
            <ButtonLink href={SITE.whatsappHref} tone="outline" size="lg" external className="border-white/30 bg-transparent text-white hover:border-white">
              WhatsApp’tan sorun
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}

function SampleCategoriesPanel({ sector }: { sector: SectorDefinition }) {
  return (
    <div className="rounded-lg border border-brand-line bg-brand-paper p-6 sm:p-8">
      <Eyebrow>Vitrininizde neler olur</Eyebrow>
      <p className="mt-3 text-base leading-relaxed text-brand-muted">
        Kategorileri sizin raf dilinizle kurarız. Örnek bir {sector.label.toLocaleLowerCase("tr-TR")} vitrini şu başlıklarla açılır:
      </p>
      <ul className="mt-5 flex flex-wrap gap-2">
        {sector.sampleCategories.map((c) => (
          <li key={c} className="rounded-md border border-brand-line bg-white px-3 py-1.5 text-sm font-medium text-brand-navy">
            {c}
          </li>
        ))}
      </ul>
      <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-brand-line pt-6 text-sm">
        <div>
          <dt className="text-brand-muted">Ürün yükleme</dt>
          <dd className="mt-1 font-medium text-brand-ink">Fotoğraf ve fiyatla, bizim tarafımızdan</dd>
        </div>
        <div>
          <dt className="text-brand-muted">Sipariş kanalı</dt>
          <dd className="mt-1 font-medium text-brand-ink">WhatsApp’a PDF sipariş</dd>
        </div>
        <div>
          <dt className="text-brand-muted">Adres</dt>
          <dd className="mt-1 font-plex-mono font-medium text-brand-ink">dukkan.ekatalox.com</dd>
        </div>
        <div>
          <dt className="text-brand-muted">Kurulum</dt>
          <dd className="mt-1 font-medium text-brand-ink">Yaklaşık {SITE.setupHours} saat</dd>
        </div>
      </dl>
    </div>
  );
}

function PickupNote() {
  return (
    <Section>
      <Container>
        <div className="max-w-3xl rounded-lg border border-brand-amber/40 bg-brand-amber-soft p-6 sm:p-8">
          <Eyebrow className="text-brand-amber">Tekel bayileri için önemli</Eyebrow>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-brand-navy">Teslimat yok, hazırlatma var</h2>
          <div className="mt-4 space-y-3 text-base leading-relaxed">
            <p>
              Tekel bayilerinde kurye ya da adrese teslimat akışı açılmaz. Müşteri listesini telefonundan hazırlatır, siz
              poşeti hazır tutarsınız, müşteri gelip dükkândan alır.
            </p>
            <p>
              Alkollü içki ve tütün ürünleri internet üzerinden satılmaz; bu ürünler vitrinde çevrim içi satışa kapalı
              kalır. Vitrin, atıştırmalık ve içecek gibi ürünlerin listelenmesi ve hazırlatma siparişi içindir.
            </p>
            <p>Yaş doğrulama sipariş öncesinde, sizin adınıza sorulur. Kullanım şartlarındaki düzenlemeye tabi ürünler maddesi geçerlidir.</p>
          </div>
          <Link href="/kullanim-sartlari" className="mt-5 inline-block text-sm font-semibold text-brand-navy underline underline-offset-4">
            Kullanım şartlarını okuyun
          </Link>
        </div>
      </Container>
    </Section>
  );
}

function WholesaleNote() {
  return (
    <Section>
      <Container>
        <div className="max-w-3xl rounded-lg border border-brand-line bg-white p-6 sm:p-8">
          <Eyebrow>Toptancılar için</Eyebrow>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-brand-navy">B2B akış, esnaf paketlerinden ayrı</h2>
          <div className="mt-4 space-y-3 text-base leading-relaxed">
            <p>
              Toptancı ve distribütörler için katalog şifre korumalıdır; her bayi kendi fiyat listesini görür. Ürünler
              Excel’den yüklenir, sipariş yapılandırılmış biçimde WhatsApp’a ve panele düşer.
            </p>
            <p>
              Paketler bayi sayısına ve ürün adedine göre temsilcimiz tarafından teklif edilir; bu sayfadaki esnaf
              paketleri toptancılar için geçerli değildir.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/iletisim">Teklif isteyin</ButtonLink>
            <ButtonLink href={SITE.phoneHref} tone="outline" external>
              {SITE.phone}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function ThemeNote({ sector }: { sector: SectorDefinition }) {
  const theme = getThemeForSector(sector.slug);
  return (
    <Section tone="white">
      <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <SectionHeading
          eyebrow="Sizin için hazır tema"
          title={`${theme.title} teması`}
          lead={`${sector.name} için önerdiğimiz tema: ${theme.description}`}
        />
        <div className="rounded-lg border border-brand-line bg-brand-paper p-6">
          <p className="text-sm text-brand-muted">Kayıtta otomatik uygulanır</p>
          <p className="mt-2 text-xl font-bold text-brand-navy">{theme.title}</p>
          <p className="mt-1 text-sm text-brand-muted">Önerildiği sektörler: {theme.recommendedFor}</p>
          <p className="mt-4 text-base leading-relaxed">
            Tema tek cümleyle: {theme.description} Renk ve logo, kurulumda sizin markanıza göre ayarlanır.
          </p>
        </div>
      </Container>
    </Section>
  );
}

function PackagesTeaser() {
  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Paketler"
          title="İki paket, komisyon yok"
          lead={`İlk ${ESNAF_TRIAL_DAYS} gün ücretsiz; kart bilgisi istenmez. Fiyatlara KDV dahil değildir.`}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {ESNAF_PLANS.map((plan) => (
            <div
              key={plan.slug}
              className={
                plan.featured
                  ? "rounded-lg border-2 border-brand-green bg-white p-6"
                  : "rounded-lg border border-brand-line bg-white p-6"
              }
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-xl font-bold text-brand-navy">{plan.name}</h3>
                {plan.featured ? (
                  <span className="rounded-md bg-brand-green-soft px-2 py-1 text-xs font-semibold text-brand-green">Önerilen</span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-brand-muted">{plan.tagline}</p>
              <p className="mt-5 font-plex-mono text-3xl font-medium tabular-nums text-brand-navy">
                {formatTry(getPlanPrice(plan, "yearly"))}
                <span className="ml-1 text-sm font-normal text-brand-muted">/ yıl</span>
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                Aylık {formatTry(getPlanPrice(plan, "monthly"))}. Yıllıkta %{yearlySavingsPct(plan)} tasarruf.
              </p>
              <p className="mt-4 text-sm">
                {plan.magnetCount} adet QR magnet hediye, {plan.productLimit.toLocaleString("tr-TR")} ürüne kadar.
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <ButtonLink href="/fiyatlandirma" tone="navy">
            Paketleri karşılaştırın
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
