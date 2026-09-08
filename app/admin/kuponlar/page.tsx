// Kayıt kuponları — her açılışta güncel liste.
export const dynamic = "force-dynamic";

import { AdminCouponsPanel } from "@/components/admin/admin-coupons-panel";
import { Header } from "@/components/dashboard/header";
import { listSignupCoupons } from "@/lib/admin/self-service";

export default async function AdminCouponsPage() {
  let coupons: Awaited<ReturnType<typeof listSignupCoupons>> = [];
  let loadError: string | null = null;

  try {
    coupons = await listSignupCoupons();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Kuponlar okunamadı.";
  }

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Kuponlar"
        title="Kayıt kuponları"
        description="Esnaf kayıt formunda kullanılan indirim kodları. Kod, paket ve dönem kısıtı, tarih aralığı ve kullanım limitini buradan yönetin."
      />

      <AdminCouponsPanel initialCoupons={coupons} loadError={loadError} />
    </div>
  );
}
