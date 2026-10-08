import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { sendOrderToBizimHesap } from "@/lib/integrations/bizimhesap";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureTenantAdminResponse } from "@/lib/tenancy/guards";

// Panelden "BizimHesap'a tekrar gönder" (0159).
export const dynamic = "force-dynamic";

export async function POST(_request: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const guard = await ensureTenantAdminResponse({ blockDemoWrite: true });
  if (guard) return guard;
  const session = await getSessionContext();
  const { orderId } = await ctx.params;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Veritabanı yapılandırması eksik." }, { status: 500 });

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("tenant_id", session.tenant!.id)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });

  const result = await sendOrderToBizimHesap(supabase, orderId, { force: false, trigger: "manual" });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
