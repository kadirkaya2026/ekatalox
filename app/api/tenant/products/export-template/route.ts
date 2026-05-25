import { NextResponse } from "next/server";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { productCsvHeaders } from "@/lib/products/constants";

export async function GET() {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const csvContent = `\uFEFF${productCsvHeaders.join(",")}\n`;

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="products-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}