import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { settlePaynetAttempt } from "@/lib/payments/settle";
import type { PaymentAttempt } from "@/lib/payments/order-payments";

// Ödeme sayfasının durum yoklaması (0185). Paynet başarısız ödemeyi hiç
// bildirmez ve başarı bildirimi de kaçabilir; bekleyen Paynet denemesi
// burada sağlayıcıya sorulur.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const supabase = createSupabaseAdminClient();
  if (!UUID.test(token) || !supabase) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  const { data: order } = await supabase
    .from("orders")
    .select("id, payment_status")
    .eq("tracking_token", token)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });

  const { data: latest } = await supabase
    .from("order_payment_attempts")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const attempt = latest as PaymentAttempt | null;

  let paymentStatus = order.payment_status as string | null;
  if (paymentStatus !== "paid" && attempt?.status === "pending" && attempt.provider === "paynet") {
    const settled = await settlePaynetAttempt(supabase, attempt);
    if (settled === "paid") paymentStatus = "paid";
    else if (settled === "failed") paymentStatus = "failed";
  }

  return NextResponse.json(
    {
      paymentStatus,
      attempt: attempt
        ? { status: attempt.status, error: attempt.status === "failed" ? attempt.error : null }
        : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
