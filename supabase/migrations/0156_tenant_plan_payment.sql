-- Süper admin "ödeme alındı" işareti (6 Eki 2026): paket ödemesi alınan
-- mağazalar tenant listesinde rozetle görünür. NULL = ödeme kaydı yok.
alter table public.tenants
  add column if not exists plan_paid_at timestamptz,
  add column if not exists plan_paid_note text;
