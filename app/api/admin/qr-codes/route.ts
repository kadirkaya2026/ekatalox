import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import { generateMagnetCode } from "@/lib/magnet/codes";

// Önceden basılacak QR magnetlerinin kod havuzu — SADECE süper admin.
// Kodlar bayi belli olmadan üretilip bastırılıyor, atama sonra yapılıyor
// (bkz. 0084_magnet_codes.sql ve app/t/[slug]/route.ts).

const MAX_BATCH = 200;

export async function GET() {
  const guard = await ensureSuperAdminResponse();
  if (guard) return guard;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ codes: [] });
  }

  const { data, error } = await supabase
    .from("magnet_codes")
    .select("id, code, tenant_id, label, assigned_at, created_at, tenants(subdomain, company_name)")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return NextResponse.json({ error: "Kodlar okunamadı." }, { status: 500 });
  }

  // Her kodun kaç kez okutulduğu — magnetin sahada çalışıp çalışmadığını
  // gösteren tek somut veri.
  const { data: scans } = await supabase.from("magnet_scans").select("slug");
  const scanCounts = new Map<string, number>();
  for (const scan of scans ?? []) {
    const key = String(scan.slug ?? "").toLowerCase();
    scanCounts.set(key, (scanCounts.get(key) ?? 0) + 1);
  }

  const codes = (data ?? []).map((row) => ({
    ...row,
    scan_count: scanCounts.get(String(row.code).toLowerCase()) ?? 0,
  }));

  return NextResponse.json({ codes });
}

export async function POST(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const count = Math.floor(Number(body?.count ?? 0));
  const label = typeof body?.label === "string" ? body.label.trim() || null : null;

  if (!Number.isFinite(count) || count < 1 || count > MAX_BATCH) {
    return NextResponse.json(
      { error: `Bir seferde 1 ile ${MAX_BATCH} arasında kod üretebilirsiniz.` },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  // Çakışma ihtimali düşük ama sıfır değil; benzersiz indeks (lower(code))
  // son savunma. Çakışırsa o kodu atlayıp yeniden deniyoruz.
  const uretilen: string[] = [];
  let deneme = 0;

  while (uretilen.length < count && deneme < count * 10) {
    deneme += 1;
    const code = generateMagnetCode();

    const { error } = await supabase.from("magnet_codes").insert({ code, label });
    if (!error) {
      uretilen.push(code);
    }
  }

  if (!uretilen.length) {
    return NextResponse.json({ error: "Kod üretilemedi." }, { status: 500 });
  }

  return NextResponse.json({ created: uretilen });
}
