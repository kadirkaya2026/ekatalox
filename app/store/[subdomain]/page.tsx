export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PasswordGate } from "@/components/storefront/password-gate";
import { StorefrontClient } from "@/components/storefront/storefront-client";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import {
  getStorefrontProducts,
  getStorefrontSections,
  getStorefrontTenant,
  getTenantCategories,
  getTenantStorefrontSettings,
} from "@/lib/data";
import { storefrontThemes } from "@/lib/storefront/themes";
import { cn } from "@/lib/utils";
import {
  isStorefrontTierStateValid,
  readStorefrontTier,
} from "@/lib/storefront/session";

export async function generateMetadata(
  props: PageProps<"/store/[subdomain]">,
): Promise<Metadata> {
  const { subdomain } = await props.params;
  const tenant = await getStorefrontTenant(subdomain);

  if (!tenant) {
    return {};
  }

  const settings = await getTenantStorefrontSettings(tenant.id);
  const title =
    settings.site_tab_title ?? settings.storefront_title ?? tenant.company_name;

  return {
    title,
    icons: settings.site_favicon_url
      ? { icon: settings.site_favicon_url }
      : undefined,
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

export default async function StorefrontPage(props: PageProps<"/store/[subdomain]">) {
  const { subdomain } = await props.params;
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
      <PasswordGate
        subdomain={subdomain}
        companyName={tenant.company_name}
        whatsappNumber={tenant.whatsapp_number}
      />
    );
  }

  const [products, categories, storefrontSettings, sections] = await Promise.all([
    getStorefrontProducts({
      tenantId: tenant.id,
      tierLevel: tierState.tierLevel,
    }),
    getTenantCategories(tenant.id),
    getTenantStorefrontSettings(tenant.id),
    getStorefrontSections(tenant.id, tierState.tierLevel),
  ]);
  const theme =
    storefrontThemes[storefrontSettings.theme_key] ?? storefrontThemes.minimal;
  const footerVisible = storefrontSettings.is_footer_visible;

  return (
    <div className={cn(theme.page, footerVisible && "pb-0")}>
      <div className={footerVisible ? "pb-28 xl:pb-6" : undefined}>
        <StorefrontClient
          tenant={tenant}
          categories={categories}
          products={products}
          storefrontSettings={storefrontSettings}
          sections={sections}
          subdomain={subdomain}
        />
      </div>
      {footerVisible ? (
        <StorefrontFooter settings={storefrontSettings} />
      ) : null}
    </div>
  );
}