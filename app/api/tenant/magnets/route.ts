import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { getTenantMagnets } from "@/lib/magnet/tenant-data";

// Bayinin kendi magnetleri — sayfalı liste (arayüz tazelemesi için).

export async function GET(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;

  const url = new URL(request.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);

  const result = await getTenantMagnets(tenant.id, page);
  return NextResponse.json(result);
}
