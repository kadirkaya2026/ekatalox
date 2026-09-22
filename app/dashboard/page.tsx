import Link from "next/link";
import { Box, ShoppingCart, Wallet } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import { OnlineNowCard } from "@/components/dashboard/online-now-card";
import { Card } from "@/components/ui/card";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantOnlinePresence } from "@/lib/analytics/presence";
import {
  formatEffectiveProductLimit,
  getEffectiveProductLimit,
} from "@/lib/billing/plans";
import { getTenantDashboardSummary } from "@/lib/data";
import { appEnv } from "@/lib/env";
import { getOnboardingThemePresets, getTenantOnboardingStatus } from "@/lib/onboarding/status";
import { getTenantOrdersPage, getTenantTodayOrderSummary } from "@/lib/orders/data";
import type { StorefrontOrder } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardHomePage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const storeUrl = `https://${tenant.subdomain}.${appEnv.rootDomain}`;
  const [summary, ordersPage, today, presence, onboarding] = await Promise.all([
    getTenantDashboardSummary(tenant),
    getTenantOrdersPage(tenant.id, { page: 1, pageSize: 5 }),
    getTenantTodayOrderSummary(tenant.id),
    getTenantOnlinePresence(tenant.id),
    getTenantOnboardingStatus(tenant, storeUrl),
  ]);

  const plan = tenant.plan ?? "baslangic";
  const capacity = getEffectiveProductLimit(plan, tenant.product_limit_addon);
  const remaining = Math.max(capacity - summary.productCount, 0);
  const recent = ordersPage.orders.slice(0, 5);

  const stats = [
    { label: "Toplam ürün", value: String(summary.productCount), icon: Box },
    { label: "Bugünkü sipariş", value: String(today.count), icon: ShoppingCart },
    {
      label: "Bugünkü tutar",
      value: formatCurrency(today.totalAmount, today.currency as "TRY" | "USD" | "EUR"),
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Kontrol Paneli"
        title="Genel Bakış"
        description="Mağazanızın güncel istatistikleri ve son hareketleri."
      />

      {/* Kurulum sihirbazı: yeni tenant'ta ilk girişte açılır, eksik adım
          kaldıkça "%X tamamlandı" kartı burada durur. */}
      <OnboardingWizard status={onboarding} presets={getOnboardingThemePresets()} tenantId={tenant.id} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <s.icon className="size-5" />
            </div>
            <p className="mt-4 text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{s.value}</p>
          </Card>
        ))}
        <OnlineNowCard initial={presence.total} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Son siparişler</h2>
            <Link href="/siparisler" className="text-sm font-semibold text-emerald-700 hover:underline">
              Tümünü gör
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              {today.count > 0 ? (
                <>
                  Sipariş listesi yalnız telefon numarası alınan siparişlerde oluşur. Siparişleri
                  burada görmek için{" "}
                  <Link href="/settings/cart" className="font-semibold text-emerald-700 hover:underline">
                    Sepet Ayarları
                  </Link>
                  &apos;ndan Telefon alanını açın.
                </>
              ) : (
                "Henüz sipariş bulunmuyor."
              )}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-400">
                    <th className="pb-2 pr-3 font-medium">Ad Soyad</th>
                    <th className="pb-2 pr-3 font-medium">Tutar</th>
                    <th className="pb-2 font-medium">Zaman</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o: StorefrontOrder) => (
                    <tr key={o.id} className="border-b border-slate-50 last:border-0">
                      <td className="max-w-[220px] truncate py-2.5 pr-3 font-semibold text-slate-900">
                        {o.customer_name || "—"}
                      </td>
                      <td className="py-2.5 pr-3 font-medium text-slate-900">
                        {formatCurrency(o.total_amount, o.currency as "TRY" | "USD" | "EUR")}
                      </td>
                      <td className="py-2.5 text-slate-500">{fmtTime(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-900">Sistem durumu</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-3">
              <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Katalog aktif</p>
                <p className="text-xs text-slate-500">Müşterileriniz mağazanıza erişebilir.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Box className="mt-0.5 size-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Ürün kapasitesi</p>
                <p className="text-xs text-slate-500">
                  {summary.productCount} / {formatEffectiveProductLimit(plan, tenant.product_limit_addon)} kullanıldı ·{" "}
                  <span className="font-semibold text-emerald-700">{remaining}</span> kaldı
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
