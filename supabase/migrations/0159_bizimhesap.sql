-- BizimHesap entegrasyonu (6 Eki 2026, Nailport isteği): vitrinden fiyatlı
-- sipariş oluşunca BizimHesap'a satış belgesi gönderilir (B2B API addinvoice).
-- Firma kimliği GİZLİ: ayrı tabloda, RLS açık ve politika yok → yalnız
-- service role okur; tenants satırıyla tarayıcıya hiç gitmez.
create table if not exists public.tenant_bizimhesap (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  firm_id text not null,
  vat_rate numeric(5,2) not null default 20,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tenant_bizimhesap enable row level security;

alter table public.orders
  add column if not exists bizimhesap_guid text,
  add column if not exists bizimhesap_error text,
  add column if not exists bizimhesap_sent_at timestamptz;
