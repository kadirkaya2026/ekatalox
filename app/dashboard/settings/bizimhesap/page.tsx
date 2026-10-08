import { Header } from "@/components/dashboard/header";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { BizimHesapSettingsForm } from "@/components/dashboard/bizimhesap-settings-form";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "BizimHesap" };

// BizimHesap entegrasyonu (0159). Firma kimliği sayfaya GÖNDERİLMEZ; yalnız
// kayıtlı olup olmadığı ve son 4 hanesi.
export default async function BizimHesapSettingsPage() {
  const session = await requireTenantAdminPage();
  const supabase = createSupabaseAdminClient();
  const { data } = supabase
    ? await supabase
        .from("tenant_bizimhesap")
        .select("firm_id, vat_rate, is_enabled")
        .eq("tenant_id", session.tenant!.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ayarlar / BizimHesap"
        title="BizimHesap Entegrasyonu"
        description="Vitrininizden gelen fiyatlı siparişler BizimHesap'a otomatik olarak satış belgesi olarak aktarılır."
      />
      <PlanFeatureGate feature="bizimhesap" plan={session.tenant!.plan} companyName={session.tenant!.company_name}>
      <BizimHesapSettingsForm
        initial={{
          connected: Boolean(data?.firm_id),
          firmIdHint: data?.firm_id ? String(data.firm_id).slice(-4) : null,
          vatRate: data ? Number(data.vat_rate) : 20,
          isEnabled: data?.is_enabled ?? false,
        }}
      />
      </PlanFeatureGate>
    </div>
  );
}
