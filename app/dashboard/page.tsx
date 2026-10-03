import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowUpRight,
  BellRing,
  Box,
  Eye,
  ImageOff,
  KeyRound,
  Lock,
  PackageX,
  ShoppingBasket,
  ShoppingCart,
  Tag,
  TrendingUp,
  Wallet,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import { OnlineNowCard } from "@/components/dashboard/online-now-card";
import { OrderTrendChart } from "@/components/dashboard/order-trend-chart";
import { KurumsalProgressCard } from "@/components/dashboard/kurumsal-progress-card";
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
import { formatOrderNo } from "@/lib/orders/format";
import { hasKurumsalSiteAccess } from "@/lib/kurumsal/domain";
import { getKurumsalSite } from "@/lib/storefront/kurumsal-content";
import { getTenantOrderSeries, getTenantOrdersPage, getTenantTodayOrderSummary } from "@/lib/orders/data";
import type { StorefrontOrder } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type IconType = ComponentType<{ className?: string }>;

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Ortak kart iskeleti: her bölüm aynı başlık (ikon + ad + alt satır + sağda
// bağlantı) ve aynı iç boşlukla çizilir; sayfa böylece tek sistem gibi okunur.
// ---------------------------------------------------------------------------
function SectionCard({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  icon: IconType;
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3 px-5 pb-1 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-bold text-slate-900">{title}</h2>
            {subtitle ? <p className="truncate text-xs text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        {action ? (
          <Link
            href={action.href}
            className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-emerald-700 hover:underline"
          >
            {action.label}
            <ArrowUpRight className="size-3.5" />
          </Link>
        ) : null}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </Card>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "slate",
  trend,
  spark,
}: {
  icon: IconType;
  label: string;
  value: string;
  hint: string;
  tone?: "slate" | "emerald" | "amber" | "sky";
  /** Dünle kıyas: "↑ %18" gibi; null ise gösterilmez */
  trend?: { text: string; up: boolean } | null;
  /** Son günlerin değerleri: sağ üstte küçük çizgi */
  spark?: number[];
}) {
  const tones = {
    slate: { box: "bg-slate-100 text-slate-600", line: "#94a3b8" },
    emerald: { box: "bg-emerald-50 text-emerald-600", line: "var(--color-emerald-600)" },
    amber: { box: "bg-amber-50 text-amber-600", line: "#f59e0b" },
    sky: { box: "bg-sky-50 text-sky-600", line: "#0ea5e9" },
  } as const;
  const sparkMax = spark ? Math.max(...spark, 1) : 1;
  const sparkPath = spark && spark.some((v) => v > 0)
    ? spark.map((v, i) => `${i ? "L" : "M"}${((i / (spark.length - 1)) * 86 + 2).toFixed(1)} ${(32 - (v / sparkMax) * 28).toFixed(1)}`).join(" ")
    : null;
  return (
    <Card className="relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`flex size-10 items-center justify-center rounded-xl ${tones[tone].box}`}>
        <Icon className="size-5" />
      </div>
      {sparkPath ? (
        <svg viewBox="0 0 90 36" className="absolute right-4 top-5 h-9 w-[90px]" aria-hidden>
          <path d={sparkPath} fill="none" stroke={tones[tone].line} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
      <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-0.5 truncate text-[28px] font-extrabold tabular-nums tracking-tight text-slate-900">{value}</p>
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
        {trend ? (
          <span
            className={`rounded-full px-2 py-0.5 font-bold ${
              trend.up ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-600"
            }`}
          >
            {trend.text}
          </span>
        ) : null}
        <span className="truncate">{hint}</span>
      </p>
    </Card>
  );
}

// Bugün/dün kıyası: dün 0 ise yüzde anlamsız, etiket gösterilmez.
function dayTrend(today: number, yesterday: number): { text: string; up: boolean } | null {
  if (yesterday <= 0 || today === yesterday) return null;
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  return { text: `${pct > 0 ? "↑" : "↓"} %${Math.abs(pct)}`, up: pct > 0 };
}

// Satır kutucuğu: katalog sağlığı + bildirim aboneleri aynı bileşen.
function MetricRow({
  href,
  icon: Icon,
  label,
  hint,
  value,
  warn,
}: {
  href: string;
  icon: IconType;
  label: string;
  hint: string;
  value: number;
  warn: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50"
    >
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
          warn ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
        }`}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        <span className="block truncate text-xs text-slate-500">{hint}</span>
      </span>
      <span className={`text-lg font-bold tabular-nums ${warn ? "text-amber-700" : "text-slate-400"}`}>
        {value}
      </span>
    </Link>
  );
}

function RankedBarList({
  rows,
  unit,
  emptyText,
}: {
  rows: AnalyticsProductRow[];
  unit: string;
  emptyText: string;
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">{emptyText}</p>;
  }
  const max = rows[0]?.count ?? 0;
  return (
    <ol className="space-y-3">
      {rows.map((row, i) => {
        // Ürüne SKU ile gidilir; uzun/özel karakterli adla arama "ürün
        // bulunamadı" veriyordu. SKU boşsa adın ilk iki kelimesi.
        const q = row.skuCode || row.productName.split(/\s+/).slice(0, 2).join(" ");
        return (
          <li key={row.productId}>
            <Link
              href={`/products?q=${encodeURIComponent(q)}&focus=${row.productId}`}
              className="group flex items-center gap-3 text-sm"
            >
              <span className="w-4 shrink-0 text-xs font-semibold tabular-nums text-slate-400">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-slate-900 group-hover:underline">
                {row.productName}
              </span>
              <span className="shrink-0 tabular-nums text-slate-600">
                {row.count} <span className="text-slate-400">{unit}</span>
              </span>
            </Link>
            <div className="ml-7 mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${max ? Math.max(6, Math.round((row.count / max) * 100)) : 0}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function LockedCard({ title, text }: { title: string; text: string }) {
  return (
    <Link
      href="/reports"
      className="flex items-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 transition-colors hover:bg-slate-50"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
        <Lock className="size-5" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="block text-xs text-slate-500">{text}</span>
      </span>
    </Link>
  );
}

export default async function DashboardHomePage({
  searchParams,
}: {
  searchParams: Promise<{ sihirbaz?: string }>;
}) {
  const session = await requireTenantAdminPage();
  // Ayarlar → "Sihirbazı baştan başlat" buraya ?sihirbaz=1 ile gelir.
  const { sihirbaz } = await searchParams;
  const forceWizard = sihirbaz === "1";
  const tenant = session.tenant!;
  const storeUrl = `https://${tenant.subdomain}.${appEnv.rootDomain}`;
  // Ürün ilgisi + fiyat listesi girişleri Raporlar özelliğine bağlı (plan
  // kapısı /reports ile aynı); ücretsiz planda bu kartlar kilitli görünür.
  const canUseReports = hasPlanFeature(tenant.plan, "reports");
  // Kurumsal site kartı yalnız toptancı (general) tenant'larda.
  const showKurumsal = tenant.business_type === "general";
  const [summary, ordersPage, today, presence, onboarding, report, quality, pushSubscribers, kurumsalSite, series] =
    await Promise.all([
      getTenantDashboardSummary(tenant),
      getTenantOrdersPage(tenant.id, { page: 1, pageSize: 6 }),
      getTenantTodayOrderSummary(tenant.id),
      getTenantOnlinePresence(tenant.id),
      getTenantOnboardingStatus(tenant, storeUrl),
      // Son 30 gün: en çok görüntülenen/sepete eklenen ürünler + fiyat listesi
      // girişleri. Raporlar sayfasıyla aynı hesap.
      canUseReports ? getTenantAnalyticsReport(tenant.id, "monthly") : null,
      getTenantCatalogQuality(tenant.id),
      getTenantPushSubscriberCount(tenant.id),
      showKurumsal && hasKurumsalSiteAccess(tenant) ? getKurumsalSite(tenant.id) : null,
      getTenantOrderSeries(tenant.id, 30),
    ]);

  const plan = tenant.plan ?? "baslangic";
  const capacity = getEffectiveProductLimit(plan, tenant.product_limit_addon);
  const remaining = Math.max(capacity - summary.productCount, 0);
  const recent = ordersPage.orders.slice(0, 6);
  const currency = today.currency as "TRY" | "USD" | "EUR";
  const priceListUsage = report?.priceListUsage.slice(0, 5) ?? [];
  const priceListLoginTotal = priceListUsage.reduce((t, r) => t + r.loginCount, 0);
  const last14 = series.points.slice(-14);
  // Dünle kıyas iki tarafı da aynı günlük seriden (brüt) alır; kart değeri iptaller hariç kalır.
  const todayPoint = series.points[series.points.length - 1] ?? { count: 0, amount: 0 };
  const yesterday = series.points[series.points.length - 2] ?? { count: 0, amount: 0 };
  const hasSeries = series.points.some((p) => p.count > 0);

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Kontrol Paneli"
        title="Genel Bakış"
        description="Mağazanızın güncel istatistikleri ve son hareketleri."
        action={
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
          >
            <ExternalLink className="size-4" />
            Siteyi görüntüle
          </a>
        }
      />

      {/* Kurulum sihirbazı: yeni tenant'ta ilk girişte açılır, eksik adım
          kaldıkça "%X tamamlandı" kartı burada durur. */}
      <OnboardingWizard
        status={onboarding}
        presets={getOnboardingThemePresets(tenant.sector)}
        tenantId={tenant.id}
        forceOpen={forceWizard}
      />

      {showKurumsal ? (
        <KurumsalProgressCard
          entitled={hasKurumsalSiteAccess(tenant)}
          site={kurumsalSite}
          kurumsalDomain={tenant.kurumsal_domain}
        />
      ) : null}

      {/* Üst şerit: 4 anahtar sayı */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Box}
          label="Toplam ürün"
          tone="emerald"
          value={String(summary.productCount)}
          hint={`${formatEffectiveProductLimit(plan, tenant.product_limit_addon)} kapasite · ${remaining} yer kaldı`}
        />
        <StatCard
          icon={ShoppingCart}
          label="Bugünkü sipariş"
          value={String(today.count)}
          hint="Bugün oluşturulan sipariş PDF'i"
          tone="sky"
          trend={dayTrend(todayPoint.count, yesterday.count)}
          spark={last14.map((p) => p.count)}
        />
        <StatCard
          icon={Wallet}
          label="Bugünkü tutar"
          value={formatCurrency(today.totalAmount, currency)}
          hint={`${currency} · iptaller hariç`}
          tone="amber"
          trend={dayTrend(todayPoint.amount, yesterday.amount)}
          spark={last14.map((p) => p.amount)}
        />
        <OnlineNowCard initial={presence.total} />
      </div>

      {/* Ana alan (sol, geniş) + yan sütun (sağ, dar) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-6">
          {hasSeries ? (
            <SectionCard icon={TrendingUp} title="Sipariş cirosu" subtitle="Günlük toplam · iptaller dahil">
              <OrderTrendChart points={series.points} currency={series.currency} />
            </SectionCard>
          ) : null}
          <SectionCard
            icon={ShoppingCart}
            title="Son siparişler"
            subtitle="WhatsApp'a gönderilen son sipariş PDF'leri"
            action={{ href: "/siparisler", label: "Tümünü gör" }}
          >
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Henüz sipariş bulunmuyor.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-slate-400">
                    <th className="pb-2 pr-3 font-medium">Sipariş</th>
                    <th className="pb-2 pr-3 font-medium">Ad Soyad</th>
                    <th className="pb-2 pr-3 text-right font-medium">Tutar</th>
                    <th className="pb-2 text-right font-medium">Zaman</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent.map((o: StorefrontOrder) => (
                    <tr key={o.id}>
                      <td className="py-2.5 pr-3 tabular-nums text-slate-500">{formatOrderNo(o)}</td>
                      <td className="max-w-[240px] truncate py-2.5 pr-3 font-medium text-slate-900">
                        {o.customer_name || <span className="text-slate-400">İsimsiz müşteri</span>}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-semibold tabular-nums text-slate-900">
                        {o.currency === "CATALOG"
                          ? "Katalog"
                          : formatCurrency(o.total_amount, o.currency as "TRY" | "USD" | "EUR")}
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-right text-slate-500">{fmtTime(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

          {report ? (
            <div className="grid gap-6 md:grid-cols-2">
              <SectionCard
                icon={Eye}
                title="En çok görüntülenen"
                subtitle="Son 30 gün · ilk 5 ürün"
                action={{ href: "/reports", label: "Raporlar" }}
              >
                <RankedBarList
                  rows={report.topViewedProducts}
                  unit="görüntülenme"
                  emptyText="Son 30 günde ürün görüntülenmesi yok."
                />
              </SectionCard>
              <SectionCard
                icon={ShoppingBasket}
                title="En çok sepete eklenen"
                subtitle="Son 30 gün · ilk 5 ürün"
                action={{ href: "/reports", label: "Raporlar" }}
              >
                <RankedBarList
                  rows={report.topCartProducts}
                  unit="sepete ekleme"
                  emptyText="Son 30 günde sepete ekleme yok."
                />
              </SectionCard>
            </div>
          ) : (
            <LockedCard
              title="En çok görüntülenen ve sepete eklenen ürünler"
              text="Fiyat listesi girişleriyle birlikte Raporlar özelliğinde. Paketinizi yükseltince burada görünür."
            />
          )}
        </div>

        <div className="space-y-6">
          <SectionCard
            icon={Box}
            title="Katalog sağlığı"
            subtitle="Vitrinde eksik kalan ürünler"
            action={{ href: "/products", label: "Ürünler" }}
            className="[&>div:last-child]:p-2"
          >
            <MetricRow
              href="/products?stock=out_of_stock"
              icon={PackageX}
              label="Stok dışı ürün"
              hint={quality.outOfStock > 0 ? "Vitrinde «Stok kapalı», sipariş edilemez." : "Eksik yok."}
              value={quality.outOfStock}
              warn={quality.outOfStock > 0}
            />
            <MetricRow
              href="/products?quality=no_image"
              icon={ImageOff}
              label="Görselsiz ürün"
              hint={quality.noImage > 0 ? "Görselsiz ürün daha az sepete girer." : "Eksik yok."}
              value={quality.noImage}
              warn={quality.noImage > 0}
            />
            <MetricRow
              href="/products?quality=no_price"
              icon={Tag}
              label="Fiyatsız ürün"
              hint={quality.noPrice > 0 ? "Hiçbir fiyat listesinde fiyatı yok." : "Eksik yok."}
              value={quality.noPrice}
              warn={quality.noPrice > 0}
            />
          </SectionCard>

          <SectionCard
            icon={KeyRound}
            title="Fiyat listesi girişleri"
            subtitle="Son 30 gün · şifreyle giriş"
            action={{ href: "/reports", label: "Raporlar" }}
          >
            {!report ? (
              <p className="py-4 text-center text-sm text-slate-500">Raporlar özelliğiyle birlikte gelir.</p>
            ) : priceListUsage.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">Son 30 günde şifreli giriş yok.</p>
            ) : (
              <ul className="space-y-3">
                {priceListUsage.map((row) => {
                  const pct = priceListLoginTotal
                    ? Math.round((row.loginCount / priceListLoginTotal) * 100)
                    : 0;
                  return (
                    <li key={row.priceListId}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-slate-900">{row.priceListName}</span>
                        <span className="shrink-0 tabular-nums text-slate-600">
                          {row.loginCount} <span className="text-slate-400">· %{pct}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            icon={BellRing}
            title="Bildirim aboneleri"
            subtitle="Kampanya bildirimi açan müşteriler"
            action={{ href: "/settings/campaigns", label: "Bildirim gönder" }}
            className="[&>div:last-child]:p-2"
          >
            <MetricRow
              href="/settings/campaigns"
              icon={BellRing}
              label="Abone"
              hint={pushSubscribers > 0 ? "Kampanya bildirimi gönderebilirsiniz." : "Henüz bildirim açan yok."}
              value={pushSubscribers}
              warn={false}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
