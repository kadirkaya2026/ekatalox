import { Header } from "@/components/dashboard/header";
import {
  QrCodeManager,
  type MagnetCodeRow,
  type PackageSummary,
  type TenantOption,
} from "@/components/admin/qr-code-manager";
import { requireSuperAdminPage } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { appEnv } from "@/lib/env";

// Önceden basılan magnet QR'larının kod havuzu.
//
// Neden gerekti: /t/{slug} slug'ı doğrudan subdomain sayıyordu, dolayısıyla
// magnet ancak bayi belli olduktan sonra bastırılabiliyordu. Saha satışında
// magnetin çantada hazır olması lazım (bkz. 0084_magnet_codes.sql).

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; durum?: string; paket?: string }>;
}) {
  await requireSuperAdminPage();

  const supabase = createSupabaseAdminClient();

  // Sayfalama: 10.000 kodla calisacak. Eskiden .limit(1000) vardi.
  const PAGE_SIZE = 100;
  const { page: sayfaParam, durum: durumParam, paket: paketParam } = await searchParams;
  // Baskı paketi süzgeci (A01..J10) — bir paket tam 100 kod olduğu için
  // seçili paket tek sayfada eksiksiz listelenir.
  const paketTemiz = (paketParam ?? "").trim().toUpperCase();
  const paket = /^[A-J]\d{2}$/.test(paketTemiz) ? paketTemiz : null;
  const page = Math.max(1, Number.parseInt(sayfaParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  // Durum suzgeci de sunucuda. Sayfa basina 100 satir cekildigi icin istemci
  // tarafinda suzmek "Bosta (3)" gibi sadece o sayfayi anlatan yanlis sayilar
  // uretiyordu.
  const durum: "all" | "free" | "assigned" | "disabled" =
    durumParam === "free" || durumParam === "assigned" || durumParam === "disabled"
      ? durumParam
      : "all";

  async function fetchCodes() {
    if (!supabase) return { data: [], count: 0 };
    let query = supabase
      .from("magnet_codes")
      .select(
        "id, code, tenant_id, label, package_code, package_position, assigned_at, created_at, city, district, neighborhood, placed_at, is_disabled, scan_count, last_scan_at, customer_id, claimed_at",
        { count: "exact" },
      )
      // Paket görünümünde sıra = matbaadan çıkan destedeki FİZİKSEL sıra
      // (package_position, tabaka PDF'inden çıkarıldı); genel listede en yeni üstte.
      .order(paket ? "package_position" : "created_at", { ascending: Boolean(paket) })
      .range(from, from + PAGE_SIZE - 1);
    if (durum === "free") query = query.is("tenant_id", null);
    else if (durum === "assigned") query = query.not("tenant_id", "is", null);
    else if (durum === "disabled") query = query.eq("is_disabled", true);
    if (paket) query = query.eq("package_code", paket);
    return await query;
  }

  // Rozetlerdeki sayilar tum tabloyu anlatmali; head:true satir tasimaz.
  const [{ data: codeRows, count }, toplamSonuc, bostaSonuc, paketSonuc] = await Promise.all([
    fetchCodes(),
    supabase
      ? supabase.from("magnet_codes").select("id", { count: "exact", head: true })
      : Promise.resolve({ count: 0 }),
    supabase
      ? supabase
          .from("magnet_codes")
          .select("id", { count: "exact", head: true })
          .is("tenant_id", null)
      : Promise.resolve({ count: 0 }),
    // Baskı paketi özetleri (A01..J10): kaçı boşta, kaçı atanmış.
    supabase
      ? supabase.rpc("magnet_package_summary")
      : Promise.resolve({ data: [] as PackageSummary[] }),
  ]);

  const toplamKod = toplamSonuc.count ?? 0;
  const bostaKod = bostaSonuc.count ?? 0;
  const packages: PackageSummary[] = (paketSonuc.data as PackageSummary[] | null) ?? [];

  // Okutma sayisi artik magnet_codes.scan_count sutununda (0087 trigger'i).
  // Eskiden TUM magnet_scans satirlari belege cekilip JS'te sayiliyordu ve
  // PostgREST 1000 satirda kestigi icin sayilar sessizce yanlisti.
  const codes: MagnetCodeRow[] = (codeRows ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    tenant_id: row.tenant_id,
    label: row.label,
    package_code: row.package_code ?? null,
    package_position: row.package_position ?? null,
    assigned_at: row.assigned_at,
    created_at: row.created_at,
    scan_count: row.scan_count ?? 0,
    city: row.city,
    district: row.district,
    neighborhood: row.neighborhood,
    placed_at: row.placed_at,
    is_disabled: row.is_disabled ?? false,
    last_scan_at: row.last_scan_at,
    customer_id: row.customer_id,
    claimed_at: row.claimed_at,
  }));

  const { data: tenantRows } = supabase
    ? await supabase
        .from("tenants")
        .select("id, subdomain, company_name")
        .eq("status", "active")
        .order("company_name", { ascending: true })
    : { data: [] };

  const tenants: TenantOption[] = tenantRows ?? [];

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Süper Admin / Magnet QR"
        title="Magnet QR Kodları"
        description="Bayi belli olmadan kod üretip magneti bastırın. Anlaşma yapınca kodu ilgili bayiye atayın — basılı magnet aynı kalır, yönlendirme anında değişir."
      />

      <QrCodeManager
        initialCodes={codes}
        tenants={tenants}
        marketingDomain={appEnv.marketingDomain}
        total={count ?? 0}
        page={page}
        pageSize={PAGE_SIZE}
        durum={durum}
        paket={paket}
        packages={packages}
        toplamKod={toplamKod}
        bostaKod={bostaKod}
      />
    </div>
  );
}
