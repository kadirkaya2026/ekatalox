import { NextResponse } from "next/server";
import { getStorefrontProductsByIds, getStorefrontTenant } from "@/lib/data";
import { isTrialExpired } from "@/lib/billing/trial";
import {
  isStorefrontPriceListStateValid,
  readStorefrontPriceList,
} from "@/lib/storefront/session";

// "N al Y hediye" kampanyalarının tetikleyici/hediye ürünlerini id ile
// çözer — bu ürünler sayfada hiç yüklü olmayabilir (bkz.
// getStorefrontProductsByIds yorumu). Herkese açık mağaza uç noktası,
// /api/storefront/products ile aynı erişim kontrolü (fiyat listesi çerezi).

export async function GET(request: Request) {
  const url = new URL(request.url);
  const subdomain = url.searchParams.get("subdomain");
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 50);

  if (!subdomain || !ids.length) {
    return NextResponse.json({ products: [] });
  }

  const tenant = await getStorefrontTenant(subdomain);
  if (!tenant || tenant.status !== "active" || isTrialExpired(tenant)) {
    return NextResponse.json({ products: [] });
  }

  const priceListState = await readStorefrontPriceList(subdomain);
  if (!priceListState || !isStorefrontPriceListStateValid({ cookieState: priceListState, tenant })) {
    return NextResponse.json({ products: [] });
  }

  const products = await getStorefrontProductsByIds({
    tenantId: tenant.id,
    priceListId: priceListState.priceListId,
    isCatalogOnly: priceListState.isCatalogOnly,
    ids,
  });

  return NextResponse.json({ products });
}
