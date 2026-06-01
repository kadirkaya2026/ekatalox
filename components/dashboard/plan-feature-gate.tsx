import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  buildPackageUpgradeHref,
  getMinimumPlanForFeature,
  getPlanFeatureLabel,
  getPlanFeatureUpgradeMessage,
  getPlanLabel,
  hasPlanFeature,
  type PlanFeature,
  type TenantPlan,
} from "@/lib/billing/plans";

export function PlanFeatureGate({
  feature,
  plan,
  companyName,
  children,
}: {
  feature: PlanFeature;
  plan: TenantPlan;
  companyName: string;
  children: React.ReactNode;
}) {
  if (hasPlanFeature(plan, feature)) {
    return <>{children}</>;
  }

  const minimumPlan = getMinimumPlanForFeature(feature);

  return (
    <Card className="border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
          <Lock className="size-5" />
        </div>
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-amber-950">
              {getPlanFeatureLabel(feature)} kilitli
            </h2>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              {getPlanFeatureUpgradeMessage(feature)}
            </p>
          </div>
          <Button asChild>
            <a
              href={buildPackageUpgradeHref(companyName, feature)}
              target="_blank"
              rel="noreferrer"
            >
              {getPlanLabel(minimumPlan)} paketine yükselt
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
