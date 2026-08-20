import { NextResponse } from "next/server";
import { getMarketCatalogProductsPage } from "@/lib/data";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

// Master Katalog listeleme — SADECE süper admin. Tenant tarafındaki eşdeğeri
// (app/api/tenant/products/market-catalog) yalnızca "içe aktar" seçicisini
// besler ve düzenleme sunmaz; buradaki liste düzenleme ekranını besler.
export async function GET(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const url = new URL(request.url);
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1;
  const search = url.searchParams.get("q") ?? undefined;

  const { products, total } = await getMarketCatalogProductsPage({ page, search });

  return NextResponse.json({ products, total });
}
