import { NextResponse } from "next/server";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { getSessionContext } from "@/lib/auth/session";
import { getStorefrontProductsPage, getStorefrontProductsByIds, getTenantCategories } from "@/lib/data";
import { getHiddenStorefrontCategoryIds } from "@/lib/categories/tree";
import { parseStorefrontProductSort } from "@/lib/storefront/product-sort";
import { getPreviewPriceLists } from "@/lib/storefront/sector-design/preview-data";
import { hasSectorDesign } from "@/lib/storefront/sector-design/config";

export async function GET(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;
  const { tenant } = await getSessionContext();
  if (!hasSectorDesign(tenant!.sector)) return NextResponse.json({ error: "Sektör teması bulunamadı." }, { status: 404 });
  const q = new URL(request.url).searchParams;
  const lists = await getPreviewPriceLists(tenant!.id);
  const list = lists.find(l => l.id === q.get("priceList"));
  if (!list) return NextResponse.json({ error: "Fiyat listesine erişilemiyor." }, { status: 403 });
  const categories = await getTenantCategories(tenant!.id);
  const hidden = getHiddenStorefrontCategoryIds(categories);
  const base = { tenantId: tenant!.id, priceListId: list.id, isCatalogOnly: list.is_catalog_only };
  const productId = q.get("productId");
  if (productId) {
    const rows = await getStorefrontProductsByIds({ ...base, ids: [productId] });
    return NextResponse.json({ products: rows.filter(p => !hidden.includes(p.category_id)) }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const descriptionId = q.get("descriptionId");
  if (descriptionId) {
    const rows = await getStorefrontProductsByIds({ ...base, ids: [descriptionId] });
    const product = rows.find(p => !hidden.includes(p.category_id));
    return NextResponse.json({ description: product?.description ?? null }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const allowed = new Set(categories.filter(c => !hidden.includes(c.id)).map(c => c.id));
  const ids = (key: string) => q.get(key)?.split(",").filter(id => allowed.has(id));
  const result = await getStorefrontProductsPage({ ...base,
    page: Math.max(1, Math.min(100000, Number.parseInt(q.get("page") ?? "1", 10) || 1)),
    search: q.get("q")?.slice(0, 200), categoryIds: ids("categoryIds"), matchCategoryIds: ids("matchCategoryIds"),
    excludeCategoryIds: hidden, discountOnly: q.get("discountOnly") === "1", sort: parseStorefrontProductSort(q.get("sort")),
  });
  return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
}
