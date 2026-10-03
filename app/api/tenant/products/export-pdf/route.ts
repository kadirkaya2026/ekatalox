import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { buildProductsPdf } from "@/lib/products/export-pdf";
import { parseProductQualityFilter, parseProductStockFilter } from "@/lib/products/constants";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// Ürünler sayfası → "PDF olarak dışa aktar" (3 Eki 2026). Paneldeki listeyle aynı filtre ve sıra;
// fiyat listesini kullanıcı seçer ("none" = fiyatsız). PDF üretimi lib/products/export-pdf.ts.
export const maxDuration = 120;

export async function GET(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const url = new URL(request.url);
  const result = await buildProductsPdf({
    tenant,
    priceListParam: url.searchParams.get("priceListId") ?? "none",
    search: url.searchParams.get("q") ?? undefined,
    categoryIds: url.searchParams.get("categoryIds")?.split(",").filter(Boolean),
    matchCategoryIds: url.searchParams.get("matchCategoryIds")?.split(",").filter(Boolean),
    stockFilter: parseProductStockFilter(url.searchParams.get("stock")),
    qualityFilter: parseProductQualityFilter(url.searchParams.get("quality")),
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
