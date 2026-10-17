import { DealerApplicationForm } from "@/components/kurumsal/dealer-application-form";
import { KurumsalProductCard, KurumsalShell } from "@/components/kurumsal/kurumsal-shell";
import { kurumsalPath } from "@/lib/kurumsal/domain";
import { categoryLabel, telHref, whatsappLink } from "@/lib/kurumsal/format";
import { sanitizeKurumsalLegalHtml } from "@/lib/kurumsal/legal-html";
import type { KurumsalPageContext } from "@/lib/kurumsal/page-context";
import type { KurumsalLegalPage } from "@/lib/kurumsal/schema";
import type { KurumsalData } from "@/lib/storefront/kurumsal-data";
import { cn } from "@/lib/utils";

// Çok sayfalı kurumsal site (content.layout === "pages", 17 Eki 2026, ilk
// kullanan Nailport). Tek sayfalı düzen (kurumsal-view.tsx) aynen duruyor;
// kategori/ürün sayfaları KurumsalFrame ile hangi kabuğun kullanılacağını
// içerikten seçer. Sayfalar: Ana Sayfa, Hakkımızda, Ürünler, Markalar,
// Bayilik, İletişim, Yasal (/yasal/[slug]). Hepsi sunucu bileşeni; telefon
// menüsü <details> ile JS'siz açılır.

export type KurumsalProPage = "home" | "hakkimizda" | "urunler" | "markalar" | "bayilik" | "iletisim" | "yasal";

const NAV: Array<{ key: KurumsalProPage; path: string; label: string }> = [
  { key: "home", path: "/", label: "Ana Sayfa" },
  { key: "hakkimizda", path: "/hakkimizda", label: "Hakkımızda" },
  { key: "urunler", path: "/urunler", label: "Ürünler" },
  { key: "markalar", path: "/markalar", label: "Markalar" },
  { key: "bayilik", path: "/bayilik", label: "Bayilik" },
  { key: "iletisim", path: "/iletisim", label: "İletişim" },
];

export function isKurumsalPagesLayout(ctx: Pick<KurumsalPageContext, "content">) {
  return ctx.content.layout === "pages";
}

/** "Bayimiz Olun" hedefi: çok sayfalıda Bayilik sayfası, tek sayfalıda #basvuru, form kapalıysa WhatsApp. */
export function kurumsalApplyHref(ctx: KurumsalPageContext) {
  if (!ctx.content.sections.form) {
    return whatsappLink(ctx.contact.whatsapp, `Merhaba, ${ctx.tenant.company_name} bayisi olmak istiyorum.`);
  }
  return isKurumsalPagesLayout(ctx)
    ? kurumsalPath(ctx.basePath, "/bayilik#basvuru")
    : kurumsalPath(ctx.basePath, "#basvuru");
}

const isExternal = (href: string) => /^https?:\/\//.test(href);
const externalProps = (href: string) => (isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {});

/** Kategori/ürün sayfaları: içeriğe göre çok sayfalı ya da tek sayfalı kabuk. */
export function KurumsalFrame({
  ctx,
  active = "urunler",
  children,
}: {
  ctx: KurumsalPageContext;
  active?: KurumsalProPage;
  children: React.ReactNode;
}) {
  if (isKurumsalPagesLayout(ctx)) {
    return (
      <KurumsalProShell ctx={ctx} active={active}>
        {children}
      </KurumsalProShell>
    );
  }
  return (
    <KurumsalShell
      tenantName={ctx.tenant.company_name}
      logoUrl={ctx.settings.logo_url}
      wordmark={ctx.wordmark}
      accent={ctx.accent}
      legalName={ctx.content.legal_name}
      isWhiteLabel={ctx.isWhiteLabel}
      applyHref={kurumsalApplyHref(ctx)}
      catalogUrl={ctx.catalogUrl}
      basePath={ctx.basePath}
      isHome={false}
      showAbout={ctx.content.about.length > 0}
    >
      {children}
    </KurumsalShell>
  );
}

function Logo({ ctx, className }: { ctx: KurumsalPageContext; className?: string }) {
  const logo = ctx.settings.logo_url;
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      {logo ? (
        // Koyu zeminde siyah logo beyaza çevrilir.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={ctx.tenant.company_name} className="h-7 w-auto brightness-0 invert sm:h-8" />
      ) : null}
      {ctx.wordmark !== "" ? (
        <span className="truncate text-lg font-extrabold tracking-[0.12em] text-white">
          {ctx.wordmark ?? ctx.tenant.company_name}
        </span>
      ) : null}
    </span>
  );
}

export function KurumsalProShell({
  ctx,
  active,
  children,
}: {
  ctx: KurumsalPageContext;
  active: KurumsalProPage;
  children: React.ReactNode;
}) {
  const path = (value: string) => kurumsalPath(ctx.basePath, value);
  const apply = kurumsalApplyHref(ctx);
  const phone = ctx.content.phone || ctx.contact.phone;
  const legalPages = ctx.content.legal_pages ?? [];
  const legalName = (ctx.content.legal_name || ctx.tenant.company_name).replace(/\.$/, "");

  return (
    <div className="min-h-svh bg-[#FAF8F5] text-neutral-900" style={{ ["--k-accent" as string]: ctx.accent }}>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/95 text-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:h-[72px] sm:px-6">
          <a href={path("/")} aria-label="Ana sayfa">
            <Logo ctx={ctx} />
          </a>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Ana menü">
            {NAV.map((item) => (
              <a
                key={item.key}
                href={path(item.path)}
                aria-current={active === item.key ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition",
                  active === item.key ? "text-white" : "text-neutral-400 hover:text-white",
                )}
              >
                {item.label}
                {active === item.key ? (
                  <span
                    className="absolute inset-x-4 -bottom-[13px] h-0.5 rounded-full sm:-bottom-[17px]"
                    style={{ backgroundColor: "var(--k-accent)" }}
                  />
                ) : null}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={ctx.catalogUrl}
              className="hidden rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50 sm:inline-block"
            >
              Bayi Girişi
            </a>
            {apply ? (
              <a
                href={apply}
                {...externalProps(apply)}
                className="hidden rounded-full px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 md:inline-block"
                style={{ backgroundColor: "var(--k-accent)" }}
              >
                Bayimiz Olun
              </a>
            ) : null}
            <details className="group relative lg:hidden">
              <summary
                className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-white/20 [&::-webkit-details-marker]:hidden"
                aria-label="Menü"
              >
                <span className="flex w-4 flex-col gap-1 group-open:hidden">
                  <span className="h-0.5 rounded bg-white" />
                  <span className="h-0.5 rounded bg-white" />
                  <span className="h-0.5 rounded bg-white" />
                </span>
                <span className="hidden text-lg leading-none group-open:block">×</span>
              </summary>
              <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 p-2 shadow-2xl">
                {NAV.map((item) => (
                  <a
                    key={item.key}
                    href={path(item.path)}
                    className={cn(
                      "block rounded-xl px-4 py-3 text-sm font-medium",
                      active === item.key ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/5",
                    )}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="mt-2 grid gap-2 border-t border-white/10 p-2 pt-3">
                  <a
                    href={ctx.catalogUrl}
                    className="rounded-full border border-white/20 px-4 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Bayi Girişi
                  </a>
                  {apply ? (
                    <a
                      href={apply}
                      {...externalProps(apply)}
                      className="rounded-full px-4 py-2.5 text-center text-sm font-bold text-white"
                      style={{ backgroundColor: "var(--k-accent)" }}
                    >
                      Bayimiz Olun
                    </a>
                  ) : null}
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="bg-neutral-950 text-neutral-400">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo ctx={ctx} />
            {ctx.content.tagline ? <p className="mt-5 max-w-sm text-sm leading-relaxed">{ctx.content.tagline}</p> : null}
            <a
              href={ctx.catalogUrl}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white hover:underline"
            >
              Bayi portalına giriş →
            </a>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Kurumsal</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {NAV.filter((item) => item.key !== "home").map((item) => (
                <li key={item.key}>
                  <a href={path(item.path)} className="hover:text-white">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            {legalPages.length ? (
              <>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Yasal</h3>
                <ul className="mt-5 space-y-3 text-sm">
                  {legalPages.map((page) => (
                    <li key={page.slug}>
                      <a href={path(`/yasal/${page.slug}`)} className="hover:text-white">
                        {page.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">İletişim</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {ctx.contact.address ? <li className="leading-relaxed">{ctx.contact.address}</li> : null}
              {phone ? (
                <li>
                  <a href={telHref(phone)} className="hover:text-white">
                    {phone}
                  </a>
                </li>
              ) : null}
              {ctx.contact.email ? (
                <li>
                  <a href={`mailto:${ctx.contact.email}`} className="hover:text-white">
                    {ctx.contact.email}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs sm:flex-row sm:px-6">
            <span>
              © {new Date().getFullYear()} {legalName}. Tüm hakları saklıdır.
            </span>
            {!ctx.isWhiteLabel ? (
              <a href="https://ekatalox.com" className="hover:text-white">
                eKatalox altyapısıyla hazırlanmıştır
              </a>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ───────────── Ortak parçalar ───────────── */

/** Sabit oranlı görsel kutusu: dikey/yatay görsel kutuyu esnetmez (img mutlak konumlu). */
function ImageBox({
  src,
  alt,
  className,
  imgClassName,
}: {
  src: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={cn("absolute inset-0 h-full w-full object-contain p-6 transition duration-500", imgClassName)}
        />
      ) : null}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "var(--k-accent)" }}>
      {children}
    </p>
  );
}

/** Alt sayfaların koyu başlık bandı. */
export function KurumsalProPageHero({
  ctx,
  eyebrow,
  title,
  lead,
  crumbs,
}: {
  ctx: KurumsalPageContext;
  eyebrow: string;
  title: string;
  lead?: string | null;
  crumbs: Array<{ label: string; href?: string }>;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-neutral-950 text-white">
      {ctx.heroImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ctx.heroImage}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover object-right opacity-35"
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-neutral-950/40" />
      <div className="mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
        <nav aria-label="Konum" className="text-xs text-neutral-400">
          <ol className="flex flex-wrap items-center gap-1.5">
            {[{ label: "Ana Sayfa", href: kurumsalPath(ctx.basePath, "/") }, ...crumbs].map((item, index) => (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {item.href ? (
                  <a href={item.href} className="hover:text-white">
                    {item.label}
                  </a>
                ) : (
                  <span className="text-neutral-200">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <div className="mt-8">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">{title}</h1>
          {lead ? <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-300 sm:text-lg">{lead}</p> : null}
        </div>
      </div>
    </section>
  );
}

function CtaBand({ ctx, title, body }: { ctx: KurumsalPageContext; title: string; body: string }) {
  const apply = kurumsalApplyHref(ctx);
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <div className="relative isolate overflow-hidden rounded-3xl bg-neutral-950 px-6 py-12 text-white sm:px-12 sm:py-14">
        <div
          className="absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: "var(--k-accent)" }}
        />
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
            <p className="mt-3 text-base leading-relaxed text-neutral-300">{body}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {apply ? (
              <a
                href={apply}
                {...externalProps(apply)}
                className="rounded-full px-7 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
                style={{ backgroundColor: "var(--k-accent)" }}
              >
                Bayimiz Olun
              </a>
            ) : null}
            <a
              href={ctx.catalogUrl}
              className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-bold text-white transition hover:border-white/60"
            >
              Bayi Girişi
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryTile({ ctx, category }: { ctx: KurumsalPageContext; category: KurumsalData["categories"][number] }) {
  return (
    <a
      href={kurumsalPath(ctx.basePath, `/kategori/${category.id}`)}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white transition hover:-translate-y-1 hover:border-neutral-300 hover:shadow-xl"
    >
      <ImageBox
        src={category.imageUrl}
        alt={category.name}
        className="aspect-square bg-neutral-50"
        imgClassName="group-hover:scale-105"
      />
      <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-5 py-4">
        <div className="min-w-0">
          <div className="truncate text-base font-bold">{categoryLabel(category.name, ctx.keepCategoryNameCase)}</div>
          <div className="text-xs text-neutral-500">{category.productCount} ürün</div>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-sm transition group-hover:border-neutral-900">
          <span className="transition group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </a>
  );
}

/* ───────────── Ana Sayfa ───────────── */

export function KurumsalProHome({ ctx, data }: { ctx: KurumsalPageContext; data: KurumsalData }) {
  const { content } = ctx;
  const path = (value: string) => kurumsalPath(ctx.basePath, value);
  const apply = kurumsalApplyHref(ctx);
  const about = content.about.filter((paragraph) => paragraph.trim());
  const stats = [
    { value: `${data.productCount.toLocaleString("tr-TR")}+`, label: "Ürün" },
    { value: String(data.categories.length), label: "Ürün Grubu" },
    ...(data.brands.length ? [{ value: String(data.brands.length), label: "Marka" }] : []),
    ...(content.badge ? [content.badge] : [{ value: "7/24", label: "Bayi Portalı" }]),
  ].slice(0, 4);

  return (
    <KurumsalProShell ctx={ctx} active="home">
      {/* Hero */}
      <section className="relative isolate flex min-h-[calc(100svh-64px)] items-center overflow-hidden bg-neutral-950 text-white sm:min-h-[calc(100svh-72px)]">
        {ctx.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ctx.heroImage} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover object-[78%_center]" />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-neutral-950 to-transparent" />
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <Eyebrow>{content.eyebrow || ctx.tenant.company_name}</Eyebrow>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">{content.headline}</h1>
            {content.tagline ? (
              <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-300 sm:text-lg">{content.tagline}</p>
            ) : null}
            <div className="mt-10 flex flex-wrap gap-3">
              {apply ? (
                <a
                  href={apply}
                  {...externalProps(apply)}
                  className="rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
                  style={{ backgroundColor: "var(--k-accent)" }}
                >
                  Bayimiz Olun
                </a>
              ) : null}
              <a
                href={path("/urunler")}
                className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-bold text-white transition hover:border-white/70"
              >
                Ürünleri Keşfet
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Sayılar */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-neutral-200 px-4 sm:px-6 lg:grid-cols-4 lg:divide-x">
          {stats.map((stat) => (
            <div key={stat.label} className="px-4 py-9 text-center lg:py-11">
              <div className="text-4xl font-extrabold tracking-tight" style={{ color: "var(--k-accent)" }}>
                {stat.value}
              </div>
              <div className="mt-1.5 text-sm font-medium text-neutral-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Ürün grupları */}
      {data.categories.length ? (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>Ürün Grupları</Eyebrow>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Tek tedarikçiden eksiksiz raf</h2>
            </div>
            <a href={path("/urunler")} className="text-sm font-bold hover:underline" style={{ color: "var(--k-accent)" }}>
              Tüm ürün grupları →
            </a>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {data.categories.slice(0, 8).map((category) => (
              <CategoryTile key={category.id} ctx={ctx} category={category} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Markalar şeridi */}
      {data.brands.length ? (
        <section className="border-y border-neutral-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Eyebrow>Çalıştığımız Markalar</Eyebrow>
              <a href={path("/markalar")} className="text-sm font-bold hover:underline" style={{ color: "var(--k-accent)" }}>
                Tüm markalar →
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
              {data.brands.slice(0, 12).map((brand) => (
                <span
                  key={brand.name}
                  lang="en"
                  className="text-xl font-extrabold uppercase tracking-wide text-neutral-300 sm:text-2xl"
                >
                  {brand.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Neden biz */}
      {content.highlights.length ? (
        <section className="bg-neutral-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
              <div>
                <Eyebrow>
                  Neden <span lang="en">{ctx.tenant.company_name}</span>?
                </Eyebrow>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Bayilerimiz neden bizi tercih ediyor
                </h2>
                <a
                  href={path("/hakkimizda")}
                  className="mt-8 inline-block text-sm font-bold hover:underline"
                  style={{ color: "var(--k-accent)" }}
                >
                  Bizi tanıyın →
                </a>
              </div>
              <div className="grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2">
                {content.highlights.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="bg-neutral-950 p-8">
                    <div className="text-sm font-extrabold" style={{ color: "var(--k-accent)" }}>
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
                    {item.body ? <p className="mt-3 text-sm leading-relaxed text-neutral-400">{item.body}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Hakkımızda özeti */}
      {about.length ? (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Eyebrow>Hakkımızda</Eyebrow>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{content.headline}</h2>
              <p className="mt-6 text-lg leading-relaxed text-neutral-600">{about[0]}</p>
              <a
                href={path("/hakkimizda")}
                className="mt-8 inline-block rounded-full border border-neutral-300 px-6 py-3 text-sm font-bold transition hover:border-neutral-900"
              >
                Hikâyemizi okuyun
              </a>
            </div>
            {data.featured.length >= 4 ? (
              <div className="grid grid-cols-2 gap-4 pb-8">
                {data.featured.slice(0, 4).map((product, index) => (
                  <ImageBox
                    key={product.id}
                    src={product.imageUrl}
                    alt={product.name}
                    className={cn(
                      "aspect-square rounded-3xl border border-neutral-200 bg-white",
                      index % 2 === 1 ? "translate-y-8" : "",
                    )}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Öne çıkanlar */}
      {content.sections.featured && data.featured.length ? (
        <section className="border-t border-neutral-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
            <Eyebrow>Öne Çıkanlar</Eyebrow>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Raflarımızdan seçmeler</h2>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {data.featured.slice(0, 8).map((product) => (
                <KurumsalProductCard key={product.id} product={product} basePath={ctx.basePath} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="pt-20">
        <CtaBand
          ctx={ctx}
          title={`${ctx.tenant.company_name} bayisi olun`}
          body="Size özel fiyat listesi, 7/24 açık bayi portalı ve WhatsApp ile tek dokunuşta sipariş."
        />
      </div>
    </KurumsalProShell>
  );
}

/* ───────────── Hakkımızda ───────────── */

export function KurumsalProAbout({ ctx, data }: { ctx: KurumsalPageContext; data: KurumsalData }) {
  const { content } = ctx;
  const about = content.about.filter((paragraph) => paragraph.trim());
  const facts = [
    ...(content.founded_year ? [{ label: "Kuruluş", value: String(content.founded_year) }] : []),
    ...(content.city ? [{ label: "Merkez", value: content.city }] : []),
    { label: "Ürün", value: `${data.productCount.toLocaleString("tr-TR")}+` },
    { label: "Ürün grubu", value: String(data.categories.length) },
    ...(data.brands.length ? [{ label: "Marka", value: String(data.brands.length) }] : []),
  ];

  return (
    <KurumsalProShell ctx={ctx} active="hakkimizda">
      <KurumsalProPageHero
        ctx={ctx}
        eyebrow="Hakkımızda"
        title={content.headline}
        lead={content.tagline}
        crumbs={[{ label: "Hakkımızda" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="grid gap-14 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6 text-lg leading-relaxed text-neutral-700">
            {about.map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 24)}`} className={index === 0 ? "text-xl font-medium text-neutral-900" : ""}>
                {paragraph}
              </p>
            ))}
          </div>
          <aside className="h-fit rounded-3xl bg-neutral-950 p-8 text-white lg:sticky lg:top-28">
            <Eyebrow>Kısaca</Eyebrow>
            <dl className="mt-6 divide-y divide-white/10">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-baseline justify-between gap-4 py-4">
                  <dt className="text-sm text-neutral-400">{fact.label}</dt>
                  <dd className="text-xl font-extrabold">{fact.value}</dd>
                </div>
              ))}
            </dl>
            {content.legal_name ? <p className="mt-6 text-xs text-neutral-500">{content.legal_name}</p> : null}
          </aside>
        </div>
      </section>

      {content.highlights.length ? (
        <section className="border-y border-neutral-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <Eyebrow>Değerlerimiz</Eyebrow>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Bizi farklı kılanlar</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {content.highlights.map((item, index) => (
                <div key={`${item.title}-${index}`} className="rounded-3xl border border-neutral-200 p-7">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-extrabold text-white"
                    style={{ backgroundColor: "var(--k-accent)" }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                  {item.body ? <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.body}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="pt-20">
        <CtaBand
          ctx={ctx}
          title="Birlikte büyüyelim"
          body="Bayi ağımıza katılın; güncel fiyat listemize ve tüm kataloğumuza 7/24 ulaşın."
        />
      </div>
    </KurumsalProShell>
  );
}

/* ───────────── Ürünler ───────────── */

export function KurumsalProProducts({ ctx, data }: { ctx: KurumsalPageContext; data: KurumsalData }) {
  const path = (value: string) => kurumsalPath(ctx.basePath, value);
  return (
    <KurumsalProShell ctx={ctx} active="urunler">
      <KurumsalProPageHero
        ctx={ctx}
        eyebrow="Ürünler"
        title="Ürün grupları"
        lead={`${data.productCount.toLocaleString("tr-TR")}+ ürün, ${data.categories.length} ürün grubunda. Fiyatlar bayilerimize özeldir; tüm katalog bayi portalında.`}
        crumbs={[{ label: "Ürünler" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {data.categories.map((category) => (
            <div
              key={category.id}
              className="group grid overflow-hidden rounded-3xl border border-neutral-200 bg-white sm:grid-cols-[200px_1fr]"
            >
              <a href={path(`/kategori/${category.id}`)} className="block bg-neutral-50">
                <ImageBox
                  src={category.imageUrl}
                  alt={category.name}
                  className="aspect-[16/10] h-full sm:aspect-auto sm:min-h-[200px]"
                  imgClassName="group-hover:scale-105"
                />
              </a>
              <div className="flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <a href={path(`/kategori/${category.id}`)} className="text-xl font-extrabold tracking-tight hover:underline">
                    {categoryLabel(category.name, ctx.keepCategoryNameCase)}
                  </a>
                  <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600">
                    {category.productCount} ürün
                  </span>
                </div>
                {category.children.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {category.children.map((child) => (
                      <a
                        key={child.id}
                        href={path(`/kategori/${child.id}`)}
                        className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-900"
                      >
                        {categoryLabel(child.name, ctx.keepCategoryNameCase)}
                        <span className="ml-1 text-neutral-400">{child.productCount}</span>
                      </a>
                    ))}
                  </div>
                ) : null}
                <a
                  href={path(`/kategori/${category.id}`)}
                  className="mt-auto pt-6 text-sm font-bold"
                  style={{ color: "var(--k-accent)" }}
                >
                  Ürünleri incele →
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CtaBand
        ctx={ctx}
        title="Fiyatları görmek ister misiniz?"
        body="Güncel fiyat listemiz bayilerimize özeldir. Bayiyseniz giriş yapın, değilseniz hemen başvurun."
      />
    </KurumsalProShell>
  );
}

/* ───────────── Markalar ───────────── */

export function KurumsalProBrands({ ctx, data }: { ctx: KurumsalPageContext; data: KurumsalData }) {
  return (
    <KurumsalProShell ctx={ctx} active="markalar">
      <KurumsalProPageHero
        ctx={ctx}
        eyebrow="Markalar"
        title="Sektörün güvendiği markalar"
        lead={`${data.brands.length} markanın ürünleri tek tedarikçide. Tüm ürünler bayi portalımızda güncel fiyatlarıyla.`}
        crumbs={[{ label: "Markalar" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        {data.brands.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.brands.map((brand) => (
              <div key={brand.name} className="group flex flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white">
                <ImageBox
                  src={brand.imageUrl}
                  alt={brand.name}
                  className="aspect-[4/3] bg-neutral-50"
                  imgClassName="group-hover:scale-105"
                />
                <div className="border-t border-neutral-100 px-5 py-4">
                  <div lang="en" className="text-lg font-extrabold uppercase tracking-wide">
                    {brand.name}
                  </div>
                  <div className="text-xs text-neutral-500">{brand.productCount} ürün</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-3xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500">
            Marka listesi yakında burada.
          </p>
        )}
      </section>

      <CtaBand
        ctx={ctx}
        title="Tüm markalar tek portalda"
        body="Bayimiz olun; tüm markaların güncel fiyatlarına bayi portalından ulaşın."
      />
    </KurumsalProShell>
  );
}

/* ───────────── Bayilik ───────────── */

export function KurumsalProDealer({ ctx }: { ctx: KurumsalPageContext }) {
  const { content } = ctx;
  const name = ctx.tenant.company_name;
  const bayiWa = whatsappLink(ctx.contact.whatsapp, `Merhaba, ${name} bayisi olmak istiyorum.`);
  const steps = [
    {
      t: "Başvurun",
      b: content.sections.form
        ? "Aşağıdaki formu doldurun, firmanızı kısaca tanıtın."
        : "WhatsApp'tan bize yazın, firmanızı kısaca tanıtın.",
    },
    { t: "Portal şifrenizi alın", b: "Onaydan sonra size özel fiyat listesiyle bayi portalına giriş şifreniz iletilir." },
    { t: "Sipariş verin", b: "Katalogdan sepetinizi oluşturun, siparişinizi tek dokunuşla WhatsApp'tan gönderin." },
  ];

  return (
    <KurumsalProShell ctx={ctx} active="bayilik">
      <KurumsalProPageHero
        ctx={ctx}
        eyebrow="Bayilik"
        title={`3 adımda ${name} bayisi olun`}
        lead="Size özel fiyat listesi, 7/24 açık bayi portalı ve hızlı sipariş. Başvurunuzu bırakın, ekibimiz sizi arasın."
        crumbs={[{ label: "Bayilik" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.t} className="relative rounded-3xl border border-neutral-200 bg-white p-8">
              <div className="text-5xl font-extrabold tracking-tight" style={{ color: "var(--k-accent)" }}>
                {String(index + 1).padStart(2, "0")}
              </div>
              <h2 className="mt-4 text-xl font-bold">{step.t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{step.b}</p>
            </div>
          ))}
        </div>
      </section>

      {content.highlights.length ? (
        <section className="bg-neutral-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <Eyebrow>Bayilerimize Sunduklarımız</Eyebrow>
            <div className="mt-8 grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {content.highlights.map((item, index) => (
                <div key={`${item.title}-${index}`} className="bg-neutral-950 p-7">
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  {item.body ? <p className="mt-2 text-sm leading-relaxed text-neutral-400">{item.body}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {content.sections.form ? (
        <section id="basvuru" className="scroll-mt-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <div>
              <Eyebrow>Bayi Başvurusu</Eyebrow>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Başvuru formu</h2>
              <p className="mt-5 text-base leading-relaxed text-neutral-600">
                Formu doldurun, ekibimiz en kısa sürede sizinle iletişime geçsin. Başvurunuz onaylandığında size özel fiyat
                listesiyle bayi portalı giriş şifreniz iletilir.
              </p>
              {bayiWa ? (
                <a
                  href={bayiWa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-white"
                >
                  WhatsApp&apos;tan hemen yazın
                </a>
              ) : null}
            </div>
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8">
              <DealerApplicationForm subdomain={ctx.tenant.subdomain} companyName={name} />
            </div>
          </div>
        </section>
      ) : null}
    </KurumsalProShell>
  );
}

/* ───────────── İletişim ───────────── */

export function KurumsalProContact({ ctx }: { ctx: KurumsalPageContext }) {
  const { content, contact } = ctx;
  const phone = content.phone || contact.phone;
  const wa = whatsappLink(contact.whatsapp, `Merhaba, ${ctx.tenant.company_name} hakkında bilgi almak istiyorum.`);
  const apply = kurumsalApplyHref(ctx);
  const cards = [
    ...(contact.address ? [{ label: "Adres", value: contact.address, href: null as string | null }] : []),
    ...(phone ? [{ label: "Telefon", value: phone, href: telHref(phone) }] : []),
    ...(contact.email ? [{ label: "E-posta", value: contact.email, href: `mailto:${contact.email}` }] : []),
  ];

  return (
    <KurumsalProShell ctx={ctx} active="iletisim">
      <KurumsalProPageHero
        ctx={ctx}
        eyebrow="İletişim"
        title="Bize ulaşın"
        lead="Bayilik, ürünler ve siparişleriniz için bize her zaman yazabilirsiniz."
        crumbs={[{ label: "İletişim" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-3xl border border-neutral-200 bg-white p-7">
              <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--k-accent)" }}>
                {card.label}
              </div>
              {card.href ? (
                <a href={card.href} className="mt-3 block break-words text-lg font-bold leading-snug hover:underline">
                  {card.value}
                </a>
              ) : (
                <p className="mt-3 text-lg font-bold leading-snug">{card.value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_2fr]">
          <div className="flex flex-col justify-between rounded-3xl bg-neutral-950 p-8 text-white">
            <div>
              <h2 className="text-2xl font-extrabold">Hızlı iletişim</h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                Sorularınız için WhatsApp&apos;tan yazın; bayilik için başvuru formunu doldurun.
              </p>
            </div>
            <div className="mt-8 grid gap-3">
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#25D366] px-6 py-3.5 text-center text-sm font-bold text-white"
                >
                  WhatsApp&apos;tan Yazın
                </a>
              ) : null}
              {apply ? (
                <a
                  href={apply}
                  {...externalProps(apply)}
                  className="rounded-full border border-white/25 px-6 py-3.5 text-center text-sm font-bold text-white hover:border-white/60"
                >
                  Bayi Başvurusu
                </a>
              ) : null}
            </div>
          </div>
          {contact.address && content.sections.map ? (
            <iframe
              title={`${ctx.tenant.company_name} konum`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(contact.address)}&output=embed`}
              className="h-96 w-full rounded-3xl border border-neutral-200"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : null}
        </div>
      </section>
    </KurumsalProShell>
  );
}

/* ───────────── Yasal ───────────── */

export function KurumsalProLegal({ ctx, page }: { ctx: KurumsalPageContext; page: KurumsalLegalPage }) {
  const pages = ctx.content.legal_pages ?? [];
  return (
    <KurumsalProShell ctx={ctx} active="yasal">
      <KurumsalProPageHero ctx={ctx} eyebrow="Yasal" title={page.title} crumbs={[{ label: page.title }]} />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <nav aria-label="Yasal sayfalar" className="h-fit lg:sticky lg:top-28">
            <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              {pages.map((item) => (
                <li key={item.slug} className="shrink-0">
                  <a
                    href={kurumsalPath(ctx.basePath, `/yasal/${item.slug}`)}
                    aria-current={item.slug === page.slug ? "page" : undefined}
                    className={cn(
                      "block rounded-2xl px-4 py-3 text-sm font-semibold transition",
                      item.slug === page.slug ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-white",
                    )}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <article
            className="min-w-0 rounded-3xl border border-neutral-200 bg-white p-6 text-[15px] leading-relaxed text-neutral-700 sm:p-10 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-neutral-900 [&_h3]:mt-6 [&_h3]:font-bold [&_h3]:text-neutral-900 [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_strong]:text-neutral-900 [&_table]:mt-4 [&_table]:w-full [&_td]:border [&_td]:border-neutral-200 [&_td]:p-2 [&_th]:border [&_th]:border-neutral-200 [&_th]:p-2 [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: sanitizeKurumsalLegalHtml(page.html) }}
          />
        </div>
      </section>
    </KurumsalProShell>
  );
}
