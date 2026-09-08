import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/api/rate-limit";
import { validateSignupCoupon } from "@/lib/billing/coupons";
import { getEsnafPlan } from "@/lib/billing/esnaf-plans";
import { getClientIp } from "@/lib/storefront/client-ip";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (ip && isRateLimited(`kupon:${ip}`, 30, 60_000)) {
    return NextResponse.json({ valid: false, message: "Çok fazla deneme." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const code = (searchParams.get("code") ?? "").trim();
  const plan = getEsnafPlan(searchParams.get("plan") ?? "");
  const period = searchParams.get("period") === "monthly" ? "monthly" : "yearly";

  if (!code || !plan) {
    return NextResponse.json({ valid: false, message: "Kupon kodu ve paket gerekli." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ valid: false, message: "Kupon şu an doğrulanamıyor." });
  }

  const result = await validateSignupCoupon(supabase, code, plan.planId as "pro" | "business", period);
  if (!result.ok) {
    return NextResponse.json({ valid: false, message: result.message });
  }

  return NextResponse.json({
    valid: true,
    message: result.message,
    listPrice: result.listPrice,
    finalPrice: result.finalPrice,
    discountType: result.coupon.discountType,
    discountValue: result.coupon.discountValue,
  });
}
