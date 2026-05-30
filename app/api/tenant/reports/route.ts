import { NextResponse } from "next/server";
import { getTenantAnalyticsReport } from "@/lib/analytics/queries";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { analyticsPeriodSchema } from "@/lib/validators/analytics";

export async function GET(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const { searchParams } = new URL(request.url);
  const parsedPeriod = analyticsPeriodSchema.safeParse(searchParams.get("period") ?? "daily");
  const period = parsedPeriod.success ? parsedPeriod.data : "daily";

  const report = await getTenantAnalyticsReport(session.tenant!.id, period);

  return NextResponse.json({ report });
}
