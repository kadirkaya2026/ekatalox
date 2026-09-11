import { NextResponse } from "next/server";
import { getTenantVisitorProvinceReport } from "@/lib/analytics/province-queries";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantPlanFeatureResponse } from "@/lib/tenancy/guards";
import { analyticsPeriodSchema } from "@/lib/validators/analytics";

export async function GET(request: Request) {
  const guard = await ensureTenantPlanFeatureResponse("reports");
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;

  if (tenant.business_type !== "general") {
    return NextResponse.json({ error: "Bu rapor yalnız toptancı hesaplar için." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsedPeriod = analyticsPeriodSchema.safeParse(searchParams.get("period") ?? "daily");
  const period = parsedPeriod.success ? parsedPeriod.data : "daily";

  const report = await getTenantVisitorProvinceReport(tenant.id, period, {
    isPasswordProtected: tenant.is_password_protected,
    magnetLoginEnabled: tenant.magnet_login_enabled,
  });

  return NextResponse.json({ report });
}
