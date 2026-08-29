import { NextResponse } from "next/server";
import { getOrderByTrackingToken } from "@/lib/orders/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Müşteri iptali: yalnız mağaza henüz ONAYLAMAMIŞKEN ('new'). Onaydan sonra
// iptal WhatsApp üzerinden mağazayla konuşularak yapılır (kullanıcı kararı,
// 29 Ağu 2026). Yetki = takip token'ı.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const reasonRaw = typeof body?.reason === "string" ? body.reason.trim().slice(0, 300) : "";
  if (!UUID.test(token)) return NextResponse.json({ error: "Geçersiz takip kodu." }, { status: 400 });

  const result = await getOrderByTrackingToken(token);
  if (!result) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  if (result.order.status !== "new") {
    return NextResponse.json(
      { error: "Mağaza siparişinizi onayladı; iptal için WhatsApp'tan iletişime geçin.", current_status: result.order.status },
      { status: 409 },
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });

  const { data, error } = await supabase.rpc("transition_order_status", {
    p_tenant_id: result.order.tenant_id,
    p_order_id: result.order.id,
    p_to_status: "cancelled",
    p_reason: reasonRaw || "Müşteri iptal etti",
    p_actor: "customer",
  });
  if (error) {
    // Yarış: bayi aynı anda onayladıysa RPC 'invalid_transition' atar.
    if ((error.message ?? "").includes("invalid_transition")) {
      return NextResponse.json({ error: "Mağaza siparişinizi bu arada onayladı; iptal için WhatsApp'tan iletişime geçin." }, { status: 409 });
    }
    console.error("[order-cancel] failed:", error);
    return NextResponse.json({ error: "İptal edilemedi." }, { status: 500 });
  }
  const order = data as { status: string; status_updated_at: string; cancel_reason: string | null };
  return NextResponse.json(
    { status: order.status, status_updated_at: order.status_updated_at, cancel_reason: order.cancel_reason },
    { headers: { "Cache-Control": "no-store" } },
  );
}
