import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatEffectiveProductLimit, formatProductLimit, getPlanLabel } from "@/lib/billing/plans";
import type { TenantWithRelations } from "@/lib/types";
import { cn, formatDate, formatTimeAgo } from "@/lib/utils";

// Paket rozeti: listede hangi pakette olduğu tek bakışta görünsün (6 Eki 2026).
const PLAN_BADGE_CLASS: Record<string, string> = {
  free: "bg-slate-200 text-slate-700",
  starter: "bg-sky-600 text-white",
  professional: "bg-violet-600 text-white",
  corporate: "bg-amber-500 text-white",
};

function getPlanBadgeClass(plan: string | null | undefined) {
  return PLAN_BADGE_CLASS[plan ?? ""] ?? "bg-slate-500 text-white";
}

function getTrialBadge(trialEndsAt: string | null | undefined) {
  if (!trialEndsAt) {
    return null;
  }

  const diffMs = new Date(trialEndsAt).getTime() - Date.now();
  const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  if (daysLeft <= 0) {
    return { label: "Deneme süresi doldu", className: "bg-rose-50 text-rose-700" };
  }

  return {
    label: `Deneme — ${daysLeft} gün kaldı`,
    className: "bg-amber-50 text-amber-700",
  };
}

export function AdminTenantsManager({
  initialTenants,
  activeTab = "musteriler",
}: {
  initialTenants: TenantWithRelations[];
  activeTab?: "musteriler" | "demo";
}) {
  // Demo Mağazalar sekmesi (0158): bizim açtığımız tanıtım mağazaları ayrı listelenir;
  // üstteki sayılar yalnız gerçek müşterileri sayar.
  const customerTenants = initialTenants.filter((tenant) => !tenant.is_internal_demo);
  const demoTenants = initialTenants.filter((tenant) => tenant.is_internal_demo);
  const tenants = activeTab === "demo" ? demoTenants : customerTenants;
  const totals = {
    total: customerTenants.length,
    active: customerTenants.filter((tenant) => tenant.status === "active").length,
    suspended: customerTenants.filter((tenant) => tenant.status === "suspended").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Toplam tenant</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totals.total}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Aktif tenant</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{totals.active}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Askıya alınan tenant</p>
          <p className="mt-2 text-3xl font-bold text-slate-700">{totals.suspended}</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Yeni tenant oluştur</h2>
            <p className="mt-1 text-sm text-slate-600">
              Ad soyad, telefon (opsiyonel) ve alt alan adıyla hızlı kurulum yapın.
            </p>
          </div>
          <Button asChild href="/admin/tenants/new">
            Yeni Tenant Oluştur
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "musteriler", label: "Müşteriler", href: "?", count: customerTenants.length },
              { key: "demo", label: "Demo Mağazalar", href: "?sekme=demo", count: demoTenants.length },
            ] as const
          ).map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                activeTab === tab.key
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {tab.label} ({tab.count})
            </Link>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {activeTab === "demo"
            ? "Bizim açtığımız tanıtım mağazaları. Detayda “Müşterilere taşı” ile geri alınır."
            : "Detayları görmek ve düzenlemek için bir tenant’ın adına tıklayın."}
        </p>

        <div className="mt-4 divide-y divide-slate-100">
          {tenants.map((tenant) => {
            const trialBadge = getTrialBadge(tenant.trial_ends_at);

            return (
              <Link
                key={tenant.id}
                href={`/admin/tenants/${tenant.id}`}
                className="flex flex-col gap-2 py-4 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between md:gap-4 md:px-2"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-base font-semibold text-emerald-700 underline-offset-4 hover:underline">
                      {tenant.company_name}
                    </span>
                    <Badge
                      className={cn(
                        "px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
                        getPlanBadgeClass(tenant.plan),
                      )}
                    >
                      {getPlanLabel(tenant.plan ?? "baslangic")}
                    </Badge>
                    <Badge
                      className={cn(
                        tenant.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {tenant.status === "active" ? "Aktif" : "Askıda"}
                    </Badge>
                    {trialBadge ? (
                      <Badge className={trialBadge.className}>{trialBadge.label}</Badge>
                    ) : null}
                    {tenant.plan_paid_at && tenant.plan !== "free" ? (
                      <span title={tenant.plan_paid_note ?? "Paket ödemesi alındı"}>
                        <Badge className="inline-flex items-center gap-1 bg-emerald-600 text-white">
                          <BadgeCheck className="size-3.5" />
                          Ödeme alındı
                        </Badge>
                      </span>
                    ) : null}
                    {tenant.product_limit_addon ? (
                      <Badge className="bg-amber-50 text-amber-700">
                        +{formatProductLimit(tenant.product_limit_addon)} hediye
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {tenant.subdomain}.ekatalox.com • {getPlanLabel(tenant.plan ?? "baslangic")} •{" "}
                    {formatEffectiveProductLimit(tenant.plan ?? "baslangic", tenant.product_limit_addon ?? 0)} ürün
                  </p>
                </div>

                <div className="md:text-right">
                  <p className="text-sm font-medium text-slate-700">
                    {formatProductLimit(tenant.product_count ?? 0)} ürün yüklü •{" "}
                    {formatProductLimit(tenant.monthly_visitor_count ?? 0)} ziyaretçi (bu ay)
                  </p>
                  {tenant.plan && tenant.plan !== "free" && tenant.plan_trial_ends_at ? (
                    <p className="mt-0.5 text-xs font-medium text-amber-700">
                      Deneme bitişi: {formatDate(tenant.plan_trial_ends_at)}
                    </p>
                  ) : tenant.plan && tenant.plan !== "free" && tenant.plan_expires_at ? (
                    <p className="mt-0.5 text-xs font-medium text-slate-700">
                      Paket bitişi: {formatDate(tenant.plan_expires_at)}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-slate-500">
                    Panel: {formatTimeAgo(tenant.last_panel_seen_at, "henüz ziyaret yok")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
