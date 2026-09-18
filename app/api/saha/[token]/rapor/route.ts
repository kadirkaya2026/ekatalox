// Raporlama dökümü: GET ?key=SAHA_RAPOR_KEY → tüm ziyaretler + kullanıcılar + medya için imzalı URL'ler (1 saat).
// Yerel rapor script'i (isletme-bulucu/saha-rapor.py) kullanır; sesleri indirip yazıya döker.
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SAHA_RAPOR_KEY, SAHA_TOKEN } from "@/lib/saha/token";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const key = new URL(req.url).searchParams.get("key") ?? "";
  const okKey = key.length === SAHA_RAPOR_KEY.length && timingSafeEqual(Buffer.from(key), Buffer.from(SAHA_RAPOR_KEY));
  if (token !== SAHA_TOKEN || !okKey) return NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "db yok" }, { status: 503, headers: NO_STORE });
  const [{ data: ziyaret }, { data: kullanicilar }] = await Promise.all([
    supabase.from("saha_ziyaret").select("ilce, kayitlar, updated_at"),
    supabase.from("saha_kullanici").select("ad, rol, aktif, created_at"),
  ]);
  const paths = new Set<string>();
  for (const row of ziyaret ?? []) {
    const k = (row.kayitlar ?? {}) as Record<string, { foto?: { p: string }[]; ses?: { p: string }[] }>;
    for (const id of Object.keys(k)) {
      for (const f of k[id].foto ?? []) if (f?.p) paths.add(f.p);
      for (const a of k[id].ses ?? []) if (a?.p) paths.add(a.p);
    }
  }
  const medya: Record<string, string> = {};
  if (paths.size) {
    const { data } = await supabase.storage.from("saha-medya").createSignedUrls([...paths], 3600);
    for (const d of data ?? []) if (d.path && d.signedUrl) medya[d.path] = d.signedUrl;
  }
  return NextResponse.json({ uretildi: new Date().toISOString(), ziyaret, kullanicilar, medya }, { headers: NO_STORE });
}
