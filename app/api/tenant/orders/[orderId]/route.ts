import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTenantOrderWithEvents } from "@/lib/orders/data";
import { orderStatusPatchSchema } from "@/lib/validators/orders";

export async function GET(_request: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const guard = await ensureTenantAdminResponse();
  if (guard) return guard;
  const session = await getSessionContext();
  const { orderId } = await ctx.params;

  const result = await getTenantOrderWithEvents(session.tenant!.id, orderId);
  if (!result) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  return NextResponse.json(result);
}

// Durum geçişi. Kural kontrolü + update + olay kaydı veritabanındaki
// transition_order_status içinde tek transaction (0092); burada yalnız
// hata çevirisi var.
export async function PATCH(request: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;

  const session = await getSessionContext();
  const tenant = session.tenant!;
  if (tenant.business_type !== "market") {
    return NextResponse.json({ error: "Bu özellik sadece market tipi hesaplar için kullanılabilir." }, { status: 403 });
  }

  const { orderId } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = orderStatusPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz istek." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("transition_order_status", {
    p_tenant_id: tenant.id,
    p_order_id: orderId,
    p_to_status: parsed.data.to_status,
    p_reason: parsed.data.reason ?? null,
    p_actor: "dealer",
    p_actor_profile_id: session.profile?.id ?? null,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("order_not_found")) {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    }
    if (msg.includes("invalid_transition")) {
      const current = msg.match(/invalid_transition:([a-z]+)->/)?.[1] ?? null;
      return NextResponse.json(
        { error: "Bu geçiş yapılamaz; sipariş başka bir durumda.", current_status: current },
        { status: 409 },
      );
    }
    if (msg.includes("cancel_reason_required")) {
      return NextResponse.json({ error: "İptal sebebi gerekli." }, { status: 400 });
    }
    console.error("[orders] transition failed:", error);
    return NextResponse.json({ error: "Durum güncellenemedi." }, { status: 500 });
  }

  return NextResponse.json({ order: data });
}
