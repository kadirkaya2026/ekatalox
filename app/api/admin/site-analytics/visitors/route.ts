import { NextResponse } from "next/server";
import { getSiteAnalyticsVisitors } from "@/lib/site-analytics/report";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import { siteAnalyticsRangeSchema } from "@/lib/validators/site-analytics";

export async function GET(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { searchParams } = new URL(request.url);
  const parsed = siteAnalyticsRangeSchema.safeParse({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    limit: searchParams.get("limit") ?? undefined,
    offset: searchParams.get("offset") ?? undefined,
  });

  if (!parsed.success || parsed.data.from > parsed.data.to) {
    return NextResponse.json({ error: "Geçersiz tarih aralığı." }, { status: 400 });
  }

  const { from, to, limit = 50, offset = 0 } = parsed.data;
  const visitors = await getSiteAnalyticsVisitors({ from, to }, limit, offset);

  return NextResponse.json({ visitors });
}
