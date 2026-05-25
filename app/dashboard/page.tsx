import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantDashboardSummary } from "@/lib/data";

export default async function DashboardHomePage() {
  const session = await requireTenantAdminPage();
  const summary = await getTenantDashboardSummary(session.tenant!);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Tenant Dashboard"
        title={`${summary.tenant.company_name} yönetim paneli`}
        description="Ürünlerinizi, fiyat katmanlarınızı ve mağaza erişim şifrelerinizi tek panelden yönetin."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Mevcut ürün</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.productCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Paket limiti</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {summary.tenant.max_product_limit}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Aktif erişim kodu</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {summary.activeCodeCount}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">Ürün yönetimi</h2>
          <p className="mt-2 text-sm text-slate-600">
            CSV yükleyin, yeni ürün ekleyin, görsel yükleyin ve fiyatları topluca yönetin.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Ürünlere git
          </Link>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">Erişim şifreleri</h2>
          <p className="mt-2 text-sm text-slate-600">
            3 fiyat katmanına göre ayrı şifreler tanımlayın ve gerektiğinde kaldırın.
          </p>
          <Link
            href="/access-codes"
            className="mt-5 inline-flex rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Şifreleri yönet
          </Link>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">Storefront ayarları</h2>
          <p className="mt-2 text-sm text-slate-600">
            WhatsApp yönlendirme numaranızı kontrol edin ve tenant bilgilerinizi görüntüleyin.
          </p>
          <Link
            href="/settings"
            className="mt-5 inline-flex rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Ayarlara git
          </Link>
        </Card>
      </div>
    </div>
  );
}