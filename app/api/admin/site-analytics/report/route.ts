import { NextResponse } from "next/server";
import { autoSiteBucket, getSiteAnalyticsReport } from "@/lib/site-analytics/report";
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
    bucket: searchParams.get("bucket") ?? undefined,
  });

  if (!parsed.success || parsed.data.from > parsed.data.to) {
    return NextResponse.json({ error: "Geçersiz tarih aralığı." }, { status: 400 });
  }

  const { from, to } = parsed.data;
  const bucket = parsed.data.bucket ?? autoSiteBucket(from, to);
  const report = await getSiteAnalyticsReport({ from, to, bucket });

  return NextResponse.json({ report });
}
