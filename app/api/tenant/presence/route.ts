import { NextResponse } from "next/server";
import { getTenantOnlinePresence } from "@/lib/analytics/presence";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantPlanFeatureResponse } from "@/lib/tenancy/guards";

export async function GET() {
  const guard = await ensureTenantPlanFeatureResponse("reports");
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const presence = await getTenantOnlinePresence(session.tenant!.id);

  return NextResponse.json({ presence });
}
