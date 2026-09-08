import { NextResponse } from "next/server";
import { couponUpdateSchema } from "@/lib/admin/self-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { id } = await ctx.params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: "Geçersiz kupon." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase production yapılandırması eksik." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const parsed = couponUpdateSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz kupon verisi." },
      { status: 400 },
    );
  }

  // Yalnız gönderilen alanlar yazılır; undefined olanlar dokunulmaz.
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      patch[key] = value;
    }
  }

  const { data, error } = await supabase
    .from("signup_coupons")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "Kupon bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ coupon: data });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { id } = await ctx.params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: "Geçersiz kupon." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase production yapılandırması eksik." }, { status: 500 });
  }

  const { data: existing, error: readError } = await supabase
    .from("signup_coupons")
    .select("id, used_count")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 400 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Kupon bulunamadı." }, { status: 404 });
  }

  // Kullanılmış kupon silinmez (başvuru kayıtları koda referans verir);
  // pasife alınır.
  if ((existing.used_count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Kullanılmış kupon silinemez; pasife alabilirsiniz." },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("signup_coupons").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
