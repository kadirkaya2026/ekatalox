-- Satış & Kârlılık (ön muhasebe) + sipariş durum akışı + müşteri takip/bildirim.
--
-- Bu dosya: ürün maliyeti, sipariş durumu/zaman damgaları/maliyet özeti/takip
-- token'ı, durum olay günlüğü, push abonelikleri ve record_storefront_order'ın
-- maliyet+olay yazan yeni gövdesi.
--
-- DİKKAT (Supabase SQL editörü tüm betiği önce parse eder): yeni kolona bağlı
-- indeks/update ifadeleri DO ... EXECUTE içinde. Rapor RPC'leri ayrı dosyada
-- (0092), ayrı batch olarak çalıştırılmalı.

-- ---------------------------------------------------------------------------
-- 1) products: alış fiyatı (maliyet). Ürün para birimiyle aynı birimde.
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists purchase_price numeric(12, 2)
    check (purchase_price is null or purchase_price >= 0);

-- ---------------------------------------------------------------------------
-- 2) orders: durum, zaman damgaları, maliyet özeti, takip token'ı
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists status text not null default 'new'
    check (status in ('new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  add column if not exists status_updated_at timestamptz not null default now(),
  add column if not exists confirmed_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_reason text
    check (cancel_reason is null or char_length(cancel_reason) <= 300),
  -- unit_cost bilinen kalemlerin toplamı; hiçbir kalemde bilinmiyorsa null
  add column if not exists cost_total numeric(12, 2)
    check (cost_total is null or cost_total >= 0),
  add column if not exists cost_missing_count integer not null default 0
    check (cost_missing_count >= 0),
  -- Müşterinin girişsiz takip sayfası: /siparis/{token}
  add column if not exists tracking_token uuid not null default gen_random_uuid();

do $$
begin
  execute 'create unique index if not exists orders_tracking_token_key
             on public.orders (tracking_token)';
  execute 'create index if not exists orders_tenant_status_created_idx
             on public.orders (tenant_id, status, created_at desc)';
end $$;

-- ---------------------------------------------------------------------------
-- 3) Durum olay günlüğü
-- ---------------------------------------------------------------------------
create table if not exists public.order_status_events (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  order_id         uuid not null references public.orders(id) on delete cascade,
  from_status      text,
  to_status        text not null
    check (to_status in ('new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  reason           text,
  actor            text not null check (actor in ('dealer', 'customer', 'system')),
  -- profiles.id; FK bilerek yok — kullanıcı silinse de tarihçe kalsın
  actor_profile_id uuid,
  created_at       timestamptz not null default now()
);

create index if not exists order_status_events_order_created_idx
  on public.order_status_events (order_id, created_at);

alter table public.order_status_events enable row level security;

drop policy if exists "tenant admin read own order status events" on public.order_status_events;
create policy "tenant admin read own order status events"
  on public.order_status_events for select
  using (public.is_tenant_member(tenant_id));

drop policy if exists "super admin read all order status events" on public.order_status_events;
create policy "super admin read all order status events"
  on public.order_status_events for select
  using (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- 4) Web Push abonelikleri (müşteri, sipariş takip sayfasından)
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  order_id      uuid references public.orders(id) on delete set null,
  customer_id   uuid references public.customers(id) on delete set null,
  endpoint      text not null unique,
  p256dh        text not null,
  auth          text not null,
  user_agent    text,
  failure_count integer not null default 0,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);

create index if not exists push_subscriptions_order_idx on public.push_subscriptions (order_id);
create index if not exists push_subscriptions_customer_idx on public.push_subscriptions (customer_id);

-- Politika yok: endpoint/anahtarlar hassas, yalnız service role okur/yazar.
alter table public.push_subscriptions enable row level security;

-- ---------------------------------------------------------------------------
-- 5) record_storefront_order — AYNI 12 parametreli imza, gövde güncellendi.
--    create or replace güvenli: parametre listesi ve dönüş tipi değişmiyor.
--    Eklenen: kalemlerden maliyet özeti + 'new' durum olayı.
-- ---------------------------------------------------------------------------
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
  p_note text default null,
  p_magnet_code_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_magnet_id uuid;
  v_cost_total numeric(12, 2);
  v_cost_missing integer;
begin
  if exists (
    select 1 from public.blocked_customer_phones
     where tenant_id = p_tenant_id and phone = p_phone
  ) then
    return null;
  end if;

  if p_magnet_code_id is not null then
    select id into v_magnet_id
      from public.magnet_codes
     where id = p_magnet_code_id and tenant_id = p_tenant_id;
  end if;

  -- Maliyet özeti: unit_cost sipariş anında kaleme yazılır (lib/storefront/orders.ts).
  -- Bilinmeyen kalem sayısı raporda "maliyeti eksik" uyarısı olur.
  select
    sum(case when (i->>'unit_cost') is not null
             then (i->>'unit_cost')::numeric * coalesce((i->>'quantity')::numeric, 0) end),
    count(*) filter (where (i->>'unit_cost') is null)
    into v_cost_total, v_cost_missing
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as i;

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
    tenant_id, customer_id, order_number, customer_name, customer_phone,
    customer_address, currency, total_amount, payment_method, item_count,
    items, note, magnet_code_id, cost_total, cost_missing_count
  )
  values (
    p_tenant_id, v_customer_id, p_order_number, p_full_name, p_phone,
    p_address, p_currency, coalesce(p_total_amount, 0), p_payment_method,
    coalesce(p_item_count, 0), coalesce(p_items, '[]'::jsonb), p_note,
    v_magnet_id, v_cost_total, coalesce(v_cost_missing, 0)
  )
  returning id into v_order_id;

  insert into public.order_status_events (tenant_id, order_id, from_status, to_status, actor)
  values (p_tenant_id, v_order_id, null, 'new', 'system');

  if v_magnet_id is not null then
    update public.magnet_codes
       set customer_id = v_customer_id,
           claimed_at = now(),
           first_order_id = v_order_id
     where id = v_magnet_id
       and tenant_id = p_tenant_id
       and customer_id is null;
  end if;

  return v_order_id;
end;
$$;

revoke all on function public.record_storefront_order(
  uuid, text, text, text, text, text, numeric, text, integer, jsonb, text, uuid
) from public;

-- ---------------------------------------------------------------------------
-- 6) Eski siparişler: bu tarihe kadar gelen her sipariş fiilen tamamlanmış
--    sayılır; aksi hâlde bayinin "Yeni" listesi yüzlerce eski siparişle dolar
--    ve geçmiş ciro 0 görünür. Yanlış işaretlenen sipariş panelden iptal edilir.
-- ---------------------------------------------------------------------------
do $$
begin
  execute $q$
    update public.orders
       set status = 'delivered',
           delivered_at = created_at,
           status_updated_at = created_at
     where status = 'new'
       and created_at < now() - interval '1 minute'
  $q$;
  execute $q$
    insert into public.order_status_events (tenant_id, order_id, from_status, to_status, actor, reason)
    select o.tenant_id, o.id, 'new', 'delivered', 'system', 'legacy-backfill'
      from public.orders o
     where o.status = 'delivered'
       and o.delivered_at = o.created_at
       and not exists (select 1 from public.order_status_events e where e.order_id = o.id)
  $q$;
end $$;

notify pgrst, 'reload schema';
