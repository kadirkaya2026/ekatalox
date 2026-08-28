import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { getTenantOrdersPage } from "@/lib/orders/data";
import { orderListQuerySchema } from "@/lib/validators/orders";

export async function GET(request: Request) {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (tenant.business_type !== "market") {
    return NextResponse.json({ error: "Bu özellik sadece market tipi hesaplar için kullanılabilir." }, { status: 403 });
  }

  const url = new URL(request.url);
  const parsed = orderListQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz sorgu." }, { status: 400 });
  }

  const page = await getTenantOrdersPage(tenant.id, parsed.data);
  return NextResponse.json(page);
}
