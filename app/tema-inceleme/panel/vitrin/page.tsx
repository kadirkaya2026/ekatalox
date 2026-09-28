import { notFound } from "next/navigation";
import { InlineThemeStudio } from "@/components/dashboard/sector-design/inline-studio";
import { isDesignId, designSector } from "@/lib/storefront/sector-design/config";
import { SectorPreviewFrame } from "@/components/dashboard/sector-design/preview-frame";
import { tenant, categories, settings, lists, fixtureProducts } from "../fixture";
export const metadata = { robots: { index: false, follow: false } };
export default async function Page({searchParams}: {searchParams: Promise<{priceList?: string; edit?: string; theme?: string}>}) {
 if (process.env.NODE_ENV !== "development") notFound();
 const q=await searchParams; const list=lists.find(l=>l.id===q.priceList)??lists[0]; const products=fixtureProducts(list.id);
 const Component = q.edit === "1" ? InlineThemeStudio : SectorPreviewFrame;
 const initialTheme = isDesignId(q.theme) && designSector(q.theme) === tenant.sector ? q.theme : undefined;
 return <Component initialTheme={initialTheme} tenant={tenant} settings={settings} categories={categories} products={products} total={products.length} priceListId={list.id} isCatalogOnly={list.is_catalog_only} fixture />;
}
