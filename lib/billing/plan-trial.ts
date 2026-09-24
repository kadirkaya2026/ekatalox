// Ücretli paket denemesi (25 Eyl 2026, 0132). Kayıtta ücretli toptan paketi
// seçen mağaza o paketle bu kadar gün açılır; süre dolunca Ücretsiz plana
// düşer (mağaza kapanmaz). Esnaf denemesi (lib/billing/trial.ts,
// trial_ends_at) ayrı bir kavramdır.
import type { Tenant } from "@/lib/types";

export const PAID_PLAN_TRIAL_DAYS = 14;

/** Bitişe bu kadar gün kala müşteriye hatırlatma e-postası gider. */
export const PAID_PLAN_TRIAL_REMINDER_DAYS = 3;

export function getPlanTrialEndDate(from: Date = new Date()): string {
  const end = new Date(from);
  end.setDate(end.getDate() + PAID_PLAN_TRIAL_DAYS);
  return end.toISOString();
}

export function getPlanTrialDaysLeft(tenant: Pick<Tenant, "plan_trial_ends_at">): number | null {
  if (!tenant.plan_trial_ends_at) return null;
  const diffMs = new Date(tenant.plan_trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 86_400_000));
}
