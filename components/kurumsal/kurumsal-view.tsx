import { DealerApplicationForm } from "@/components/kurumsal/dealer-application-form";
import { KurumsalProductCard, KurumsalShell, kurumsalHref } from "@/components/kurumsal/kurumsal-shell";
import { telHref, titleCaseTr, whatsappLink } from "@/lib/kurumsal/format";
import type { KurumsalContent } from "@/lib/kurumsal/schema";
import type { KurumsalData } from "@/lib/storefront/kurumsal-data";

// Kurumsal site ana sayfasının görünümü. Veri ÇEKMEZ: herkese açık
// /kurumsal sayfası (ISR) ve paneldeki sihirbaz önizlemesi (taslak içerikle)
// aynı bileşeni kullanır. preview=true iken bağlantılar "#" olur, form
// gönderilmez.

export interface KurumsalContact {
  phone: string | null;
  email: string | null;
  address: string | null;
  /** Rakamlardan oluşan WhatsApp numarası */
  whatsapp: string | null;
}

export interface KurumsalViewProps {
  tenantName: string;
  subdomain: string;
  logoUrl: string | null;
  wordmark: string | null;
  accent: string;
  heroImage: string | null;
  content: KurumsalContent;
  contact: KurumsalContact;
  data: KurumsalData;
  isWhiteLabel: boolean;
  /** Katalog/sipariş ekranının mutlak adresi ("Bayi Girişi", "Tüm kataloğu gör") */
  catalogUrl: string;
  preview?: boolean;
}

const EYEBROW = "text-sm font-semibold uppercase tracking-widest";

export function KurumsalView({
  tenantName: name,
  subdomain,
  logoUrl,
  wordmark,
  accent,
  heroImage,
  content,
  contact,
  data,
  isWhiteLabel,
  catalogUrl,
  preview = false,
}: KurumsalViewProps) {
  const sections = content.sections;
  const bayiWa = whatsappLink(contact.whatsapp, `Merhaba, ${name} bayisi olmak istiyorum.`);
  const contactWa = whatsappLink(contact.whatsapp, `Merhaba, ${name} hakkında bilgi almak istiyorum.`);
  // Form açıksa "Bayimiz Olun" forma gider; kapalıysa WhatsApp'a.
  const applyHref = sections.form ? "#basvuru" : bayiWa;
  const applyIsExternal = !sections.form;
  const phone = content.phone || contact.phone;
  const about = content.about.filter((paragraph) => paragraph.trim());
  const highlights = content.highlights;
  const showMap = sections.map && Boolean(contact.address);
  const href = (value: string) => kurumsalHref(value, preview);
  const externalProps = { target: "_blank", rel: "noopener noreferrer" } as const;

  const stats = [
    { value: `${data.productCount}+`, label: "Ürün" },
    { value: String(data.categories.length), label: "Kategori" },
    ...(content.badge ? [content.badge] : []),
    { value: "7/24", label: "Bayi Portalı" },
  ];

  const steps = [
    {
      t: "Başvurun",
      b: sections.form
        ? "Başvuru formunu doldurun, firmanızı kısaca tanıtın."
        : "WhatsApp'tan bize yazın, firmanızı kısaca tanıtın.",
    },
    { t: "Portal şifrenizi alın", b: "Onaydan sonra size özel fiyat listesiyle bayi portalına giriş şifreniz iletilir." },
    { t: "Sipariş verin", b: "Katalogdan sepetinizi oluşturun, siparişinizi tek dokunuşla gönderin." },
  ];

  return (
    <KurumsalShell
      tenantName={name}
      logoUrl={logoUrl}
      wordmark={wordmark}
      accent={accent}
      legalName={content.legal_name}
      isWhiteLabel={isWhiteLabel}
      applyHref={applyHref}
      catalogUrl={catalogUrl}
      navBase=""
      showAbout={about.length > 0}
      preview={preview}
    >
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImage} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/10" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--k-accent)" }}>
            {content.eyebrow || name}
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            {content.headline}
          </h1>
          {content.tagline ? (
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">{content.tagline}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {applyHref ? (
              <a
                href={href(applyHref)}
                {...(applyIsExternal ? externalProps : {})}
                className="rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg"
                style={{ backgroundColor: "var(--k-accent)" }}
              >
                Bayimiz Olun
              </a>
            ) : null}
            <a
              href={href("#urunler")}
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
            >
              Ürünleri İncele
            </a>
          </div>
        </div>
      </section>

      {/* İstatistik şeridi */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="py-7 text-center">
              <div className="text-3xl font-extrabold" style={{ color: "var(--k-accent)" }}>
                {stat.value}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Kategoriler */}
      <section id="urunler" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={EYEBROW} style={{ color: "var(--k-accent)" }}>
              Ürün Grupları
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Tek tedarikçiden eksiksiz raf</h2>
          </div>
          <a href={href(catalogUrl)} className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            Tüm kataloğu gör →
          </a>
        </div>
        {data.categories.length ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.categories.map((category) => (
              <a
                key={category.id}
                href={href(`/kategori/${category.id}`)}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex aspect-square items-center justify-center bg-slate-50 p-5">
                  {category.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      loading="lazy"
                      className="h-full w-full object-contain transition group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="border-t border-slate-100 px-4 py-3">
                  <div className="text-sm font-bold">{titleCaseTr(category.name)}</div>
                  <div className="text-xs text-slate-500">{category.productCount} ürün</div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Ürün grupları yakında burada.
          </p>
        )}
      </section>

      {/* Öne çıkan ürünler */}
      {sections.featured && data.featured.length ? (
        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <p className={EYEBROW} style={{ color: "var(--k-accent)" }}>
              Öne Çıkanlar
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Raflarımızdan seçmeler</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {data.featured.map((product) => (
                <KurumsalProductCard key={product.id} product={product} preview={preview} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Neden biz */}
      {highlights.length ? (
        <section id="neden-biz" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-16 sm:py-20">
          <p className={EYEBROW} style={{ color: "var(--k-accent)" }}>
            Neden {name}?
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Bayilerimiz neden bizi tercih ediyor</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-2xl border border-slate-200 p-6">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold text-white"
                  style={{ backgroundColor: "var(--k-accent)" }}
                >
                  {index + 1}
                </div>
                <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                {item.body ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div id="neden-biz" />
      )}

      {/* Nasıl bayi olunur */}
      {sections.steps ? (
        <section className="bg-slate-950 py-16 text-white sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <p className={EYEBROW} style={{ color: "var(--k-accent)" }}>
              Bayilik
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">3 adımda {name} bayisi olun</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.t} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-4xl font-extrabold" style={{ color: "var(--k-accent)" }}>
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-3 text-lg font-bold">{step.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{step.b}</p>
                </div>
              ))}
            </div>
            {applyHref ? (
              <a
                href={href(applyHref)}
                {...(applyIsExternal ? externalProps : {})}
                className="mt-10 inline-block rounded-full px-7 py-3 text-sm font-bold text-white"
                style={{ backgroundColor: "var(--k-accent)" }}
              >
                {sections.form ? "Başvuru Formunu Doldur" : "WhatsApp'tan Başvur"}
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Bayi başvuru formu */}
      {sections.form ? (
        <section id="basvuru" className="scroll-mt-28 border-b border-slate-200 bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <div>
              <p className={EYEBROW} style={{ color: "var(--k-accent)" }}>
                Bayi Başvurusu
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Bayimiz olun</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Formu doldurun, ekibimiz en kısa sürede sizi arasın. Başvurunuz onaylandığında size özel fiyat listesiyle bayi
                portalı giriş şifreniz iletilir.
              </p>
              {bayiWa ? (
                <p className="mt-4 text-sm text-slate-600">
                  Beklemek istemiyor musunuz?{" "}
                  <a href={href(bayiWa)} {...externalProps} className="font-semibold text-slate-900 underline underline-offset-4">
                    WhatsApp&apos;tan yazın
                  </a>
                  .
                </p>
              ) : null}
            </div>
            <DealerApplicationForm subdomain={subdomain} companyName={name} preview={preview} />
          </div>
        </section>
      ) : null}

      {/* Hakkımızda */}
      {about.length ? (
        <section id="hakkimizda" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start">
            <div>
              <p className={EYEBROW} style={{ color: "var(--k-accent)" }}>
                Hakkımızda
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight">{content.headline}</h2>
            </div>
            <div className="space-y-4 text-base leading-relaxed text-slate-700">
              {about.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* İletişim */}
      <section id="iletisim" className="scroll-mt-28 border-t border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className={showMap ? "mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2" : "mx-auto max-w-6xl px-4"}>
          <div>
            <p className={EYEBROW} style={{ color: "var(--k-accent)" }}>
              İletişim
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Bize ulaşın</h2>
            <dl className={showMap ? "mt-8 space-y-5 text-sm" : "mt-8 grid gap-5 text-sm sm:grid-cols-2"}>
              {content.legal_name ? (
                <div>
                  <dt className="font-semibold text-slate-500">Unvan</dt>
                  <dd className="mt-1 font-medium">{content.legal_name}</dd>
                </div>
              ) : null}
              {contact.address ? (
                <div>
                  <dt className="font-semibold text-slate-500">Adres</dt>
                  <dd className="mt-1 font-medium">{contact.address}</dd>
                </div>
              ) : null}
              {phone ? (
                <div>
                  <dt className="font-semibold text-slate-500">Telefon</dt>
                  <dd className="mt-1 font-medium">
                    <a href={href(telHref(phone))}>{phone}</a>
                  </dd>
                </div>
              ) : null}
              {contact.email ? (
                <div>
                  <dt className="font-semibold text-slate-500">E-posta</dt>
                  <dd className="mt-1 font-medium">
                    <a href={href(`mailto:${contact.email}`)}>{contact.email}</a>
                  </dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              {contactWa ? (
                <a
                  href={href(contactWa)}
                  {...externalProps}
                  className="inline-block rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-white"
                >
                  WhatsApp&apos;tan Yazın
                </a>
              ) : null}
              {sections.form ? (
                <a
                  href={href("#basvuru")}
                  className="inline-block rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-800 hover:border-slate-400"
                >
                  Bayi Başvuru Formu
                </a>
              ) : null}
            </div>
          </div>
          {showMap ? (
            preview ? (
              <div className="flex h-80 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-500 lg:h-full">
                Harita: {contact.address}
              </div>
            ) : (
              <iframe
                title={`${name} konum`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(contact.address ?? "")}&output=embed`}
                className="h-80 w-full rounded-2xl border border-slate-200 lg:h-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )
          ) : null}
        </div>
      </section>
    </KurumsalShell>
  );
}
