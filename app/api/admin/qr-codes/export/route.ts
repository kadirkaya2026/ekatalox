import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import { NextResponse } from "next/server";

// Kod listesini düz metin indirir — sıralı baskı aracına yapıştırılmak için
// (masaüstündeki magnet tasarım sayfası, "Sıralı baskı" bölümü).
//
// SIRA ÖNEMLİ: created_at ASC. assign_free_magnet_codes de aynı sırayla (en
// eski önce) atar; böylece basılan sıra ile atama sırası birebir örtüşür —
// "sıradaki kutu bu bayinin" akışı sayfa numarasıyla takip edilebilir.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) return guard;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const url = new URL(request.url);
  const hepsi = url.searchParams.get("durum") === "hepsi";

  // PostgREST tek istekte 1000 satırda keser; 10.000 kod için sayfalayarak çek.
  const codes: string[] = [];
  const PARCA = 1000;
  for (let from = 0; ; from += PARCA) {
    let query = supabase
      .from("magnet_codes")
      .select("code")
      .order("created_at", { ascending: true })
      .range(from, from + PARCA - 1);
    if (!hepsi) query = query.is("tenant_id", null);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: "Kodlar okunamadı." }, { status: 500 });
    }
    for (const row of data ?? []) codes.push(row.code);
    if (!data || data.length < PARCA) break;
  }

  const tarih = new Date().toISOString().slice(0, 10);
  return new NextResponse(codes.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="magnet-kodlari-${
        hepsi ? "tumu" : "bosta"
      }-${tarih}.txt"`,
      "Cache-Control": "no-store",
    },
  });
}
