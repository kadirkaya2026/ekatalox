import type { KurumsalPageContext } from "@/lib/kurumsal/page-context";
import type { KurumsalData } from "@/lib/storefront/kurumsal-data";

// Kurumsal site: yapay zekâ ve arama motorlarında görünürlük (27 Eyl 2026).
// Kurumsal (üst) pakette her kurumsal siteye otomatik:
//  - ana sayfada schema.org işletme kartı (WholesaleStore + WebSite),
//  - /llms.txt (alan adı modunda) ya da /kurumsal/llms.txt (platform
//    adresinde): firmayı, ürün gruplarını ve iletişimi yapay zekâ
//    botlarına özetleyen düz metin (bkz. llmstxt.org).
// Fiyat bilgisi bilerek yok: fiyatlar bayilere özel.

function clean(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function buildKurumsalJsonLd(ctx: KurumsalPageContext, data: KurumsalData) {
  const { tenant, settings, content, contact } = ctx;
  const description = clean(content.tagline) || clean(content.about.join(" ")).slice(0, 300) || undefined;
  const business: Record<string, unknown> = {
    "@type": "WholesaleStore",
    "@id": `${ctx.homeUrl}#business`,
    name: tenant.company_name,
    ...(content.legal_name ? { legalName: content.legal_name } : {}),
    url: ctx.homeUrl,
    ...(settings.logo_url ? { logo: settings.logo_url, image: settings.logo_url } : {}),
    ...(description ? { description } : {}),
    ...(contact.phone || content.phone ? { telephone: contact.phone || content.phone } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    ...(content.founded_year ? { foundingDate: String(content.founded_year) } : {}),
    ...(contact.address || content.city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(contact.address ? { streetAddress: contact.address } : {}),
            ...(content.city ? { addressLocality: content.city } : {}),
            addressCountry: "TR",
          },
        }
      : {}),
    ...(content.city ? { areaServed: { "@type": "Country", name: "Türkiye" } } : {}),
    ...(data.categories.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: `${tenant.company_name} ürün grupları`,
            itemListElement: data.categories.map((category) => ({
              "@type": "OfferCatalog",
              name: category.name,
              url: `${ctx.kurumsalOrigin}${ctx.basePath}/kategori/${category.id}`,
            })),
          },
        }
      : {}),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      business,
      {
        "@type": "WebSite",
        "@id": `${ctx.homeUrl}#website`,
        name: tenant.company_name,
        url: ctx.homeUrl,
        inLanguage: "tr",
        publisher: { "@id": `${ctx.homeUrl}#business` },
      },
    ],
  };
}

export function buildKurumsalLlmsTxt(ctx: KurumsalPageContext, data: KurumsalData) {
  const { tenant, content, contact } = ctx;
  const base = `${ctx.kurumsalOrigin}${ctx.basePath}`;
  const lines: string[] = [];
  lines.push(`# ${tenant.company_name}`);
  lines.push("");
  const summary = clean(content.tagline) || clean(content.headline);
  if (summary) lines.push(`> ${summary}`, "");

  const facts: string[] = [];
  if (content.legal_name) facts.push(`Unvan: ${content.legal_name}`);
  if (content.city) facts.push(`Şehir: ${content.city}`);
  if (content.founded_year) facts.push(`Kuruluş yılı: ${content.founded_year}`);
  if (content.customer_type) facts.push(`Müşteri tipi: ${content.customer_type}`);
  if (data.productCount) facts.push(`Katalogdaki ürün sayısı: ${data.productCount}`);
  if (facts.length) lines.push(...facts.map((fact) => `- ${fact}`), "");

  const about = content.about.map(clean).filter(Boolean);
  if (about.length) lines.push("## Hakkımızda", "", about.join("\n\n"), "");

  if (content.highlights.length) {
    lines.push("## Neden biz", "");
    for (const item of content.highlights) lines.push(`- ${clean(item.title)}: ${clean(item.body)}`);
    lines.push("");
  }

  if (data.categories.length) {
    lines.push("## Ürün grupları", "");
    for (const category of data.categories) {
      lines.push(`- [${category.name}](${base}/kategori/${category.id}): ${category.productCount} ürün`);
    }
    lines.push("");
  }

  if (data.featured.length) {
    lines.push("## Öne çıkan ürünler", "");
    for (const product of data.featured) {
      lines.push(`- [${product.name}](${base}/urun/${product.id})${product.sku ? ` (model: ${product.sku})` : ""}`);
    }
    lines.push("");
  }

  lines.push("## Bayilik ve sipariş", "");
  lines.push(
    `- ${tenant.company_name} toptan satış yapar; fiyatlar yalnız bayilere özel şifreli katalogda görünür.`,
    `- Bayi başvurusu: ${base}#basvuru`,
    `- Bayi girişi (şifreli katalog): ${ctx.catalogUrl}`,
    "",
  );

  const contactLines: string[] = [];
  if (contact.phone || content.phone) contactLines.push(`- Telefon: ${contact.phone || content.phone}`);
  if (contact.whatsapp) contactLines.push(`- WhatsApp: ${contact.whatsapp}`);
  if (contact.email) contactLines.push(`- E-posta: ${contact.email}`);
  if (contact.address) contactLines.push(`- Adres: ${clean(contact.address)}`);
  if (contactLines.length) lines.push("## İletişim", "", ...contactLines, "");

  lines.push("## Sayfalar", "", `- [Ana sayfa](${ctx.homeUrl})`, `- [Site haritası](${base}/sitemap.xml)`, "");
  return lines.join("\n");
}
