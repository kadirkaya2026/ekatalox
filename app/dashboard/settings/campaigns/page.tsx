import { Header } from "@/components/dashboard/header";
import { TenantCampaignsForm } from "@/components/dashboard/tenant-campaigns-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantCategories } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TenantCampaign } from "@/lib/types";

// Admin ekranı vitrinden farklı olarak PASİF ve süresi geçmiş kampanyaları
// da göstermeli (bayi onları düzenleyebilsin), o yüzden getStorefrontCampaigns
// değil doğrudan okuma yapılıyor.
export default async function TenantCampaignsSettingsPage() {
  const session = await requireTenantAdminPage();
  const tenantId = session.tenant!.id;

  const supabase = createSupabaseAdminClient();
  const { data } = supabase
    ? await supabase
        .from("tenant_campaigns")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true })
    : { data: [] };

  const campaigns = ((data ?? []) as TenantCampaign[]).map((campaign) => ({
    ...campaign,
    // Supabase numeric kolonları string döndürebiliyor; form sayı bekliyor.
    min_cart_amount:
      campaign.min_cart_amount === null ? null : Number(campaign.min_cart_amount),
    discount_value: campaign.discount_value === null ? null : Number(campaign.discount_value),
  }));

  const categories = await getTenantCategories(tenantId);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Kampanyalar"
        title="Kampanyalar"
        description="Müşterilerinizin mağazanızdaki Kampanyalar bölümünde göreceği kartları buradan yönetin. İsterseniz sadece duyuru yapın, isterseniz sepet tutarına bağlı otomatik indirim tanımlayın."
      />

      <TenantCampaignsForm initialCampaigns={campaigns} categories={categories} />
    </div>
  );
}
