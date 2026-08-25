import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import { generateMagnetCode, normalizeMagnetCode } from "@/lib/magnet/codes";

// Önceden basılacak QR magnetlerinin kod havuzu — SADECE süper admin.
// Kodlar bayi belli olmadan üretilip bastırılıyor, atama sonra yapılıyor
// (bkz. 0084_magnet_codes.sql ve app/t/[slug]/route.ts).

const MAX_BATCH = 200;

// Sayfalama sart: 10.000 kodla calisacak. Eskiden .limit(1000) vardi ve
// 1001'inci koddan sonrasi arayuzde hic gorunmuyordu.
const PAGE_SIZE = 100;

export async function GET(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) return guard;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ codes: [], total: 0, page: 1, pageSize: PAGE_SIZE });
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const durum = url.searchParams.get("status");        // free | assigned | disabled
  const arama = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const tenantId = url.searchParams.get("tenant");

  let query = supabase
    .from("magnet_codes")
    .select(
      "id, code, tenant_id, label, assigned_at, created_at, city, district, neighborhood, placed_at, is_disabled, scan_count, last_scan_at, customer_id, claimed_at" + ", tenants(subdomain, company_name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (durum === "free") query = query.is("tenant_id", null);
  else if (durum === "assigned") query = query.not("tenant_id", "is", null);
  else if (durum === "disabled") query = query.eq("is_disabled", true);

  if (tenantId) query = query.eq("tenant_id", tenantId);
  if (arama) query = query.ilike("code", `%${arama}%`);

  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);

  if (error) {
    return NextResponse.json({ error: "Kodlar okunamadı." }, { status: 500 });
  }

  // scan_count artik sutundan geliyor (bkz. 0087 trigger'i). Eskiden TUM
  // magnet_scans satirlari belege cekilip JS'te sayiliyordu; PostgREST 1000
  // satirda kestigi icin sayilar zaten yanlisti.
  return NextResponse.json({
    codes: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
}

export async function POST(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const label = typeof body?.label === "string" ? body.label.trim() || null : null;
  const manualInput = typeof body?.code === "string" ? body.code : null;

  // Konum toplu üretimde de verilebiliyor: bir ilçe için basılan partinin
  // tamamı baştan o ilçeye işaretlensin, sahada sadece mahalle girilsin.
  const metin = (deger: unknown) =>
    typeof deger === "string" && deger.trim() ? deger.trim() : null;
  const konum = {
    city: metin(body?.city),
    district: metin(body?.district),
    neighborhood: metin(body?.neighborhood),
  };

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  // ELLE KOD EKLEME: basılmış bir magnetin kodu yanlışlıkla silindiyse
  // aynı kodu geri yazabilmek gerekiyor, aksi halde o magnetler çöp olur.
  if (manualInput !== null) {
    const parsed = normalizeMagnetCode(manualInput);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { error } = await supabase.from("magnet_codes").insert({ code: parsed.code, label, ...konum });

    if (error) {
      // 23505 = benzersiz kısıt ihlali (lower(code) indeksi).
      const cakisma = error.code === "23505";
      return NextResponse.json(
        {
          error: cakisma
            ? `${parsed.code.toUpperCase()} kodu zaten havuzda var.`
            : "Kod eklenemedi.",
        },
        { status: cakisma ? 409 : 500 },
      );
    }

    return NextResponse.json({ created: [parsed.code] });
  }

  const count = Math.floor(Number(body?.count ?? 0));

  if (!Number.isFinite(count) || count < 1 || count > MAX_BATCH) {
    return NextResponse.json(
      { error: `Bir seferde 1 ile ${MAX_BATCH} arasında kod üretebilirsiniz.` },
      { status: 400 },
    );
  }

  // Çakışma ihtimali düşük ama sıfır değil; benzersiz indeks (lower(code))
  // son savunma. Çakışırsa o kodu atlayıp yeniden deniyoruz.
  const uretilen: string[] = [];
  let deneme = 0;

  while (uretilen.length < count && deneme < count * 10) {
    deneme += 1;
    const code = generateMagnetCode();

    const { error } = await supabase.from("magnet_codes").insert({ code, label, ...konum });
    if (!error) {
      uretilen.push(code);
    }
  }

  if (!uretilen.length) {
    return NextResponse.json({ error: "Kod üretilemedi." }, { status: 500 });
  }

  return NextResponse.json({ created: uretilen });
}
