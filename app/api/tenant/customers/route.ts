import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { getTenantCustomersOverview } from "@/lib/customers/data";

export async function GET() {
  const guard = await ensureTenantAdminResponse();
  if (guard) {
    return guard;
  }

  const session = await getSessionContext();
  const tenant = session.tenant!;

  if (tenant.business_type !== "market") {
    return NextResponse.json({ error: "Bu özellik sadece market tipi hesaplar için kullanılabilir." }, { status: 403 });
  }

  const customers = await getTenantCustomersOverview(tenant.id);

  return NextResponse.json({ customers });
}
