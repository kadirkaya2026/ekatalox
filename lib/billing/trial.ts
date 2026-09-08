import { ESNAF_TRIAL_DAYS } from "@/lib/billing/esnaf-plans";
import type { Tenant } from "@/lib/types";

// Deneme süresi 30 gün (Esnaf paketleri, Eyl 2026) — tek kaynak
// lib/billing/esnaf-plans.ts ESNAF_TRIAL_DAYS.
export const TRIAL_DURATION_DAYS = ESNAF_TRIAL_DAYS;

export function getTrialEndDate(from: Date = new Date()): string {
  const end = new Date(from);
  end.setDate(end.getDate() + TRIAL_DURATION_DAYS);
  return end.toISOString();
}

export function isTrialTenant(tenant: Pick<Tenant, "trial_ends_at">): boolean {
  return Boolean(tenant.trial_ends_at);
}

export function isTrialExpired(tenant: Pick<Tenant, "trial_ends_at">): boolean {
  if (!tenant.trial_ends_at) {
    return false;
  }

  return new Date(tenant.trial_ends_at).getTime() < Date.now();
}

export function getTrialDaysLeft(
  tenant: Pick<Tenant, "trial_ends_at">,
): number | null {
  if (!tenant.trial_ends_at) {
    return null;
  }

  const diffMs = new Date(tenant.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}
