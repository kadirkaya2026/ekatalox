import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { shouldAllowDemoFallback } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import { accessCodeSchema } from "@/lib/validators/access-code";

export async function POST(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const body = await request.json();
  const parsed = accessCodeSchema.safeParse({
    ...body,
    price_tier_level: Number(body.price_tier_level),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Şifre kodu hatalı." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      accessCode: {
        id: randomUUID(),
        created_at: new Date().toISOString(),
        ...parsed.data,
      },
    });
  }

  const { data, error } = await supabase
    .from("access_codes")
    .insert(parsed.data)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ accessCode: data });
}

export async function DELETE(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) {
    return guard;
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Silinecek şifre seçilmedi." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    if (!shouldAllowDemoFallback()) {
      return NextResponse.json(
        { error: "Supabase production yapılandırması eksik." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.from("access_codes").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}