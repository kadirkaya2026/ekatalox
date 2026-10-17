import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPublicOrigin } from "@/lib/tenancy/request-host";
import { findAttemptByReference } from "@/lib/payments/order-payments";
import { settleIyzicoToken } from "@/lib/payments/settle";

// iyzico ödeme sayfası bitince müşterinin tarayıcısı buraya token POST eder
// (0185). Token'a güvenilmez: sonuç iyzico'dan imzalı olarak sorulur, sonra
// müşteri mağazanın ödeme sayfasına döner.
export async function POST(request: Request) {
  const reference = new URL(request.url).searchParams.get("ref") ?? "";
  const supabase = createSupabaseAdminClient();
  const attempt = supabase && reference ? await findAttemptByReference(supabase, reference) : null;
  if (!supabase || !attempt) {
    return NextResponse.redirect(`${getPublicOrigin(request)}/`, 303);
  }

  let token = "";
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as { token?: unknown };
    token = typeof body.token === "string" ? body.token : "";
  } else {
    const form = await request.formData().catch(() => null);
    const value = form?.get("token");
    token = typeof value === "string" ? value : "";
  }

  // Token denemeye ait olmalı (başlatırken kaydedildi).
  if (token && (!attempt.provider_token || attempt.provider_token === token)) {
    try {
      await settleIyzicoToken(supabase, attempt, token);
    } catch (error) {
      console.error("[iyzico-callback] sonuç alınamadı", { reference, error: String(error) });
    }
  }

  const { data: order } = await supabase
    .from("orders")
    .select("tracking_token")
    .eq("id", attempt.order_id)
    .maybeSingle();
  return NextResponse.redirect(`${getPublicOrigin(request)}/odeme/${order?.tracking_token ?? ""}?sonuc=1`, 303);
}
