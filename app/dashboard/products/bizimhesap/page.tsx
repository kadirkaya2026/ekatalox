import { notFound } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { PlanFeatureGate } from "@/components/dashboard/plan-feature-gate";
import { BizimHesapMappingManager } from "@/components/dashboard/bizimhesap-mapping-manager";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { isBizimHesapBusinessAllowed } from "@/lib/integrations/bizimhesap";

export const metadata = { title: "BizimHesap Eşleştirme" };

// Ürünler > BizimHesap Eşleştirme (8 Eki 2026, Lucatech): siparişlerin BizimHesap'a
// doğru stok kartıyla gitmesi için ürün/varyant ↔ BizimHesap ürünü eşleşmesi.
export default async function BizimHesapMappingPage() {
  const session = await requireTenantAdminPage();
  // Yalnız toptancı mağazalar (market/tekel hariç).
  if (!isBizimHesapBusinessAllowed(session.tenant!)) notFound();
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürünler / BizimHesap"
        title="BizimHesap Eşleştirme"
        description="Her ürünün BizimHesap'taki karşılığını bir kez seçin; onaylanan siparişler BizimHesap'a doğru ürünlerle aktarılır."
      />
      <PlanFeatureGate feature="bizimhesap" plan={session.tenant!.plan} companyName={session.tenant!.company_name}>
        <BizimHesapMappingManager />
      </PlanFeatureGate>
    </div>
  );
}
