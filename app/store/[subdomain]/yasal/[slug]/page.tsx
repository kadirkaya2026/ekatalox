// Mağazanın yasal sayfaları (0178, 17 Eki 2026): satıcı bilgileri, ön
// bilgilendirme, mesafeli satış, iptal/iade, KVKK. Şifre kapısından bağımsız
// açılır (bkz. proxy.ts) — ödeme kuruluşu ve müşteri sipariş öncesi görebilmeli.
// Yasal bilgiler eksiksiz değilse sayfa yoktur.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStorefrontTenantCached, getTenantStorefrontSettings } from "@/lib/data";
import { appEnv } from "@/lib/env";
import {
  LEGAL_DOC_SLUGS,
  LEGAL_DOC_TITLES,
  buildLegalDocument,
  isLegalDocSlug,
  isLegalProfileComplete,
  readLegalProfile,
} from "@/lib/legal/tenant-legal";
import { buildStorefrontIcons, buildStorefrontTitle } from "@/lib/storefront/white-label";

type LegalPageProps = { params: Promise<{ subdomain: string; slug: string }> };

async function load(props: LegalPageProps) {
  const { subdomain, slug } = await props.params;
  if (!isLegalDocSlug(slug)) return null;
  const tenant = await getStorefrontTenantCached(subdomain);
  if (!tenant || tenant.status !== "active") return null;
  const settings = await getTenantStorefrontSettings(tenant.id);
  const profile = readLegalProfile(settings.legal_profile);
  if (!isLegalProfileComplete(profile)) return null;
  const storeName = settings.storefront_title?.trim() || tenant.company_name;
  const storeUrl = tenant.custom_domain?.trim()
    ? `https://${tenant.custom_domain.trim()}`
    : `https://${tenant.subdomain}.${appEnv.rootDomain}`;
  return { tenant, settings, storeName, doc: buildLegalDocument(slug, profile, storeName, storeUrl) };
}

export async function generateMetadata(props: LegalPageProps): Promise<Metadata> {
  const data = await load(props);
  if (!data) return {};
  return {
    title: buildStorefrontTitle(data.doc.title, data.tenant),
    icons: buildStorefrontIcons(data.settings.site_favicon_url, data.tenant),
    robots: { index: false, follow: false },
  };
}

export default async function LegalPage(props: LegalPageProps) {
  const data = await load(props);
  if (!data) notFound();
  const { doc, storeName, settings } = data;

  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-8 text-slate-900 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo_url} alt={storeName} className="h-9 w-auto max-w-[160px] object-contain" />
            ) : (
              <span className="truncate text-lg font-bold">{storeName}</span>
            )}
          </Link>
          <Link href="/" className="shrink-0 text-sm font-semibold text-slate-600 underline underline-offset-4">
            Mağazaya dön
          </Link>
        </header>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{doc.title}</h1>
          <div className="mt-6 space-y-6 text-[15px] leading-7 text-slate-700">
            {doc.sections.map((section, index) => (
              <section key={index} className="space-y-2">
                {section.heading ? <h2 className="text-base font-semibold text-slate-900">{section.heading}</h2> : null}
                {section.paragraphs.map((paragraph, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>

        <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600" aria-label="Yasal sayfalar">
          {LEGAL_DOC_SLUGS.filter((slug) => slug !== doc.slug).map((slug) => (
            <Link key={slug} href={`/yasal/${slug}`} className="underline underline-offset-4 hover:text-slate-900">
              {LEGAL_DOC_TITLES[slug]}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
