import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrderByTrackingToken } from "@/lib/orders/data";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Push aboneliği sipariş takip token'ına bağlanır: token'ı olmayan abone
// olamaz, abonelik yalnız o siparişin (ve aynı müşterinin sonraki
// siparişlerinin) bildirimlerini alır.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const sub = body?.subscription;
  if (!UUID.test(token) || !sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const result = await getOrderByTrackingToken(token);
  if (!result) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  const { data: tenant } = await supabase.from("tenants").select("is_demo").eq("id", result.order.tenant_id).maybeSingle();
  if (tenant?.is_demo) return NextResponse.json({ error: "Demo hesapta bildirim kapalı." }, { status: 403 });

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      tenant_id: result.order.tenant_id,
      order_id: result.order.id,
      customer_id: result.order.customer_id,
      endpoint: String(sub.endpoint),
      p256dh: String(sub.keys.p256dh),
      auth: String(sub.keys.auth),
      user_agent: typeof body.user_agent === "string" ? body.user_agent.slice(0, 300) : null,
      failure_count: 0,
    },
    { onConflict: "endpoint" },
  );
  if (error) return NextResponse.json({ error: "Abonelik kaydedilemedi." }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  if (!UUID.test(token) || !endpoint) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const result = await getOrderByTrackingToken(token);
  const supabase = createSupabaseAdminClient();
  if (!result || !supabase) return NextResponse.json({ ok: true });
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("tenant_id", result.order.tenant_id);
  return NextResponse.json({ ok: true });
}
