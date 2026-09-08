import { NextResponse } from "next/server";
import { consumeResetToken } from "@/lib/auth/password-reset";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!/^[a-f0-9]{64}$/.test(token)) {
    return NextResponse.json({ error: "Bağlantı geçersiz. Yeni bir sıfırlama isteği gönderin." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Şifre en az 8 karakter olmalı." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const userId = await consumeResetToken(supabase, token);
  if (!userId) {
    return NextResponse.json({ error: "Bağlantının süresi dolmuş ya da daha önce kullanılmış. Yeni bir istek gönderin." }, { status: 400 });
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, { password });
  if (error) {
    return NextResponse.json({ error: "Şifre güncellenemedi. Lütfen tekrar deneyin." }, { status: 500 });
  }
  await supabase.from("profiles").update({ must_change_password: false }).eq("id", userId);

  return NextResponse.json({ ok: true });
}
