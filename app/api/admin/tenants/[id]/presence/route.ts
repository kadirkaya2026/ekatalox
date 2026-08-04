import { NextResponse } from "next/server";
import { getTenantOnlinePresence } from "@/lib/analytics/presence";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

// Reads live data on every request; never statically cached.
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/admin/tenants/[id]/presence">,
) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { id } = await ctx.params;
  const presence = await getTenantOnlinePresence(id);

  return NextResponse.json({ presence });
}
