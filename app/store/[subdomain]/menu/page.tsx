// "Menünü Oluştur" (0155): N çeşit + kişi sayısı + tarih → fiyat teklifi isteği.
// Yalnız retail_config.menu_builder açık mağazalarda; değilse 404.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenuBuilderView } from "@/components/storefront/menu-builder-view";
import { getStorefrontTenantCached, getTenantCategories, getTenantProducts, getTenantStorefrontSettings } from "@/lib/data";
import { resolveDeliveryArea } from "@/lib/storefront/delivery-area";
import { istanbulDatePlus, resolveRetailConfig } from "@/lib/storefront/retail-config";
import { buildStorefrontIcons, buildStorefrontTitle } from "@/lib/storefront/white-label";

type MenuPageProps = { params: Promise<{ subdomain: string }> };

export async function generateMetadata(props: MenuPageProps): Promise<Metadata> {
  const { subdomain } = await props.params;
  const tenant = await getStorefrontTenantCached(subdomain);
  if (!tenant) return {};
  const settings = await getTenantStorefrontSettings(tenant.id);
  const builder = resolveRetailConfig(settings.retail_config).menuBuilder;
  return {
    title: buildStorefrontTitle(builder?.title ?? "Menünüzü Oluşturun", tenant),
    icons: buildStorefrontIcons(settings.site_favicon_url, tenant),
  };
}

export default async function MenuPage(props: MenuPageProps) {
  const { subdomain } = await props.params;
  const tenant = await getStorefrontTenantCached(subdomain);
  if (!tenant || tenant.status !== "active") notFound();
  const settings = await getTenantStorefrontSettings(tenant.id);
  const builder = resolveRetailConfig(settings.retail_config).menuBuilder;
  if (!builder) notFound();

  const [products, categories] = await Promise.all([getTenantProducts(tenant.id), getTenantCategories(tenant.id)]);
  const categoryOrder = new Map(categories.map((category, index) => [category.id, index]));
  const groups = categories
    .filter((category) => !builder.excludeCategoryIds.includes(category.id))
    .sort((a, b) => (categoryOrder.get(a.id) ?? 0) - (categoryOrder.get(b.id) ?? 0))
    .map((category) => ({
      id: category.id,
      name: category.name,
      products: products
        .filter((product) => product.category_id === category.id && product.is_in_stock && !product.is_over_limit)
        .map((product) => ({ id: product.id, name: product.product_name, imageUrl: product.image_url })),
    }))
    .filter((group) => group.products.length);

  return (
    <MenuBuilderView
      subdomain={subdomain}
      tenantName={settings.storefront_title?.trim() || tenant.company_name}
      logoUrl={settings.logo_url ?? null}
      brandColor={settings.brand_primary_color ?? "#be4b6e"}
      builder={builder}
      groups={groups}
      minDate={istanbulDatePlus(builder.leadDays)}
      districts={resolveDeliveryArea(settings.delivery_area)?.neighborhoods ?? []}
    />
  );
}
