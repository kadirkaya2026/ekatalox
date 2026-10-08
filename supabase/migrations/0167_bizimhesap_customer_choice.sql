-- BizimHesap onay penceresi (8 Eki 2026, Lucatech): personel siparişi onaylarken
-- BizimHesap carisini seçer; taslak doğrudan o cariye düşer.
alter table public.orders
  add column if not exists bizimhesap_customer_id text,
  add column if not exists bizimhesap_customer_title text;

-- Bayi → BizimHesap carisi hafızası: aynı bayinin sonraki siparişinde cari hazır gelir.
-- link_key: 'kod:<access_code_id>' | 'tel:<son 10 hane>' | 'ad:<normalize ad>'.
create table if not exists public.bizimhesap_customer_links (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  link_key text not null,
  bh_customer_id text not null,
  bh_customer_title text,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, link_key)
);
-- Yalnız service role okur/yazar (tenant_bizimhesap ile aynı yaklaşım).
alter table public.bizimhesap_customer_links enable row level security;
