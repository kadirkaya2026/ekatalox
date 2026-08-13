import { NextResponse } from "next/server";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import { getTenantCustomersOverview } from "@/lib/customers/data";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/admin/tenants/[id]/customers">,
) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { id } = await ctx.params;
  const customers = await getTenantCustomersOverview(id);

  return NextResponse.json({ customers });
}
