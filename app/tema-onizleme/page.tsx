import { notFound } from "next/navigation";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getStorefrontCampaigns, getStorefrontSections, getStorefrontPromoProducts, getStorefrontPromoProductCount, getStorefrontRecommendationPool, getStorefrontBestSellerProducts, getStorefrontCategoryRepresentativeImages, getTenantCategories, getTenantStorefrontSettings, getStorefrontProductsPage } from "@/lib/data";
import { getHiddenStorefrontCategoryIds } from "@/lib/categories/tree";
import { hasSectorDesign } from "@/lib/storefront/sector-design/config";
import { getPreviewPriceLists } from "@/lib/storefront/sector-design/preview-data";
import { InlineThemeStudio } from "@/components/dashboard/sector-design/inline-studio";
import { isDesignId, designSector } from "@/lib/storefront/sector-design/config";
import { SectorPreviewFrame } from "@/components/dashboard/sector-design/preview-frame";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tema önizlemesi", robots: { index: false, follow: false } };
export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ priceList?: string; edit?: string; theme?: string }> }) {
  const { tenant } = await requireTenantAdminPage();
  if (!tenant || !hasSectorDesign(tenant.sector)) notFound();
  const [settings, categories, lists, query] = await Promise.all([getTenantStorefrontSettings(tenant.id), getTenantCategories(tenant.id), getPreviewPriceLists(tenant.id), searchParams]);
  const list = query.priceList ? lists.find(l => l.id === query.priceList) : lists.find(l => !l.is_catalog_only) ?? lists[0];
  if (query.priceList && !list) notFound();
  const hidden = getHiddenStorefrontCategoryIds(categories);
  const page = list ? await getStorefrontProductsPage({ tenantId: tenant.id, priceListId: list.id, isCatalogOnly: list.is_catalog_only, page: 1, excludeCategoryIds: hidden }) : { products: [], total: 0 };
  const pricing={tenantId:tenant.id,priceListId:list?.id??"",isCatalogOnly:list?.is_catalog_only??true,excludeCategoryIds:hidden};
  const [campaigns,sections,promoProducts,promoProductCount,recommendationPool,bestSellerProducts,categoryRepresentativeImages]=await Promise.all([getStorefrontCampaigns(tenant.id),getStorefrontSections(tenant.id,pricing.priceListId,pricing.isCatalogOnly),getStorefrontPromoProducts(pricing),getStorefrontPromoProductCount(pricing),getStorefrontRecommendationPool(pricing),getStorefrontBestSellerProducts({...pricing,limit:24}),getStorefrontCategoryRepresentativeImages(tenant.id,categories)]);
  const extras={campaigns,sections:sections.map(s=>({...s,products:s.products.filter(p=>!p.category_id||!hidden.includes(p.category_id))})),promoProducts,promoProductCount,recommendationPool,bestSellerProducts,categoryRepresentativeImages};
  const Component = query.edit === "1" ? InlineThemeStudio : SectorPreviewFrame;
  const initialTheme = isDesignId(query.theme) && designSector(query.theme) === tenant.sector ? query.theme : undefined;
  return <Component extras={extras} initialTheme={initialTheme} tenant={tenant} settings={settings} categories={categories.filter(c => !hidden.includes(c.id))} products={page.products} total={page.total} priceListId={list?.id ?? ""} isCatalogOnly={list?.is_catalog_only ?? true} />;
}
