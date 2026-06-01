export type TenantPlan = "baslangic" | "profesyonel" | "kurumsal";

export type MaxProductLimit = 500 | 1000 | 2500;

export interface PlanOption {
  id: TenantPlan;
  name: string;
  maxProductLimit: MaxProductLimit;
}

export const PLAN_OPTIONS: PlanOption[] = [
  { id: "baslangic", name: "Başlangıç", maxProductLimit: 500 },
  { id: "profesyonel", name: "Profesyonel", maxProductLimit: 1000 },
  { id: "kurumsal", name: "Kurumsal", maxProductLimit: 2500 },
];

const planById = new Map(PLAN_OPTIONS.map((plan) => [plan.id, plan]));
const planByLimit = new Map(PLAN_OPTIONS.map((plan) => [plan.maxProductLimit, plan]));

export const TENANT_PLAN_IDS = PLAN_OPTIONS.map((plan) => plan.id) as [
  TenantPlan,
  ...TenantPlan[],
];

export function getPlanById(planId: TenantPlan): PlanOption {
  const plan = planById.get(planId);

  if (!plan) {
    throw new Error(`Unknown tenant plan: ${planId}`);
  }

  return plan;
}

export function getPlanLabel(planId: TenantPlan): string {
  return getPlanById(planId).name;
}

export function getLimitForPlan(planId: TenantPlan): MaxProductLimit {
  return getPlanById(planId).maxProductLimit;
}

export function getPlanForLimit(limit: MaxProductLimit): TenantPlan {
  const plan = planByLimit.get(limit);

  if (!plan) {
    throw new Error(`Unknown product limit: ${limit}`);
  }

  return plan.id;
}

export function formatProductLimit(limit: number): string {
  return limit.toLocaleString("tr-TR");
}

export function formatPlanSummary(planId: TenantPlan): string {
  const plan = getPlanById(planId);
  return `${plan.name} • ${formatProductLimit(plan.maxProductLimit)} ürün`;
}

export function formatPlanCapacityFeature(planId: TenantPlan): string {
  return `${formatProductLimit(getLimitForPlan(planId))} Ürün Kapasitesi`;
}

export function formatPlanCapacityDescription(planId: TenantPlan): string {
  return `${formatProductLimit(getLimitForPlan(planId))} ürün kapasitesi`;
}
