import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { getTenantCustomerOrders } from "@/lib/customers/data";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/tenant/customers/[id]/orders">,
) {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const { id } = await ctx.params;

  if (tenant.business_type !== "market") {
    return NextResponse.json({ error: "Bu özellik sadece market tipi hesaplar için kullanılabilir." }, { status: 403 });
  }

  const orders = await getTenantCustomerOrders(tenant.id, id);

  return NextResponse.json({ orders });
}
