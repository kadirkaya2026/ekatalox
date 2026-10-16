import { NextResponse } from "next/server";
import { getStorefrontFacetIndex, getStorefrontTenant, getTenantCategories } from "@/lib/data";
import { getHiddenStorefrontCategoryIds } from "@/lib/categories/tree";
import { isTrialExpired } from "@/lib/billing/trial";
import {
  isStorefrontPriceListStateValid,
  readStorefrontPriceList,
} from "@/lib/storefront/session";

// Vitrin filtresi (16 Eki 2026): kategori/arama kapsamındaki ürünlerin
// marka, fiyat, alt kategori ve varyant özelliği (Beden, Renk…) dizini;
// sayılar istemcide bu dizinden anında hesaplanır (bkz. refine.ts). Ürün
// listesiyle aynı erişim kuralı (fiyat listesi çerezi); fiyatlar
// ziyaretçinin fiyat listesine göre.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const subdomain = url.searchParams.get("subdomain");

  if (!subdomain) {
    return NextResponse.json({ error: "subdomain zorunludur." }, { status: 400 });
  }

  const tenant = await getStorefrontTenant(subdomain);

  if (!tenant || tenant.status !== "active" || isTrialExpired(tenant)) {
    return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 404 });
  }

  const priceListState = await readStorefrontPriceList(subdomain);

  if (!priceListState || !isStorefrontPriceListStateValid({ cookieState: priceListState, tenant })) {
    return NextResponse.json({ error: "Bu mağazaya erişim için giriş yapmalısınız." }, { status: 401 });
  }

  const categories = await getTenantCategories(tenant.id);
  const index = await getStorefrontFacetIndex({
    tenantId: tenant.id,
    priceListId: priceListState.priceListId,
    isCatalogOnly: priceListState.isCatalogOnly,
    search: url.searchParams.get("q") ?? undefined,
    categoryIds: url.searchParams.get("categoryIds")?.split(",").filter(Boolean),
    matchCategoryIds: url.searchParams.get("matchCategoryIds")?.split(",").filter(Boolean),
    excludeCategoryIds: getHiddenStorefrontCategoryIds(categories),
    discountOnly: url.searchParams.get("discountOnly") === "1",
  });

  return NextResponse.json(index);
}
