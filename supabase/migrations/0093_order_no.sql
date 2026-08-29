-- Bayi başına kısa, sıralı sipariş numarası (order_no).
--
-- Neden: orders.order_number "76b0d05b_20260829093612_n4mx" gibi bir depolama
-- anahtarı; müşteriye bildirimde, takip sayfasında ve bayi panelinde bunun
-- görünmesi hem çirkin hem telefonda söylenemez. Her bayi 100001'den başlar
-- (6 hane), her yeni siparişte bir artar. order_number OLDUĞU GİBİ kalır
-- (fiş dosya yolu ve unique anahtar olarak kullanılmaya devam eder).
--
-- Yeni sütuna dokunan ifadeler DO+EXECUTE içinde (Supabase editörü toplu parse
-- ediyor; bkz. 0087 başlığındaki not).

alter table public.orders
  add column if not exists order_no integer;

create table if not exists public.tenant_order_counters (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  next_no   integer not null default 100001
);
alter table public.tenant_order_counters enable row level security;
-- politika yok: yalnız service role / security definer fonksiyonlar dokunur

-- Eski siparişler: her bayide oluşturulma sırasına göre 100001'den itibaren.
do $$
begin
  execute $q$
    with numbered as (
      select id,
             100000 + row_number() over (partition by tenant_id order by created_at, id) as n
        from public.orders
       where order_no is null
    )
    update public.orders o
       set order_no = numbered.n
      from numbered
     where o.id = numbered.id
  $q$;

  execute $q$
    insert into public.tenant_order_counters (tenant_id, next_no)
    select tenant_id, max(order_no) + 1
      from public.orders
     group by tenant_id
    on conflict (tenant_id) do update
      set next_no = greatest(tenant_order_counters.next_no, excluded.next_no)
  $q$;

  execute 'create unique index if not exists orders_tenant_order_no_key
             on public.orders (tenant_id, order_no)';
end $$;

-- Sıradaki numarayı verir; satır kilidi ile eşzamanlı iki siparişte çakışmaz.
create or replace function public.next_tenant_order_no(p_tenant_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_no integer;
begin
  insert into public.tenant_order_counters (tenant_id)
  values (p_tenant_id)
  on conflict (tenant_id) do nothing;

  update public.tenant_order_counters
     set next_no = next_no + 1
   where tenant_id = p_tenant_id
  returning next_no - 1 into v_no;

  return v_no;
end;
$$;
revoke all on function public.next_tenant_order_no(uuid) from public;

-- record_storefront_order — AYNI 12 parametreli imza; insert'e order_no eklendi.
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
  v_order_no integer;
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

  v_order_no := public.next_tenant_order_no(p_tenant_id);

  insert into public.orders (
    tenant_id, customer_id, order_number, order_no, customer_name, customer_phone,
    customer_address, currency, total_amount, payment_method, item_count,
    items, note, magnet_code_id, cost_total, cost_missing_count
  )
  values (
    p_tenant_id, v_customer_id, p_order_number, v_order_no, p_full_name, p_phone,
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

notify pgrst, 'reload schema';
