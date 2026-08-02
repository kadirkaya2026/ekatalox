import { AdminNewTenantForm } from "@/components/admin/admin-new-tenant-form";
import { Header } from "@/components/dashboard/header";

export default function AdminNewTenantPage() {
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Yeni Tenant"
        title="Hızlı tenant oluştur"
        description="Sadece ad soyad, telefon (opsiyonel) ve alt alan adını girin; geri kalanı otomatik oluşturulur."
      />

      <AdminNewTenantForm />
    </div>
  );
}
