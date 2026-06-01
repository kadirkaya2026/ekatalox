export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PasswordGate } from "@/components/storefront/password-gate";
import { StorefrontClient } from "@/components/storefront/storefront-client";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import {
  getStorefrontSections,
  getStorefrontTenant,
  getTenantCategories,
  getTenantStorefrontSettings,
} from "@/lib/data";
import { getStorefrontHomePath } from "@/lib/storefront/paths";
import { storefrontThemes } from "@/lib/storefront/themes";
import {
  getRequestHostFromHeaders,
  isTenantCustomDomainHost,
} from "@/lib/tenancy/request-host";
import { cn } from "@/lib/utils";
import {
  isStorefrontTierStateValid,
  readStorefrontTier,
} from "@/lib/storefront/session";

export async function generateMetadata(props: {
  params: Promise<{ subdomain: string; sectionId: string }>;
}): Promise<Metadata> {
  return {
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default async function SectionDetailPage(props: {
  params: Promise<{ subdomain: string; sectionId: string }>;
}) {
  const { subdomain, sectionId } = await props.params;
  const tenant = await getStorefrontTenant(subdomain);

  if (!tenant) {
    notFound();
  }

  if (tenant.status === "suspended") {
    return (
      <div className="container-shell flex min-h-screen items-center justify-center py-8">
        <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Bu mağaza geçici olarak kapalı
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Tenant askıya alındığı için katalog şu an görüntülenemiyor.
          </p>
        </div>
      </div>
    );
  }

  const tierState = await readStorefrontTier(subdomain);

  if (!tierState || !isStorefrontTierStateValid({ cookieState: tierState, tenant })) {
    return (
      <PasswordGate subdomain={subdomain} companyName={tenant.company_name} />
    );
  }

  const [sections, categories, storefrontSettings] = await Promise.all([
    getStorefrontSections(tenant.id, tierState.tierLevel),
    getTenantCategories(tenant.id),
    getTenantStorefrontSettings(tenant.id),
  ]);

  const section = sections.find((s) => s.id === sectionId);

  if (!section) {
    notFound();
  }

  const theme = storefrontThemes[storefrontSettings.theme_key] ?? storefrontThemes.minimal;
  const footerVisible = storefrontSettings.is_footer_visible;
  const headersList = await headers();
  const requestHost = getRequestHostFromHeaders(headersList);
  const copyrightTenantName = isTenantCustomDomainHost(requestHost, tenant)
    ? tenant.company_name
    : null;

  return (
    <div className={cn(theme.page, footerVisible && "pb-0")}>
      <div className="container-shell py-4">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <a
            href={getStorefrontHomePath()}
            className="font-medium transition hover:text-slate-900"
          >
            Anasayfa
          </a>
          <span>/</span>
          <span className="font-semibold text-slate-900">{section.title}</span>
        </nav>
      </div>

      <StorefrontClient
        tenant={tenant}
        categories={categories}
        products={section.products}
        storefrontSettings={storefrontSettings}
        sections={[]}
        subdomain={subdomain}
        pageTitle={section.title}
        homeHref={getStorefrontHomePath()}
        hasPageFooter={footerVisible}
      />
      {footerVisible ? (
        <StorefrontFooter
          settings={storefrontSettings}
          copyrightTenantName={copyrightTenantName}
        />
      ) : null}
    </div>
  );
}
