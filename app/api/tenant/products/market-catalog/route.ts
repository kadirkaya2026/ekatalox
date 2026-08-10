import { NextResponse } from "next/server";
import { getMarketCatalogProductsPage } from "@/lib/data";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

export async function GET(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();

  if (session.tenant!.business_type !== "market") {
    return NextResponse.json(
      { error: "Bu özellik sadece market tipi hesaplar için kullanılabilir." },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1;
  const search = url.searchParams.get("q") ?? undefined;

  const { products, total } = await getMarketCatalogProductsPage({ page, search });

  return NextResponse.json({ products, total });
}
