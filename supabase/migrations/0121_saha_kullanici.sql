-- Tekel saha uygulaması kullanıcıları: kişiye özel şifre (scrypt), rol admin|temsilci.
create table if not exists public.saha_kullanici (
  id uuid primary key default gen_random_uuid(),
  ad text not null unique,
  sifre text not null,
  rol text not null default 'temsilci' check (rol in ('admin','temsilci')),
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.saha_kullanici enable row level security;
