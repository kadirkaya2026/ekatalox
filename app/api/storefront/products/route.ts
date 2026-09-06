import { NextResponse } from "next/server";
import { getStorefrontProductsPage, getStorefrontTenant, getTenantCategories } from "@/lib/data";
import { getHiddenStorefrontCategoryIds } from "@/lib/categories/tree";
import { parseStorefrontProductSort } from "@/lib/storefront/product-sort";
import { isTrialExpired } from "@/lib/billing/trial";
import {
  isStorefrontPriceListStateValid,
  readStorefrontPriceList,
} from "@/lib/storefront/session";

// Vitrin sayfası (app/store/[subdomain]/page.tsx) artık ilk sayfayı
// sunucuda render ediyor; arama, kategori değişimi ve "Devamını Göster"
// buradan besleniyor. Girişte oturum gerektirmez (herkese açık mağaza) —
// erişim kontrolü fiyat listesi çerezinin geçerliliğine dayanır, tıpkı
// sayfanın kendisinde olduğu gibi.
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

  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1;
  const search = url.searchParams.get("q") ?? undefined;
  const categoryIds = url.searchParams.get("categoryIds")?.split(",").filter(Boolean);
  const matchCategoryIds = url.searchParams.get("matchCategoryIds")?.split(",").filter(Boolean);
  const discountOnly = url.searchParams.get("discountOnly") === "1";
  const sort = parseStorefrontProductSort(url.searchParams.get("sort"));

  const categories = await getTenantCategories(tenant.id);
  const excludeCategoryIds = getHiddenStorefrontCategoryIds(categories);

  const { products, total } = await getStorefrontProductsPage({
    tenantId: tenant.id,
    priceListId: priceListState.priceListId,
    isCatalogOnly: priceListState.isCatalogOnly,
    page,
    search,
    categoryIds,
    matchCategoryIds,
    excludeCategoryIds,
    discountOnly,
    sort,
  });

  return NextResponse.json({ products, total });
}
