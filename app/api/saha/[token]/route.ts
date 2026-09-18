// Tekel saha uygulaması ziyaret kayıtları (public/saha/<token>/index.html).
// GET  → tüm ilçelerin kayıtları  { ziyaret: { <ilce>: { <bayiId>: {d,n,t} } } }
// PUT  → { ilce, kayitlar } bir ilçenin kayıtlarını bütünüyle yazar (upsert)
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SAHA_TOKEN } from "@/lib/saha/token";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const ILCE_RE = /^[a-z0-9-]{2,40}$/;

function unauthorized() {
  return NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
}

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (token !== SAHA_TOKEN) return unauthorized();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "db yok" }, { status: 503, headers: NO_STORE });
  const { data, error } = await supabase.from("saha_ziyaret").select("ilce, kayitlar, updated_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE });
  const ziyaret: Record<string, unknown> = {};
  for (const row of data ?? []) ziyaret[row.ilce] = row.kayitlar ?? {};
  return NextResponse.json({ ziyaret }, { headers: NO_STORE });
}

export async function PUT(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (token !== SAHA_TOKEN) return unauthorized();
  let body: { ilce?: unknown; kayitlar?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "geçersiz gövde" }, { status: 400, headers: NO_STORE });
  }
  const ilce = typeof body.ilce === "string" ? body.ilce : "";
  const kayitlar = body.kayitlar && typeof body.kayitlar === "object" && !Array.isArray(body.kayitlar) ? body.kayitlar : null;
  if (!ILCE_RE.test(ilce) || !kayitlar) {
    return NextResponse.json({ error: "ilce/kayitlar eksik" }, { status: 400, headers: NO_STORE });
  }
  if (JSON.stringify(kayitlar).length > 512_000) {
    return NextResponse.json({ error: "kayıt çok büyük" }, { status: 413, headers: NO_STORE });
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "db yok" }, { status: 503, headers: NO_STORE });
  const { error } = await supabase
    .from("saha_ziyaret")
    .upsert({ ilce, kayitlar, updated_at: new Date().toISOString() }, { onConflict: "ilce" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE });
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
