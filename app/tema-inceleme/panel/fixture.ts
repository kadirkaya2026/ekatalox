import { demoTenants, demoProducts, demoCategories, demoPriceLists } from "@/lib/demo-data";
import { getDefaultTenantStorefrontSettings } from "@/lib/data";
import { toStorefrontProduct } from "@/lib/storefront/pricing";
export const tenant = { ...demoTenants[0], sector: "telefon-aksesuar", company_name: "Örnek Mağaza", whatsapp_number: "" };
export const categories = demoCategories.filter(c => c.tenant_id === tenant.id);
export const lists = demoPriceLists.filter(p => p.tenant_id === tenant.id);
export const settings = getDefaultTenantStorefrontSettings(tenant.id);
export function fixtureProducts(id: string) { const list = lists.find(l => l.id === id) ?? lists[0]; return demoProducts.filter(p => p.tenant_id === tenant.id).map(p => toStorefrontProduct(p, list.id, list.is_catalog_only)); }
