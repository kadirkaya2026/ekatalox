-- 0133 Kurumsal site (25 Eyl 2026)
-- tenant_kurumsal_sites: tenant'ın herkese açık /kurumsal sayfasının içeriği
-- (panelde sihirbazla doldurulur). content jsonb; şeması
-- lib/kurumsal/schema.ts'deki zod şemasıdır.
-- dealer_applications: /kurumsal sayfasındaki bayi başvuru formundan gelen
-- başvurular (panelde "Bayi Başvuruları").
-- İki tablo da yalnız service role (API rotaları) ile okunur/yazılır.

create table if not exists public.tenant_kurumsal_sites (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  is_published boolean not null default false,
  content jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.tenant_kurumsal_sites enable row level security;
-- Politika yok: yalnız service role okur/yazar.

create table if not exists public.dealer_applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  company_name text not null,
  contact_name text not null,
  phone text not null,
  city text,
  note text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'approved', 'rejected')),
  source text not null default 'kurumsal',
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dealer_applications_tenant_idx
  on public.dealer_applications (tenant_id, created_at desc);

alter table public.dealer_applications enable row level security;
-- Politika yok: yalnız service role okur/yazar.
