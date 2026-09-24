import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { dealerApplicationStatusSchema } from "@/lib/kurumsal/applications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// Bayi başvurusunun durumunu günceller (Yeni / Arandı / Onaylandı /
// Reddedildi). Admin client RLS'i atladığı için sorgu tenant_id ile de
// sınırlı: başka bayinin başvurusu bu uçtan değişemez.
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/tenant/kurumsal/basvurular/[id]">,
) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Başvuru bulunamadı." }, { status: 404 });
  }
  const body = await request.json().catch(() => null);
  const parsed = dealerApplicationStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz durum." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("dealer_applications")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .select("id, status")
    .maybeSingle();

  if (error) {
    console.error("[kurumsal] başvuru güncellenemedi:", error.message);
    return NextResponse.json({ error: "Başvuru güncellenemedi." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Başvuru bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ application: data });
}
