import Link from "next/link";
import { BellRing, Box, Eye, ImageOff, KeyRound, Lock, PackageX, ShoppingBasket, ShoppingCart, Tag, Wallet } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import { OnlineNowCard } from "@/components/dashboard/online-now-card";
import { Card } from "@/components/ui/card";
import { requireTenantAdminPage } from "@/lib/auth/session";
import { getTenantOnlinePresence } from "@/lib/analytics/presence";
import { getTenantAnalyticsReport, type AnalyticsProductRow } from "@/lib/analytics/queries";
import {
  formatEffectiveProductLimit,
  getEffectiveProductLimit,
  hasPlanFeature,
} from "@/lib/billing/plans";
import { getTenantDashboardSummary } from "@/lib/data";
import { getTenantCatalogQuality, getTenantPushSubscriberCount } from "@/lib/dashboard/overview";
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

function TopProductsCard({
  title,
  icon: Icon,
  unit,
  rows,
  emptyText,
}: {
  title: string;
  icon: typeof Eye;
  unit: string;
  rows: AnalyticsProductRow[];
  emptyText: string;
}) {
  const max = rows[0]?.count ?? 0;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Icon className="size-4 text-slate-400" />
          {title}
        </h2>
        <Link href="/reports" className="text-sm font-semibold text-emerald-700 hover:underline">
          Raporlar
        </Link>
      </div>
      <p className="mt-1 text-xs text-slate-500">Son 30 gün · ilk 5 ürün</p>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">{emptyText}</p>
      ) : (
        <ol className="mt-4 space-y-2.5">
          {rows.map((row, i) => (
            <li key={row.productId}>
              <Link
                href={`/products?q=${encodeURIComponent(row.productName)}&focus=${row.productId}`}
                className="flex items-center gap-3 text-sm"
              >
                <span className="w-4 shrink-0 text-xs font-semibold tabular-nums text-slate-400">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-slate-900 hover:underline">
                  {row.productName}
                </span>
                <span className="shrink-0 tabular-nums text-slate-600">
                  {row.count} <span className="text-slate-400">{unit}</span>
                </span>
              </Link>
              <div className="ml-7 mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${max ? Math.max(6, Math.round((row.count / max) * 100)) : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export default async function DashboardHomePage() {
  const session = await requireTenantAdminPage();
  const tenant = session.tenant!;
  const storeUrl = `https://${tenant.subdomain}.${appEnv.rootDomain}`;
  // Ürün ilgisi + fiyat listesi girişleri Raporlar özelliğine bağlı (plan
  // kapısı /reports ile aynı); ücretsiz planda bu kartlar kilitli görünür.
  const canUseReports = hasPlanFeature(tenant.plan, "reports");
  const [summary, ordersPage, today, presence, onboarding, report, quality, pushSubscribers] =
    await Promise.all([
      getTenantDashboardSummary(tenant),
      getTenantOrdersPage(tenant.id, { page: 1, pageSize: 5 }),
      getTenantTodayOrderSummary(tenant.id),
      getTenantOnlinePresence(tenant.id),
      getTenantOnboardingStatus(tenant, storeUrl),
      // Son 30 gün: en çok görüntülenen/sepete eklenen ürünler + fiyat listesi
      // girişleri. Raporlar sayfasıyla aynı hesap.
      canUseReports ? getTenantAnalyticsReport(tenant.id, "monthly") : null,
      getTenantCatalogQuality(tenant.id),
      getTenantPushSubscriberCount(tenant.id),
    ]);

  const plan = tenant.plan ?? "baslangic";
  const capacity = getEffectiveProductLimit(plan, tenant.product_limit_addon);
  const remaining = Math.max(capacity - summary.productCount, 0);
  const recent = ordersPage.orders.slice(0, 5);
  const qualityRows = [
    {
      label: "Stok dışı ürün",
      value: quality.outOfStock,
      icon: PackageX,
      href: "/products?stock=out_of_stock",
      hint: "Vitrinde «Stok kapalı» görünür, sipariş edilemez.",
    },
    {
      label: "Görselsiz ürün",
      value: quality.noImage,
      icon: ImageOff,
      href: "/products",
      hint: "Görseli olmayan ürün daha az sepete girer.",
    },
    {
      label: "Fiyatsız ürün",
      value: quality.noPrice,
      icon: Tag,
      href: "/products",
      hint: "Hiçbir fiyat listesinde fiyatı yok.",
    },
  ];
  const priceListUsage = report?.priceListUsage.slice(0, 5) ?? [];
  const priceListLoginTotal = priceListUsage.reduce((t, r) => t + r.loginCount, 0);

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
            <p className="py-10 text-center text-sm text-slate-500">Henüz sipariş bulunmuyor.</p>
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
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Katalog sağlığı</h2>
            <Link href="/products" className="text-sm font-semibold text-emerald-700 hover:underline">
              Ürünler
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {summary.productCount} / {formatEffectiveProductLimit(plan, tenant.product_limit_addon)} ürün ·{" "}
            <span className="font-semibold text-emerald-700">{remaining}</span> yer kaldı
          </p>
          <div className="mt-4 space-y-3">
            {qualityRows.map((row) => (
              <Link
                key={row.label}
                href={row.href}
                className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 transition-colors hover:bg-slate-50"
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                    row.value > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  <row.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">{row.label}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {row.value > 0 ? row.hint : "Eksik yok."}
                  </span>
                </span>
                <span
                  className={`text-lg font-bold tabular-nums ${row.value > 0 ? "text-amber-700" : "text-slate-400"}`}
                >
                  {row.value}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Son 30 gün: ürün ilgisi + fiyat listesi girişleri + bildirim aboneleri */}
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {report ? (
          <>
            <TopProductsCard
              title="En çok görüntülenen"
              icon={Eye}
              unit="görüntülenme"
              rows={report.topViewedProducts}
              emptyText="Son 30 günde ürün görüntülenmesi yok."
            />
            <TopProductsCard
              title="En çok sepete eklenen"
              icon={ShoppingBasket}
              unit="sepete ekleme"
              rows={report.topCartProducts}
              emptyText="Son 30 günde sepete ekleme yok."
            />
          </>
        ) : (
          <Link
            href="/reports"
            className="flex items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 transition-colors hover:bg-slate-50 lg:col-span-2"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
              <Lock className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                En çok görüntülenen ve sepete eklenen ürünler
              </span>
              <span className="block text-xs text-slate-500">
                Fiyat listesi girişleriyle birlikte Raporlar özelliğinde. Paketinizi yükseltince burada görünür.
              </span>
            </span>
          </Link>
        )}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <KeyRound className="size-4 text-slate-400" />
              Fiyat listesi girişleri
            </h2>
            <Link href="/reports" className="text-sm font-semibold text-emerald-700 hover:underline">
              Raporlar
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">Son 30 gün · şifreyle giriş sayısı</p>
          {!report ? (
            <p className="py-6 text-center text-sm text-slate-500">Raporlar özelliğiyle birlikte gelir.</p>
          ) : priceListUsage.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Son 30 günde şifreli giriş yok.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {priceListUsage.map((row) => {
                const pct = priceListLoginTotal ? Math.round((row.loginCount / priceListLoginTotal) * 100) : 0;
                return (
                  <li key={row.priceListId}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-slate-900">{row.priceListName}</span>
                      <span className="shrink-0 tabular-nums text-slate-600">
                        {row.loginCount} <span className="text-slate-400">· %{pct}</span>
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/settings/campaigns"
            className="mt-5 flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 transition-colors hover:bg-slate-50"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <BellRing className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-900">Bildirim aboneleri</span>
              <span className="block text-xs text-slate-500">
                {pushSubscribers > 0 ? "Kampanya bildirimi gönderebilirsiniz." : "Henüz bildirim açan yok."}
              </span>
            </span>
            <span className="text-lg font-bold tabular-nums text-slate-900">{pushSubscribers}</span>
          </Link>
        </Card>
      </div>
    </div>
  );
}
