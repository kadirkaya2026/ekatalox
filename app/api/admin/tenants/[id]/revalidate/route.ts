import { NextResponse } from "next/server";
import { getTenantsOverview } from "@/lib/data";
import { revalidateStorefrontCache } from "@/lib/storefront/cache";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/admin/tenants/[id]/revalidate">,
) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { id } = await ctx.params;
  const tenants = await getTenantsOverview();
  const tenant = tenants.find((entry) => entry.id === id);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant bulunamadı." }, { status: 404 });
  }

  revalidateStorefrontCache({ tenantId: tenant.id, subdomain: tenant.subdomain });

  return NextResponse.json({ success: true });
}
