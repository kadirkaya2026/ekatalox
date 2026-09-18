// Tekel saha uygulaması medyası: dükkân fotoğrafı, rızalı görüşme kaydı, temsilci sesli notu.
// POST multipart { dosya, ilce, bayi, tur: foto|gorusme|not } → { path }  (özel bucket saha-medya)
// GET  ?path=... → 302 imzalı URL (1 saat). Her iki uç da gizli token ister.
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SAHA_TOKEN } from "@/lib/saha/token";
import { readSession } from "@/lib/saha/auth";

export const dynamic = "force-dynamic";

const BUCKET = "saha-medya";
const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const ID_RE = /^[a-z0-9-]{2,40}$/;
const BAYI_RE = /^[A-Za-z0-9_-]{1,80}$/;
const TUR = new Set(["foto", "gorusme", "not"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "audio/webm": "webm", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac",
  "audio/mpeg": "mp3", "audio/ogg": "ogg", "audio/wav": "wav",
};
const MAX_BYTES = 25 * 1024 * 1024;

const notFound = () => NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
const bad = (m: string, status = 400) => NextResponse.json({ error: m }, { status, headers: NO_STORE });

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (token !== SAHA_TOKEN) return notFound();
  if (!readSession(req.headers.get("cookie"))) return bad("giriş gerekli", 401);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("form okunamadı");
  }
  const dosya = form.get("dosya");
  const ilce = String(form.get("ilce") ?? "");
  const bayi = String(form.get("bayi") ?? "");
  const tur = String(form.get("tur") ?? "");
  if (!(dosya instanceof File)) return bad("dosya yok");
  if (!ID_RE.test(ilce) || !BAYI_RE.test(bayi) || !TUR.has(tur)) return bad("ilce/bayi/tur geçersiz");
  const mime = (dosya.type || "").split(";")[0].trim();
  const ext = EXT[mime];
  if (!ext) return bad("desteklenmeyen dosya türü: " + mime, 415);
  if (tur === "foto" && !mime.startsWith("image/")) return bad("foto için görsel gerekir");
  if (tur !== "foto" && !mime.startsWith("audio/")) return bad("ses kaydı gerekir");
  if (dosya.size > MAX_BYTES) return bad("dosya çok büyük", 413);

  const supabase = createSupabaseAdminClient();
  if (!supabase) return bad("db yok", 503);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = `${ilce}/${bayi}/${stamp}-${tur}.${ext}`;
  const buf = Buffer.from(await dosya.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: mime, upsert: false });
  if (error) return bad(error.message, 500);
  return NextResponse.json({ path }, { headers: NO_STORE });
}

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (token !== SAHA_TOKEN) return notFound();
  if (!readSession(req.headers.get("cookie"))) return bad("giriş gerekli", 401);
  const path = new URL(req.url).searchParams.get("path") ?? "";
  if (!/^[a-z0-9-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/.test(path)) return bad("path geçersiz");
  const supabase = createSupabaseAdminClient();
  if (!supabase) return bad("db yok", 503);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return notFound();
  return NextResponse.redirect(data.signedUrl, { status: 302, headers: NO_STORE });
}
