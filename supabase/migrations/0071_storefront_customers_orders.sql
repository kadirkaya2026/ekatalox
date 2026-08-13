-- Market tipi tenant'ların WhatsApp siparişinde zaten topladığı isim/adres/
-- telefon bilgisini (bkz. storefront-cart-drawer.tsx isMarketTenant alanları)
-- kalıcı olarak saklayıp raporlanabilir hale getiriyoruz. order_receipts
-- tablosu sadece PDF dosyası metadata'sı tutar ve 24 saatte silinir (bkz.
-- cleanup-order-receipts cron); bu yüzden ayrı, süresiz iki tablo kuruyoruz.

create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  phone           text not null,
  full_name       text not null,
  address         text not null,
  first_order_at  timestamptz not null default now(),
  last_order_at   timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, phone)
);

create index if not exists customers_tenant_id_idx
  on public.customers (tenant_id);

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  customer_id      uuid references public.customers(id) on delete set null,
  order_number     text not null,
  customer_name    text not null,
  customer_phone   text not null,
  customer_address text not null,
  currency         text not null check (currency in ('TRY', 'USD', 'EUR', 'CATALOG')),
  total_amount     numeric(12, 2) not null default 0 check (total_amount >= 0),
  payment_method   text check (payment_method in ('cash', 'card')),
  item_count       integer not null default 0 check (item_count >= 0),
  items            jsonb not null default '[]'::jsonb,
  note             text,
  created_at       timestamptz not null default now()
);

create index if not exists orders_tenant_id_created_at_idx
  on public.orders (tenant_id, created_at desc);

create index if not exists orders_customer_id_idx
  on public.orders (customer_id);

alter table public.customers enable row level security;
alter table public.orders enable row level security;

create policy "tenant admin read own customers"
  on public.customers
  for select
  using (public.is_tenant_member(tenant_id));

create policy "super admin read all customers"
  on public.customers
  for select
  using (public.is_super_admin());

create policy "tenant admin read own orders"
  on public.orders
  for select
  using (public.is_tenant_member(tenant_id));

create policy "super admin read all orders"
  on public.orders
  for select
  using (public.is_super_admin());

-- Sipariş kaydı + müşteri upsert'i tek transaction'da: aynı telefonla aynı
-- anda iki sipariş gelirse (nadiren) customer satırı yarış durumuna
-- düşmesin diye tek fonksiyonda yapılıyor (bkz. record_storefront_order_stat
-- ile aynı üslup, 0032_storefront_reports_extended.sql).
create or replace function public.record_storefront_order(
  p_tenant_id uuid,
  p_phone text,
  p_full_name text,
  p_address text,
  p_order_number text,
  p_currency text,
  p_total_amount numeric,
  p_payment_method text,
  p_item_count integer,
  p_items jsonb,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
begin
  insert into public.customers (tenant_id, phone, full_name, address, last_order_at, updated_at)
  values (p_tenant_id, p_phone, p_full_name, p_address, now(), now())
  on conflict (tenant_id, phone)
  do update set
    full_name = excluded.full_name,
    address = excluded.address,
    last_order_at = now(),
    updated_at = now()
  returning id into v_customer_id;

  insert into public.orders (
    tenant_id,
    customer_id,
    order_number,
    customer_name,
    customer_phone,
    customer_address,
    currency,
    total_amount,
    payment_method,
    item_count,
    items,
    note
  )
  values (
    p_tenant_id,
    v_customer_id,
    p_order_number,
    p_full_name,
    p_phone,
    p_address,
    p_currency,
    coalesce(p_total_amount, 0),
    p_payment_method,
    coalesce(p_item_count, 0),
    coalesce(p_items, '[]'::jsonb),
    p_note
  )
  returning id into v_order_id;

  return v_order_id;
end;
$$;

revoke all on function public.record_storefront_order(
  uuid, text, text, text, text, text, numeric, text, integer, jsonb, text
) from public;
