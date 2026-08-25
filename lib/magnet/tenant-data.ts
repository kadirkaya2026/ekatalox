import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Bayi paneli "Magnetlerim" veri katmanı. Okutma sayısı magnet_codes.scan_count
// sütunundan gelir (0087 trigger'ı) — magnet_scans burada HİÇ okunmaz, 10.000
// kodda da tek sorgu sayfası kadar iş yapılır.

export const TENANT_MAGNET_PAGE_SIZE = 50;

export interface TenantMagnetRow {
  id: string;
  code: string;
  label: string | null;
  assigned_at: string | null;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  is_disabled: boolean;
  disabled_by_role: string | null;
  scan_count: number;
  last_scan_at: string | null;
  customer_id: string | null;
  claimed_at: string | null;
  // Sahiplenen müşteri (İLK siparişi veren ya da bayinin elle seçtiği kişi).
  customer: { id: string; full_name: string; phone: string; address: string } | null;
  // Bu magnetin çerezini taşıyarak sipariş vermiş DİĞER kayıtlı müşteriler:
  // bayi "hep başka biri sipariş veriyor" durumunda magneti onlardan birine
  // devredebilsin (kullanıcı isteği).
  order_customers: { id: string; full_name: string; phone: string }[];
}

export interface TenantMagnetsResult {
  magnets: TenantMagnetRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getTenantMagnets(
  tenantId: string,
  page: number,
): Promise<TenantMagnetsResult> {
  const supabase = createSupabaseAdminClient();
  const bos: TenantMagnetsResult = {
    magnets: [],
    total: 0,
    page,
    pageSize: TENANT_MAGNET_PAGE_SIZE,
  };
  if (!supabase) return bos;

  const from = (page - 1) * TENANT_MAGNET_PAGE_SIZE;

  const { data: rows, count } = await supabase
    .from("magnet_codes")
    .select(
      "id, code, label, assigned_at, city, district, neighborhood, is_disabled, disabled_by_role, scan_count, last_scan_at, customer_id, claimed_at, customers(id, full_name, phone, address)",
      { count: "exact" },
    )
    .eq("tenant_id", tenantId)
    .order("assigned_at", { ascending: false })
    .range(from, from + TENANT_MAGNET_PAGE_SIZE - 1);

  const magnetIds = (rows ?? []).map((row) => row.id);

  // Sayfadaki magnetlerden sipariş vermiş müşteriler (devretme listesi için).
  // Sayfa başına tek sorgu; magnet başına değil.
  const ordererByMagnet = new Map<string, Map<string, { id: string; full_name: string; phone: string }>>();
  if (magnetIds.length) {
    const { data: orderRows } = await supabase
      .from("orders")
      .select("magnet_code_id, customer_id, customers(id, full_name, phone)")
      .eq("tenant_id", tenantId)
      .in("magnet_code_id", magnetIds)
      .not("customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(500);

    for (const row of orderRows ?? []) {
      const magnetId = row.magnet_code_id as string | null;
      const musteri = row.customers as unknown as
        | { id: string; full_name: string; phone: string }
        | null;
      if (!magnetId || !musteri) continue;
      const harita = ordererByMagnet.get(magnetId) ?? new Map();
      if (!harita.has(musteri.id)) harita.set(musteri.id, musteri);
      ordererByMagnet.set(magnetId, harita);
    }
  }

  const magnets: TenantMagnetRow[] = (rows ?? []).map((row) => {
    const musteri = row.customers as unknown as
      | { id: string; full_name: string; phone: string; address: string }
      | null;
    return {
      id: row.id,
      code: row.code,
      label: row.label,
      assigned_at: row.assigned_at,
      city: row.city,
      district: row.district,
      neighborhood: row.neighborhood,
      is_disabled: row.is_disabled ?? false,
      disabled_by_role: row.disabled_by_role ?? null,
      scan_count: row.scan_count ?? 0,
      last_scan_at: row.last_scan_at,
      customer_id: row.customer_id,
      claimed_at: row.claimed_at,
      customer: musteri,
      order_customers: [...(ordererByMagnet.get(row.id)?.values() ?? [])].filter(
        (aday) => aday.id !== row.customer_id,
      ),
    };
  });

  return { magnets, total: count ?? 0, page, pageSize: TENANT_MAGNET_PAGE_SIZE };
}
