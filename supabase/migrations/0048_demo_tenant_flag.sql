-- Demo/gösterim tenant'ları işaretlemek için: bu tenant'ların yönetici
-- panelinde değişiklik kaydedilemez (bkz. lib/tenancy/guards.ts).
alter table public.tenants
  add column if not exists is_demo boolean not null default false;

update public.tenants
  set is_demo = true
  where subdomain = 'demo';
