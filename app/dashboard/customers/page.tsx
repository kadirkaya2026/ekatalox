import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { CustomersManager } from "@/components/dashboard/customers-manager";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantCustomersOverview } from "@/lib/customers/data";

export default async function TenantCustomersPage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;

  if (tenant.business_type !== "market") {
    return (
      <div className="space-y-6">
        <Header
          eyebrow="Raporlar"
          title="Müşteriler"
          description="Bu özellik sadece market tipi hesaplar için kullanılabilir."
        />
        <Card className="p-6 text-sm text-slate-600">
          Hesabınız müşteri raporlarına sahip değil.
        </Card>
      </div>
    );
  }

  const customers = await getTenantCustomersOverview(tenant.id);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Raporlar"
        title="Müşteriler"
        description="WhatsApp ile sipariş veren müşterilerinizin isim, adres ve telefon bilgileri; sipariş sayıları ve geçmişleri burada listelenir."
      />
      <CustomersManager initialCustomers={customers} />
    </div>
  );
}
