import { Header } from "@/components/dashboard/header";
import { TenantStockVisibilityForm } from "@/components/dashboard/tenant-stock-visibility-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Stokta Olmayan Ürünler" };

export default async function TenantStockSettingsPage() {
  const session = await requireTenantAdminPage();
  const tenantId = session.tenant!.id;
  const supabase = createSupabaseAdminClient();
  const { data } = supabase
    ? await supabase.from("tenants").select("hide_out_of_stock").eq("id", tenantId).maybeSingle()
    : { data: null };

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Stokta Olmayan Ürünler"
        title="Stokta Olmayan Ürünler"
        description="Stok durumunu kapattığınız ürünlerin kataloğunuzda görünüp görünmeyeceğini seçin."
      />
      <TenantStockVisibilityForm initialHide={data?.hide_out_of_stock === true} />
    </div>
  );
}
