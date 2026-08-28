import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantPlanFeatureResponse } from "@/lib/tenancy/guards";
import { getSalesReport } from "@/lib/sales/queries";
import { salesReportQuerySchema } from "@/lib/validators/sales";

export async function GET(request: Request) {
  const guard = await ensureTenantPlanFeatureResponse("sales_accounting");
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (tenant.business_type !== "market") {
    return NextResponse.json({ error: "Bu özellik sadece market tipi hesaplar için kullanılabilir." }, { status: 403 });
  }

  const url = new URL(request.url);
  const parsed = salesReportQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz aralık." }, { status: 400 });
  }

  const report = await getSalesReport(tenant.id, parsed.data);
  return NextResponse.json({ report }, { headers: { "Cache-Control": "no-store" } });
}
