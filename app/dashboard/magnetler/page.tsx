import { Header } from "@/components/dashboard/header";
import { MagnetsManager } from "@/components/dashboard/magnets-manager";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantMagnets } from "@/lib/magnet/tenant-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function TenantMagnetsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;

  const { page: sayfaParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(sayfaParam ?? "1", 10) || 1);

  const supabase = createSupabaseAdminClient();
  const [result, { data: blockedRows }] = await Promise.all([
    getTenantMagnets(tenant.id, page),
    supabase
      ? supabase
          .from("blocked_customer_phones")
          .select("id, phone, reason, created_at")
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Magnet CRM"
        title="Magnetlerim"
        description="Tarafınıza tanımlanan QR magnetler: okutma sayıları ve magnetten gelen ilk siparişin müşteri bilgisi. Müşteriye hiçbir form sorulmaz — ilk tamamlanan sipariş magneti sessizce tanımlar; yanlış kişi işaretlendiyse buradan düzeltebilirsiniz."
      />
      <MagnetsManager
        initialMagnets={result.magnets}
        initialBlocked={blockedRows ?? []}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
