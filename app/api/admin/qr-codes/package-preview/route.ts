import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSuperAdminResponse } from "@/lib/tenancy/guards";

// Çoklu paket ataması ÖNCESİ ön izleme: seçilen paketlerde kaç kod boşta,
// kaçı zaten BAŞKA bayiye atanmış (hangi bayilere), kaçı hedef bayide.
// Panel bunu onay modalında gösterir:
//   "A01: 5 tanesi X Market'e atanmış, kalan 95 kodu Y'ye atamak üzeresiniz."

export async function GET(request: Request) {
  const guard = await ensureSuperAdminResponse();
  if (guard) return guard;

  const url = new URL(request.url);
  const tenantId = (url.searchParams.get("tenant") ?? "").trim();
  const packs = (url.searchParams.get("packs") ?? "")
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter((p) => /^[A-J]\d{2}$/.test(p));

  if (!packs.length) {
    return NextResponse.json({ error: "Paket seçilmedi." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("magnet_codes")
    .select("package_code, tenant_id, is_disabled, tenants(company_name, subdomain)")
    .in("package_code", packs);

  if (error) {
    return NextResponse.json({ error: "Ön izleme alınamadı." }, { status: 500 });
  }

  type TenantRef = { company_name: string | null; subdomain: string };
  type Row = {
    package_code: string | null;
    tenant_id: string | null;
    is_disabled: boolean | null;
    // PostgREST tekil FK'yı bazen dizi olarak tipliyor — ikisini de karşıla.
    tenants: TenantRef | TenantRef[] | null;
  };

  const byPack = new Map<
    string,
    {
      package_code: string;
      total: number;
      free: number;
      toThisTenant: number;
      toOthers: number;
      disabled: number;
      others: Map<string, number>;
    }
  >();
  for (const p of packs) {
    byPack.set(p, {
      package_code: p,
      total: 0,
      free: 0,
      toThisTenant: 0,
      toOthers: 0,
      disabled: 0,
      others: new Map(),
    });
  }

  for (const row of (data ?? []) as unknown as Row[]) {
    if (!row.package_code) continue;
    const acc = byPack.get(row.package_code.toUpperCase());
    if (!acc) continue;
    acc.total += 1;
    if (row.is_disabled) acc.disabled += 1;
    if (!row.tenant_id) {
      acc.free += 1;
    } else if (tenantId && row.tenant_id === tenantId) {
      acc.toThisTenant += 1;
    } else {
      acc.toOthers += 1;
      const t = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
      const ad = t?.company_name?.trim() || t?.subdomain || "başka bayi";
      acc.others.set(ad, (acc.others.get(ad) ?? 0) + 1);
    }
  }

  const packages = packs.map((p) => {
    const acc = byPack.get(p)!;
    return {
      package_code: acc.package_code,
      total: acc.total,
      free: acc.free,
      toThisTenant: acc.toThisTenant,
      toOthers: acc.toOthers,
      disabled: acc.disabled,
      otherTenants: [...acc.others.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    };
  });

  const totals = packages.reduce(
    (t, p) => ({
      free: t.free + p.free,
      toOthers: t.toOthers + p.toOthers,
      toThisTenant: t.toThisTenant + p.toThisTenant,
    }),
    { free: 0, toOthers: 0, toThisTenant: 0 },
  );

  return NextResponse.json({ packages, totals });
}
