import { TRIAL_DURATION_DAYS } from "@/lib/billing/trial";
import type { Tenant } from "@/lib/types";

export const PLAN_PERIOD_MONTHS = 12;

function addMonthsToDate(base: Date, months: number): Date {
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next;
}

/** Paket onayında başlayan 12 aylık dönemin bitişi. */
export function getPlanPeriodEnd(from: Date = new Date()): string {
  return addMonthsToDate(from, PLAN_PERIOD_MONTHS).toISOString();
}

/**
 * Hediye ay ekleme: mevcut bitiş ileri bir tarihse onun üzerine, süresi
 * geçmişse (veya hiç yoksa) bugünden itibaren eklenir.
 */
export function extendPlanExpiry(
  currentExpiry: string | null | undefined,
  months: number,
): string {
  const now = new Date();
  const base =
    currentExpiry && new Date(currentExpiry).getTime() > now.getTime()
      ? new Date(currentExpiry)
      : now;
  return addMonthsToDate(base, months).toISOString();
}

export interface MembershipPeriod {
  start: Date;
  end: Date;
  isTrial: boolean;
}

/**
 * Ayarlar sayfasında gösterilen üyelik başlangıç/bitişini belirler:
 * deneme hesabında 14 günlük pencere, paket onaylıysa kayıtlı dönem,
 * eski kayıtlarda created_at + 1 yıl.
 */
export function resolveMembershipPeriod(
  tenant: Pick<
    Tenant,
    "trial_ends_at" | "plan_started_at" | "plan_expires_at" | "created_at"
  >,
): MembershipPeriod {
  if (tenant.trial_ends_at) {
    const end = new Date(tenant.trial_ends_at);
    const start = new Date(end);
    start.setDate(start.getDate() - TRIAL_DURATION_DAYS);
    return { start, end, isTrial: true };
  }

  if (tenant.plan_expires_at) {
    const start = new Date(tenant.plan_started_at ?? tenant.created_at);
    return { start, end: new Date(tenant.plan_expires_at), isTrial: false };
  }

  const start = new Date(tenant.created_at);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  return { start, end, isTrial: false };
}
