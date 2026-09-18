-- Tekel saha uygulaması: ilçe başına ziyaret işaretleri (bayiId -> {d,n,t}).
-- Yalnız service role yazar/okur (API: app/api/saha/[token]/route.ts).
create table if not exists public.saha_ziyaret (
  ilce text primary key,
  kayitlar jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.saha_ziyaret enable row level security;
