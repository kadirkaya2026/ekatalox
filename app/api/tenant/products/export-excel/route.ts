import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { buildProductsExcel } from "@/lib/products/export-excel";
import { parseProductQualityFilter, parseProductStockFilter } from "@/lib/products/constants";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// Ürünler sayfası → "Excel olarak dışa aktar" (7 Eki 2026). Paneldeki filtreyle aynı ürünler;
// dosya Toplu İşlemler'den geri yüklenince fiyat/stok güncellenir (lib/products/export-excel.ts).
export const maxDuration = 120;

export async function GET(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const url = new URL(request.url);
  const result = await buildProductsExcel({
    tenant,
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
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
