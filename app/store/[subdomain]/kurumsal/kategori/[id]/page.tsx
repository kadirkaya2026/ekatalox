// Kurumsal site kategori sayfası (/kategori/[id]; platform adresinde /kurumsal/kategori/[id]): bir KÖK
// kategorinin (alt kategorileri dahil) ürünleri, fiyatsız. Herkese açık ve
// Google'a açık; gizli kategori / "Kategorisiz" kovası 404. ISR: tüm
// okumalar unstable_cache içinde (storefront_{tenantId} tag'i).
export const revalidate = 300;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KurumsalBreadcrumb, KurumsalProductCard, KurumsalShell } from "@/components/kurumsal/kurumsal-shell";
import { kurumsalPath } from "@/lib/kurumsal/domain";
import { titleCaseTr, whatsappLink } from "@/lib/kurumsal/format";
import { getKurumsalPageContext } from "@/lib/kurumsal/page-context";
import { getKurumsalCategoryCached } from "@/lib/storefront/kurumsal-data";
import { buildStorefrontIcons } from "@/lib/storefront/white-label";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata(
  props: PageProps<"/store/[subdomain]/kurumsal/kategori/[id]">,
): Promise<Metadata> {
  const { subdomain, id } = await props.params;
  const ctx = await getKurumsalPageContext(subdomain);
  if (!ctx) return {};
  const page = await getKurumsalCategoryCached(ctx.tenant.id, id);
  if (!page) return {};

  const name = titleCaseTr(page.category.name);
  const description = `${ctx.tenant.company_name} ${name} ürünleri: ${page.total} ürün. Fiyatlar bayilerimize özeldir.`;
  const image = page.products.find((product) => product.imageUrl)?.imageUrl;

  return {
    title: { absolute: `${name} | ${ctx.tenant.company_name}` },
    description,
    icons: buildStorefrontIcons(ctx.settings.site_favicon_url, ctx.tenant),
    alternates: { canonical: `${ctx.kurumsalOrigin}/kategori/${page.category.id}` },
    openGraph: {
      url: `${ctx.kurumsalOrigin}/kategori/${page.category.id}`,
      title: `${name} | ${ctx.tenant.company_name}`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function KurumsalCategoryPage(
  props: PageProps<"/store/[subdomain]/kurumsal/kategori/[id]">,
) {
  const { subdomain, id } = await props.params;
  const ctx = await getKurumsalPageContext(subdomain);
  if (!ctx) notFound();
  const page = await getKurumsalCategoryCached(ctx.tenant.id, id);
  if (!page) notFound();

  const name = titleCaseTr(page.category.name);
  const { content } = ctx;
  const applyHref = content.sections.form
    ? kurumsalPath(ctx.basePath, "#basvuru")
    : whatsappLink(ctx.contact.whatsapp, `Merhaba, ${ctx.tenant.company_name} bayisi olmak istiyorum.`);

  return (
    <KurumsalShell
      tenantName={ctx.tenant.company_name}
      logoUrl={ctx.settings.logo_url}
      wordmark={ctx.wordmark}
      accent={ctx.accent}
      legalName={content.legal_name}
      isWhiteLabel={ctx.isWhiteLabel}
      applyHref={applyHref}
      catalogUrl={ctx.catalogUrl}
      basePath={ctx.basePath}
      isHome={false}
      showAbout={content.about.length > 0}
    >
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <KurumsalBreadcrumb items={[{ label: "Ana sayfa", href: kurumsalPath(ctx.basePath, "/") }, { label: name }]} />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{name}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {page.total} ürün · Fiyatlar yalnızca bayilerimize açıktır.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        {page.products.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {page.products.map((product) => (
              <KurumsalProductCard key={product.id} product={product} basePath={ctx.basePath} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
            Bu kategoride şu an listelenen ürün yok.
          </p>
        )}

        {page.total > page.products.length ? (
          <p className="mt-8 text-center text-sm text-slate-600">
            Bu kategorideki {page.total} ürünün tamamı bayi portalında.{" "}
            <a href={ctx.catalogUrl} className="font-semibold underline underline-offset-4" style={{ color: "var(--k-accent)" }}>
              Tüm kataloğu gör
            </a>
          </p>
        ) : null}

        <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-xl font-extrabold">Fiyatları görmek ister misiniz?</h2>
            <p className="mt-1 text-sm text-slate-300">
              Güncel fiyat listemiz bayilerimize özeldir. Bayiyseniz giriş yapın, değilseniz başvurun.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={ctx.catalogUrl} className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10">
              Bayi Girişi
            </a>
            {applyHref ? (
              <a
                href={applyHref}
                {...(/^https?:/.test(applyHref) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="rounded-full px-5 py-2.5 text-sm font-bold text-white"
                style={{ backgroundColor: "var(--k-accent)" }}
              >
                Bayimiz Olun
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </KurumsalShell>
  );
}
