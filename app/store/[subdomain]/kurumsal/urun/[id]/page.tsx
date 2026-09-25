// Kurumsal site ürün sayfası (/urun/[id]; platform adresinde /kurumsal/urun/[id]): tek ürünün görselleri,
// kodu, açıklaması ve stok durumu — FİYATSIZ. Herkese açık ve Google'a açık
// (JSON-LD Product, fiyat/offer içermez). Gizli kategorideki ya da başka
// bayinin ürünü 404. ISR: okumalar unstable_cache içinde.
export const revalidate = 300;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KurumsalBreadcrumb, KurumsalShell } from "@/components/kurumsal/kurumsal-shell";
import { kurumsalPath } from "@/lib/kurumsal/domain";
import { titleCaseTr, whatsappLink } from "@/lib/kurumsal/format";
import { getKurumsalPageContext } from "@/lib/kurumsal/page-context";
import {
  getDescriptionPlainText,
  isHtmlDescription,
  sanitizeProductDescription,
} from "@/lib/products/description-html";
import { getKurumsalProductCached } from "@/lib/storefront/kurumsal-data";
import { buildStorefrontIcons } from "@/lib/storefront/white-label";

export function generateStaticParams() {
  return [];
}

function plainDescription(description: string | null) {
  if (!description) return "";
  return isHtmlDescription(description) ? getDescriptionPlainText(description) : description.trim();
}

export async function generateMetadata(
  props: PageProps<"/store/[subdomain]/kurumsal/urun/[id]">,
): Promise<Metadata> {
  const { subdomain, id } = await props.params;
  const ctx = await getKurumsalPageContext(subdomain);
  if (!ctx) return {};
  const product = await getKurumsalProductCached(ctx.tenant.id, id);
  if (!product) return {};

  const text = plainDescription(product.description);
  const description = (text || `${product.name} (${product.sku}) — ${ctx.tenant.company_name}`).slice(0, 160);

  return {
    title: { absolute: `${product.name} | ${ctx.tenant.company_name}` },
    description,
    icons: buildStorefrontIcons(ctx.settings.site_favicon_url, ctx.tenant),
    alternates: { canonical: `${ctx.kurumsalOrigin}/urun/${product.id}` },
    openGraph: {
      url: `${ctx.kurumsalOrigin}/urun/${product.id}`,
      title: product.name,
      description,
      images: product.images.length ? [product.images[0]] : undefined,
    },
  };
}

const DESCRIPTION_CLASSES = [
  "text-sm leading-7 text-slate-700",
  "[&_h2]:mb-1 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-900",
  "[&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-slate-900",
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5",
  "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3",
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_th]:border-b [&_th]:border-slate-200 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left",
  "[&_td]:border-b [&_td]:border-slate-100 [&_td]:px-2 [&_td]:py-1.5",
].join(" ");

// Vitrindeki ProductDescriptionContent ile aynı kural: HTML ise
// sanitizeProductDescription (izinli etiket listesi, öznitelik yok), düz
// metinse satır sonları korunarak yazılır.
function ProductDescription({ description }: { description: string | null }) {
  const normalized = description?.trim() ?? "";
  if (!normalized) return null;

  if (isHtmlDescription(normalized)) {
    const sanitized = sanitizeProductDescription(normalized);
    if (!sanitized) return null;
    return <div className={DESCRIPTION_CLASSES} dangerouslySetInnerHTML={{ __html: sanitized }} />;
  }

  return <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{normalized}</p>;
}

export default async function KurumsalProductPage(props: PageProps<"/store/[subdomain]/kurumsal/urun/[id]">) {
  const { subdomain, id } = await props.params;
  const ctx = await getKurumsalPageContext(subdomain);
  if (!ctx) notFound();
  const product = await getKurumsalProductCached(ctx.tenant.id, id);
  if (!product) notFound();

  const { content, tenant } = ctx;
  const applyHref = content.sections.form
    ? kurumsalPath(ctx.basePath, "#basvuru")
    : whatsappLink(ctx.contact.whatsapp, `Merhaba, ${tenant.company_name} bayisi olmak istiyorum.`);
  const askWa = whatsappLink(
    ctx.contact.whatsapp,
    `Merhaba, ${product.name} (${product.sku}) hakkında bilgi almak istiyorum.`,
  );
  const [mainImage, ...otherImages] = product.images;
  const categoryName = product.category ? titleCaseTr(product.category.name) : null;
  const text = plainDescription(product.description);

  // Fiyat/offer bilinçli olarak yok: fiyatlar bayilere özel.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    ...(product.images.length ? { image: product.images } : {}),
    ...(text ? { description: text.slice(0, 5000) } : {}),
    ...(categoryName ? { category: categoryName } : {}),
    brand: { "@type": "Brand", name: tenant.company_name },
    url: `${ctx.kurumsalOrigin}/urun/${product.id}`,
  };

  return (
    <KurumsalShell
      tenantName={tenant.company_name}
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <KurumsalBreadcrumb
          items={[
            { label: "Ana sayfa", href: kurumsalPath(ctx.basePath, "/") },
            ...(product.category && categoryName
              ? [{ label: categoryName, href: kurumsalPath(ctx.basePath, `/kategori/${product.category.id}`) }]
              : []),
            { label: product.name },
          ]}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Görseller */}
          <div>
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white p-6">
              {mainImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mainImage} alt={product.name} className="h-full w-full object-contain" />
              ) : (
                <span className="text-sm font-semibold text-slate-400">Görsel yok</span>
              )}
            </div>
            {otherImages.length ? (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {product.images.map((url, index) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 hover:border-slate-400"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`${product.name} görsel ${index + 1}`} loading="lazy" className="h-full w-full object-contain" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {/* Bilgiler */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--k-accent)" }}>
              {categoryName ?? tenant.company_name}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="font-semibold text-slate-500">Ürün kodu</dt>
                <dd className="mt-0.5 font-bold">{product.sku}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Stok durumu</dt>
                <dd className={product.isInStock ? "mt-0.5 font-bold text-emerald-700" : "mt-0.5 font-bold text-rose-700"}>
                  {product.isInStock ? "Stokta" : "Stokta yok"}
                </dd>
              </div>
              {product.packageQuantity ? (
                <div>
                  <dt className="font-semibold text-slate-500">Paket içi</dt>
                  <dd className="mt-0.5 font-bold">{product.packageQuantity} adet</dd>
                </div>
              ) : null}
              {product.cartonQuantity ? (
                <div>
                  <dt className="font-semibold text-slate-500">Koli içi</dt>
                  <dd className="mt-0.5 font-bold">{product.cartonQuantity} adet</dd>
                </div>
              ) : null}
            </dl>

            {product.models.length ? (
              <div className="mt-5">
                <p className="text-sm font-semibold text-slate-500">Modeller</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.models.map((model) => (
                    <span key={model} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-800">Fiyatlar yalnızca bayilerimize açıktır.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={ctx.catalogUrl}
                  className="rounded-full px-6 py-3 text-center text-sm font-bold text-white shadow-lg"
                  style={{ backgroundColor: "var(--k-accent)" }}
                >
                  Fiyat için Bayi Girişi
                </a>
                {applyHref ? (
                  <a
                    href={applyHref}
                    {...(/^https?:/.test(applyHref) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="rounded-full border border-slate-300 bg-white px-6 py-3 text-center text-sm font-bold text-slate-800 hover:border-slate-400"
                  >
                    Bu ürün için bayi başvurusu
                  </a>
                ) : null}
              </div>
              {askWa ? (
                <a
                  href={askWa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  WhatsApp&apos;tan bu ürünü sorun →
                </a>
              ) : null}
            </div>

            {product.description ? (
              <div className="mt-8">
                <h2 className="text-lg font-bold">Ürün açıklaması</h2>
                <div className="mt-3">
                  <ProductDescription description={product.description} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </KurumsalShell>
  );
}
