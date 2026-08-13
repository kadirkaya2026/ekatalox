import { NextResponse } from "next/server";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import { getTenantCustomerOrders } from "@/lib/customers/data";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/admin/tenants/[id]/customers/[customerId]/orders">,
) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { id, customerId } = await ctx.params;
  const orders = await getTenantCustomerOrders(id, customerId);

  return NextResponse.json({ orders });
}
