import { NextResponse } from "next/server";
import { getTenantAnalyticsReport } from "@/lib/analytics/queries";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import { analyticsPeriodSchema } from "@/lib/validators/analytics";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/admin/tenants/[id]/reports">,
) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { id } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const parsedPeriod = analyticsPeriodSchema.safeParse(searchParams.get("period") ?? "daily");
  const period = parsedPeriod.success ? parsedPeriod.data : "daily";

  const report = await getTenantAnalyticsReport(id, period);

  return NextResponse.json({ report });
}
