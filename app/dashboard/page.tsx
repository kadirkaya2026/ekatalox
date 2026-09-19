import Link from "next/link";
import { Box, ShoppingCart, Users } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { OnlineNowCard } from "@/components/dashboard/online-now-card";
import { Card } from "@/components/ui/card";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantOnlinePresence } from "@/lib/analytics/presence";
import {
  formatEffectiveProductLimit,
  getEffectiveProductLimit,
} from "@/lib/billing/plans";
import { getTenantDashboardSummary } from "@/lib/data";
import { getTenantCustomersOverview } from "@/lib/customers/data";
import { getTenantOrdersPage } from "@/lib/orders/data";
import { getStatusLabel } from "@/lib/orders/status";
import type { StorefrontOrder } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const STATUS_DOT: Record<string, string> = {
  new: "bg-amber-400",
  confirmed: "bg-sky-400",
  preparing: "bg-indigo-400",
  shipped: "bg-violet-400",
  delivered: "bg-emerald-500",
  cancelled: "bg-rose-500",
};

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
  const [summary, ordersPage, customers, presence] = await Promise.all([
    getTenantDashboardSummary(tenant),
    getTenantOrdersPage(tenant.id, { page: 1, pageSize: 5 }),
    getTenantCustomersOverview(tenant.id),
    getTenantOnlinePresence(tenant.id),
  ]);

  const plan = tenant.plan ?? "baslangic";
  const isTekel = Boolean(tenant.is_tekel);
  const capacity = getEffectiveProductLimit(plan, tenant.product_limit_addon);
  const remaining = Math.max(capacity - summary.productCount, 0);
  const recent = ordersPage.orders.slice(0, 5);

  const stats = [
    { label: "Toplam ürün", value: summary.productCount, icon: Box },
    { label: "Toplam sipariş", value: ordersPage.counts.all ?? ordersPage.total, icon: ShoppingCart },
    { label: "Kayıtlı müşteri", value: customers.length, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Kontrol Paneli"
        title="Genel Bakış"
        description="Mağazanızın güncel istatistikleri ve son hareketleri."
      />

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
            <p className="py-10 text-center text-sm text-slate-500">Henüz sipariş bulunmuyor.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-400">
                    <th className="pb-2 pr-3 font-medium">Sipariş</th>
                    <th className="pb-2 pr-3 font-medium">Müşteri</th>
                    <th className="pb-2 pr-3 font-medium">Tutar</th>
                    <th className="pb-2 pr-3 font-medium">Durum</th>
                    <th className="pb-2 font-medium">Zaman</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o: StorefrontOrder) => (
                    <tr key={o.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 pr-3 font-semibold text-slate-900">
                        #{o.order_no ?? o.order_number}
                      </td>
                      <td className="max-w-[160px] truncate py-2.5 pr-3 text-slate-600">
                        {o.customer_name || "—"}
                      </td>
                      <td className="py-2.5 pr-3 font-medium text-slate-900">
                        {formatCurrency(o.total_amount, o.currency as "TRY" | "USD" | "EUR")}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <span className={`size-2 rounded-full ${STATUS_DOT[o.status] ?? "bg-slate-300"}`} />
                          {getStatusLabel(o.status, { isTekel })}
                        </span>
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
