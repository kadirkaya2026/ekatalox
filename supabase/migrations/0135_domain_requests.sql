-- 0135 Alan adı talepleri (25 Eyl 2026)
-- Kurumsal site sihirbazındaki "Yeni alan adı seç" adımından gelen talepler:
-- tenant, Vercel'de boşta görünen bir alan adı seçer; satın alma ve bağlama
-- eKatalox ekibince yapılır (tenants.kurumsal_domain o zaman yazılır).
-- Durumlar: new (bekliyor) → purchased (alındı) / cancelled (iptal).
-- Yalnız service role okur/yazar (politika yok).

create table if not exists public.domain_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  domain text not null,
  price_usd numeric,
  period_years int,
  status text not null default 'new'
    check (status in ('new', 'purchased', 'cancelled')),
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists domain_requests_tenant_idx
  on public.domain_requests (tenant_id, created_at desc);

alter table public.domain_requests enable row level security;
-- Politika yok: yalnız service role okur/yazar.
