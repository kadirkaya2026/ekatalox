import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";
import { normalizeMagnetCode } from "@/lib/magnet/code-format";

// Kod arama: "elimde K7M 2XQ yazan bir magnet var, kimin?" sorusunun tek
// sorguda cevabı — bayi, sahiplenen müşteri, okutma sayısı, durum.

export async function GET(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) return guard;

  const url = new URL(request.url);
  const parsed = normalizeMagnetCode(url.searchParams.get("code") ?? "");
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("magnet_codes")
    .select(
      "id, code, tenant_id, label, package_code, package_position, assigned_at, created_at, city, district, neighborhood, placed_at, is_disabled, disabled_at, disabled_by_role, scan_count, last_scan_at, customer_id, claimed_at, tenants(subdomain, company_name), customers(full_name, phone, address)",
    )
    .ilike("code", parsed.code)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Arama yapılamadı." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Bu kod havuzda yok." }, { status: 404 });
  }

  return NextResponse.json({ code: data });
}
