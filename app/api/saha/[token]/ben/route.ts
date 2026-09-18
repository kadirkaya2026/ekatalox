// GET → oturumdaki kullanıcı { ad, rol } ya da 401 ; POST { sifre } → kendi şifresini değiştir
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SAHA_TOKEN } from "@/lib/saha/token";
import { hashPassword, readSession } from "@/lib/saha/auth";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (token !== SAHA_TOKEN) return NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
  const s = readSession(req.headers.get("cookie"));
  if (!s) return NextResponse.json({ error: "giriş gerekli" }, { status: 401, headers: NO_STORE });
  return NextResponse.json({ ad: s.ad, rol: s.rol }, { headers: NO_STORE });
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (token !== SAHA_TOKEN) return NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
  const s = readSession(req.headers.get("cookie"));
  if (!s) return NextResponse.json({ error: "giriş gerekli" }, { status: 401, headers: NO_STORE });
  const body = await req.json().catch(() => ({}));
  const sifre = typeof body.sifre === "string" ? body.sifre.trim() : "";
  if (sifre.length < 6) return NextResponse.json({ error: "Şifre en az 6 karakter" }, { status: 400, headers: NO_STORE });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "db yok" }, { status: 503, headers: NO_STORE });
  const { error } = await supabase.from("saha_kullanici").update({ sifre: hashPassword(sifre) }).eq("id", s.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE });
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
