import { NextResponse } from "next/server";
import { getTenantOnlinePresence } from "@/lib/analytics/presence";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantPlanFeatureResponse } from "@/lib/tenancy/guards";

// Reads auth cookies + live data on every request; never statically cached.
export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await ensureTenantPlanFeatureResponse("reports");
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const presence = await getTenantOnlinePresence(session.tenant!.id);

  return NextResponse.json({ presence });
}
