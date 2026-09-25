import { NextResponse } from "next/server";
import { z } from "zod";
import { DOMAIN_REQUEST_STATUSES, updateDomainRequestStatus } from "@/lib/kurumsal/domain-requests";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

// Süper admin: alan adı talebinin durumu (new → purchased / cancelled).
const schema = z.object({ status: z.enum(DOMAIN_REQUEST_STATUSES, "Geçersiz durum.") });

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/domain-requests/[id]">) {
  const guard = await ensureSuperAdminResponse();
  if (guard) return guard;
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz durum." }, { status: 400 });
  }
  const ok = await updateDomainRequestStatus(id, parsed.data.status);
  if (!ok) return NextResponse.json({ error: "Talep güncellenemedi." }, { status: 404 });
  return NextResponse.json({ id, status: parsed.data.status });
}
