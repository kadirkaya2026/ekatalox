-- Üyelik dönemi: süper admin bir paketi onayladığında (Paketi kaydet)
-- o günden itibaren 12 aylık dönem başlar; hediye aylar plan_expires_at'i
-- ileri taşır. Boş değerler eski davranışa (created_at + 1 yıl) düşer.
alter table public.tenants
  add column if not exists plan_started_at timestamptz,
  add column if not exists plan_expires_at timestamptz;
