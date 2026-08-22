import { Header } from "@/components/dashboard/header";
import {
  QrCodeManager,
  type MagnetCodeRow,
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

export default async function Page() {
  await requireSuperAdminPage();

  const supabase = createSupabaseAdminClient();

  const { data: codeRows } = supabase
    ? await supabase
        .from("magnet_codes")
        .select("id, code, tenant_id, label, assigned_at, created_at")
        .order("created_at", { ascending: false })
        .limit(1000)
    : { data: [] };

  // Okutma sayısı: magnetin sahada gerçekten çalışıp çalışmadığını gösteren
  // tek somut veri. Yenileme görüşmesinde de işe yarıyor.
  const { data: scanRows } = supabase
    ? await supabase.from("magnet_scans").select("slug")
    : { data: [] };

  const scanCounts = new Map<string, number>();
  for (const scan of scanRows ?? []) {
    const key = String(scan.slug ?? "").toLowerCase();
    scanCounts.set(key, (scanCounts.get(key) ?? 0) + 1);
  }

  const codes: MagnetCodeRow[] = (codeRows ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    tenant_id: row.tenant_id,
    label: row.label,
    assigned_at: row.assigned_at,
    created_at: row.created_at,
    scan_count: scanCounts.get(String(row.code).toLowerCase()) ?? 0,
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
      />
    </div>
  );
}
