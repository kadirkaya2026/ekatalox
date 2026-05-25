export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound } from "next/navigation";
import { PasswordGate } from "@/components/storefront/password-gate";
import { StorefrontClient } from "@/components/storefront/storefront-client";
import {
  getStorefrontProducts,
  getStorefrontTenant,
  getTenantCategories,
} from "@/lib/data";
import { readStorefrontTier } from "@/lib/storefront/session";

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

  const tierLevel = await readStorefrontTier(subdomain);

  if (!tierLevel) {
    return <PasswordGate subdomain={subdomain} companyName={tenant.company_name} />;
  }

  const [products, categories] = await Promise.all([
    getStorefrontProducts({
      tenantId: tenant.id,
      tierLevel,
    }),
    getTenantCategories(tenant.id),
  ]);

  return (
    <StorefrontClient
      tenant={tenant}
      categories={categories}
      products={products}
    />
  );
}