-- Ücretli paket denemesi (25 Eyl 2026).
-- Kayıtta ücretli paket (starter/professional/corporate) seçen toptancı o
-- paketle PAID_PLAN_TRIAL_DAYS (lib/billing/plan-trial.ts, 14 gün) açılır.
-- Süre dolduğunda /api/cron/plan-trial mağazayı KAPATMADAN Ücretsiz plana
-- düşürür. Eski Esnaf denemesinden (trial_ends_at: süre bitince vitrin
-- kapanır) bilerek ayrı tutulur.
-- Süper admin "Ödeme alındı" dediğinde plan_trial_ends_at null olur ve paket
-- kalıcılaşır.

alter table public.tenants
  add column if not exists plan_trial_ends_at timestamptz,
  add column if not exists plan_trial_reminder_sent_at timestamptz;

create index if not exists tenants_plan_trial_ends_at_idx
  on public.tenants (plan_trial_ends_at)
  where plan_trial_ends_at is not null;
