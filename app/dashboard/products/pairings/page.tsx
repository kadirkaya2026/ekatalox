import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { PairingsManager } from "@/components/dashboard/pairings-manager";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantCategories } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function PairingsPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;

  if (tenant.business_type !== "market") {
    return (
      <div className="space-y-6">
        <Header eyebrow="Ürünler" title="Yanında İyi Gider" description="Bu özellik sadece market tipi hesaplar için kullanılabilir." />
        <Card className="p-6 text-sm text-slate-600">Hesabınız bu özelliğe sahip değil.</Card>
      </div>
    );
  }

  const supabase = createSupabaseAdminClient();
  const [categories, pairingsResult] = await Promise.all([
    getTenantCategories(tenant.id),
    supabase
      ? supabase
          .from("category_pairings")
          .select("source_category_id, target_category_id, priority")
          .eq("tenant_id", tenant.id)
          .order("priority")
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Ürünler"
        title="Yanında İyi Gider"
        description="Müşteri bir kategoriden ürün eklediğinde hangi kategorilerden öneri yapılacağını seçin. Sıra önemlidir: ilk seçtiğiniz önce önerilir. Öneriler üründe, sepette ve sipariş tamamlanırken gösterilir."
      />
      <PairingsManager categories={categories} initialPairings={pairingsResult.data ?? []} />
    </div>
  );
}
