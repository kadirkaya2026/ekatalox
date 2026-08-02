import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { requireTenantAdminPage } from "@/lib/auth/session";
import {
  formatEffectiveProductLimit,
  formatPriceListLimit,
  formatProductLimit,
  getLimitForPlan,
} from "@/lib/billing/plans";
import { getTenantDashboardSummary } from "@/lib/data";

export default async function DashboardHomePage() {
  const session = await requireTenantAdminPage();
  const summary = await getTenantDashboardSummary(session.tenant!);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Kontrol Paneli"
        title={`${summary.tenant.company_name} yönetim paneli`}
        description="Ürünlerinizi, fiyat katmanlarınızı ve mağaza erişim şifrelerinizi tek panelden yönetin."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Mevcut ürün</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.productCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Toplam yüklenebilecek ürün</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {formatEffectiveProductLimit(summary.tenant.plan ?? "baslangic", summary.tenant.product_limit_addon)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatProductLimit(getLimitForPlan(summary.tenant.plan ?? "baslangic"))} paket
            {summary.tenant.product_limit_addon ? (
              <>
                {" + "}
                <span className="font-semibold text-amber-600">
                  {formatProductLimit(summary.tenant.product_limit_addon)} hediye
                </span>
              </>
            ) : null}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Fiyat Listesi Sınırı</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {formatPriceListLimit(summary.tenant.plan ?? "baslangic")}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
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
          <h2 className="text-lg font-semibold text-slate-900">Ürün kategorileri</h2>
          <p className="mt-2 text-sm text-slate-600">
            Kategori oluşturun ve ürün listenizde kategori bazlı filtreleme sunun.
          </p>
          <Link
            href="/categories"
            className="mt-5 inline-flex rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Kategorileri yönet
          </Link>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">Mağaza ayarları</h2>
          <p className="mt-2 text-sm text-slate-600">
            WhatsApp yönlendirme numaranızı kontrol edin ve üyelik bilgilerinizi görüntüleyin.
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