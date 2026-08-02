import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatEffectiveProductLimit, formatProductLimit, getPlanLabel } from "@/lib/billing/plans";
import type { TenantWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";

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
}: {
  initialTenants: TenantWithRelations[];
}) {
  const tenants = initialTenants;
  const totals = {
    total: tenants.length,
    active: tenants.filter((tenant) => tenant.status === "active").length,
    suspended: tenants.filter((tenant) => tenant.status === "suspended").length,
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
        <h2 className="text-lg font-semibold text-slate-900">Tenant’lar</h2>
        <p className="mt-1 text-sm text-slate-600">
          Detayları görmek ve düzenlemek için bir tenant’ın adına tıklayın.
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

                <p className="text-sm font-medium text-slate-700 md:text-right">
                  {formatProductLimit(tenant.product_count ?? 0)} ürün yüklü •{" "}
                  {formatProductLimit(tenant.monthly_visitor_count ?? 0)} ziyaretçi (bu ay)
                </p>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
