export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound } from "next/navigation";
import { PasswordGate } from "@/components/storefront/password-gate";
import { StorefrontClient } from "@/components/storefront/storefront-client";
import {
  getStorefrontProducts,
  getStorefrontTenant,
  getTenantCategories,
  getTenantStorefrontSettings,
} from "@/lib/data";
import { storefrontThemes } from "@/lib/storefront/themes";
import {
  isStorefrontTierStateValid,
  readStorefrontTier,
} from "@/lib/storefront/session";

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
    return <PasswordGate subdomain={subdomain} companyName={tenant.company_name} />;
  }

  const [products, categories, storefrontSettings] = await Promise.all([
    getStorefrontProducts({
      tenantId: tenant.id,
      tierLevel: tierState.tierLevel,
    }),
    getTenantCategories(tenant.id),
    getTenantStorefrontSettings(tenant.id),
  ]);
  const theme =
    storefrontThemes[storefrontSettings.theme_key] ?? storefrontThemes.minimal;

  return (
    <div className={theme.page}>
      <StorefrontClient
        tenant={tenant}
        categories={categories}
        products={products}
        storefrontSettings={storefrontSettings}
      />
    </div>
  );
}