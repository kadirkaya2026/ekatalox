// Yalnız admin: GET kullanıcı listesi ; POST { ad, sifre, rol } ekle ; DELETE { id } pasifleştir
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SAHA_TOKEN } from "@/lib/saha/token";
import { hashPassword, readSession } from "@/lib/saha/auth";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

async function guard(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (token !== SAHA_TOKEN) return { err: NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE }) };
  const s = readSession(req.headers.get("cookie"));
  if (!s || s.rol !== "admin") return { err: NextResponse.json({ error: "yetki yok" }, { status: 403, headers: NO_STORE }) };
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { err: NextResponse.json({ error: "db yok" }, { status: 503, headers: NO_STORE }) };
  return { s, supabase };
}

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const g = await guard(req, ctx); if ("err" in g) return g.err;
  const { data, error } = await g.supabase.from("saha_kullanici").select("id, ad, rol, aktif, created_at").order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE });
  return NextResponse.json({ kullanicilar: data }, { headers: NO_STORE });
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const g = await guard(req, ctx); if ("err" in g) return g.err;
  const body = await req.json().catch(() => ({}));
  const ad = typeof body.ad === "string" ? body.ad.trim().slice(0, 40) : "";
  const sifre = typeof body.sifre === "string" ? body.sifre.trim() : "";
  const rol = body.rol === "admin" ? "admin" : "temsilci";
  if (ad.length < 2 || sifre.length < 6) return NextResponse.json({ error: "Ad (2+) ve şifre (6+) gerekli" }, { status: 400, headers: NO_STORE });
  const { error } = await g.supabase.from("saha_kullanici").insert({ ad, sifre: hashPassword(sifre), rol, aktif: true });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Bu ad zaten var" : error.message }, { status: 400, headers: NO_STORE });
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const g = await guard(req, ctx); if ("err" in g) return g.err;
  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!id || id === g.s.id) return NextResponse.json({ error: "geçersiz" }, { status: 400, headers: NO_STORE });
  const { error } = await g.supabase.from("saha_kullanici").update({ aktif: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE });
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
