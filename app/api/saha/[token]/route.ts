// Tekel saha uygulaması ziyaret kayıtları (public/saha/<token>/index.html).
// GET  → tüm ilçelerin kayıtları  { ziyaret: { <ilce>: { <bayiId>: {d,n,t} } } }
// PUT  → { ilce, kayitlar } bir ilçenin kayıtlarını bütünüyle yazar (upsert)
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SAHA_TOKEN } from "@/lib/saha/token";
import { readSession } from "@/lib/saha/auth";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const ILCE_RE = /^[a-z0-9-]{2,40}$/;

function unauthorized() {
  return NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
}

function needLogin() {
  return NextResponse.json({ error: "giriş gerekli" }, { status: 401, headers: NO_STORE });
}

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (token !== SAHA_TOKEN) return unauthorized();
  if (!readSession(req.headers.get("cookie"))) return needLogin();
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
  const session = readSession(req.headers.get("cookie"));
  if (!session) return needLogin();
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

  // Yetki: temsilci kayıt silemez ve başkasının kaydını değiştiremez; yeni kayıt onun adına yazılır.
  type Kayit = Record<string, unknown> & { kim?: string };
  const gelen = kayitlar as Record<string, Kayit>;
  if (session.rol !== "admin") {
    const { data: mevcutRow } = await supabase.from("saha_ziyaret").select("kayitlar").eq("ilce", ilce).maybeSingle();
    const mevcut = (mevcutRow?.kayitlar ?? {}) as Record<string, Kayit>;
    for (const id of Object.keys(mevcut)) {
      if (!(id in gelen)) return NextResponse.json({ error: "Geri alma yetkin yok" }, { status: 403, headers: NO_STORE });
      const eski = mevcut[id];
      if (eski.kim && eski.kim !== session.ad && JSON.stringify(eski) !== JSON.stringify(gelen[id])) {
        return NextResponse.json({ error: "Başkasının kaydını değiştiremezsin" }, { status: 403, headers: NO_STORE });
      }
    }
    for (const id of Object.keys(gelen)) if (!mevcut[id]) gelen[id] = { ...gelen[id], kim: session.ad };
  }
  const { error } = await supabase
    .from("saha_ziyaret")
    .upsert({ ilce, kayitlar, updated_at: new Date().toISOString() }, { onConflict: "ilce" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE });
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
