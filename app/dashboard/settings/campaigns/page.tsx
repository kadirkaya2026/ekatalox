import { Header } from "@/components/dashboard/header";
import { TenantCampaignsForm } from "@/components/dashboard/tenant-campaigns-form";
import { TenantPushBroadcastCard } from "@/components/dashboard/tenant-push-broadcast-card";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantCategories, getTenantPriceLists } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TenantCampaign } from "@/lib/types";
import { getTenantStorefrontOrigin } from "@/lib/push/send-tenant-broadcast-push";

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

  const [categories, priceLists] = await Promise.all([getTenantCategories(tenantId), getTenantPriceLists(tenantId)]);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / Bildirim & Kampanyalar"
        title="Bildirim & Kampanyalar"
        description="Müşterilerinize bildirim gönderin ve mağazanızdaki Kampanyalar bölümünde görünecek kartları yönetin. Bildirim açan müşterilere kampanya ve indirim duyurusu gönderebilir, sepet tutarına bağlı otomatik indirim tanımlayabilirsiniz."
      />

      <TenantPushBroadcastCard priceLists={priceLists} categories={categories} inviteUrl={`${getTenantStorefrontOrigin(session.tenant!)}/bildirim`} />

      <TenantCampaignsForm
        initialCampaigns={campaigns}
        categories={categories}
        businessType={session.tenant!.business_type}
      />
    </div>
  );
}
