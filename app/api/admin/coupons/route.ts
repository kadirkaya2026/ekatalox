import { NextResponse } from "next/server";
import { couponCreateSchema, listSignupCoupons } from "@/lib/admin/self-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/auth/session";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

export async function GET() {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  try {
    const coupons = await listSignupCoupons();
    return NextResponse.json({ coupons });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kuponlar okunamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase production yapılandırması eksik." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const parsed = couponCreateSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz kupon verisi." },
      { status: 400 },
    );
  }

  const session = await getSessionContext();
  const input = parsed.data;

  const { data, error } = await supabase
    .from("signup_coupons")
    .insert({
      code: input.code,
      description: input.description ?? null,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      applies_to_plans: input.applies_to_plans ?? null,
      applies_to_periods: input.applies_to_periods ?? null,
      valid_from: input.valid_from ?? new Date().toISOString(),
      valid_until: input.valid_until ?? null,
      max_uses: input.max_uses ?? null,
      is_active: input.is_active ?? true,
      created_by: session.profile?.id ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Bu kupon kodu zaten kayıtlı." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ coupon: data }, { status: 201 });
}
