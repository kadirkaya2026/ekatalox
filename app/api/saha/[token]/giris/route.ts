// POST { sifre } → oturum çerezi + { ad, rol } ; DELETE → çıkış
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SAHA_TOKEN } from "@/lib/saha/token";
import { findUserByPassword, sessionCookie, signSession } from "@/lib/saha/auth";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

// Kaba kuvvet freni: IP başına dakikada 10 deneme (instance içi)
const tries = new Map<string, { n: number; t: number }>();
function limited(ip: string) {
  const now = Date.now(); const e = tries.get(ip);
  if (!e || e.t < now - 60_000) { tries.set(ip, { n: 1, t: now }); return false; }
  e.n += 1; return e.n > 10;
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (token !== SAHA_TOKEN) return NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "ip";
  if (limited(ip)) return NextResponse.json({ error: "Çok fazla deneme, 1 dakika bekle" }, { status: 429, headers: NO_STORE });
  const body = await req.json().catch(() => ({}));
  const sifre = typeof body.sifre === "string" ? body.sifre.trim() : "";
  if (sifre.length < 4) return NextResponse.json({ error: "Şifre gir" }, { status: 400, headers: NO_STORE });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "db yok" }, { status: 503, headers: NO_STORE });
  const user = await findUserByPassword(supabase, sifre);
  if (!user) return NextResponse.json({ error: "Şifre yanlış" }, { status: 401, headers: NO_STORE });
  const res = NextResponse.json({ ad: user.ad, rol: user.rol }, { headers: NO_STORE });
  res.headers.append("Set-Cookie", sessionCookie(signSession(user)));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true }, { headers: NO_STORE });
  res.headers.append("Set-Cookie", sessionCookie(null));
  return res;
}
