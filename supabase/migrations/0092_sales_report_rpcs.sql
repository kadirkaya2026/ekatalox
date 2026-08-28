-- Sipariş durum geçişi + satış raporu RPC'leri.
-- AYRI batch olarak çalıştır (0091'den sonra): gövdeler 0091'in kolonlarına bağlı.
-- PostgREST'te toplama fonksiyonları kapalı (PGRST123) → gruplama burada.
-- Tüm aralıklar Europe/Istanbul takvim günü; created_at ekseni.

-- ---------------------------------------------------------------------------
-- 1) Durum geçişi: kontrol + update + olay tek transaction'da
-- ---------------------------------------------------------------------------
create or replace function public.transition_order_status(
  p_tenant_id uuid,
  p_order_id uuid,
  p_to_status text,
  p_reason text default null,
  p_actor text default 'dealer',
  p_actor_profile_id uuid default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_from text;
  v_allowed boolean;
begin
  select * into v_order
    from public.orders
   where id = p_order_id and tenant_id = p_tenant_id
   for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  v_from := v_order.status;
  v_allowed := case
    when p_to_status = 'cancelled' then v_from in ('new', 'confirmed', 'preparing', 'shipped')
    when p_to_status = 'confirmed' then v_from = 'new'
    when p_to_status = 'preparing' then v_from in ('new', 'confirmed')
    when p_to_status = 'shipped'   then v_from in ('confirmed', 'preparing')
    when p_to_status = 'delivered' then v_from in ('confirmed', 'preparing', 'shipped')
    else false
  end;
  if not v_allowed then
    raise exception 'invalid_transition:%->%', v_from, p_to_status using errcode = 'P0001';
  end if;
  if p_to_status = 'cancelled' and coalesce(trim(p_reason), '') = '' then
    raise exception 'cancel_reason_required' using errcode = 'P0001';
  end if;

  update public.orders
     set status = p_to_status,
         status_updated_at = now(),
         confirmed_at  = case when p_to_status = 'confirmed' then now() else confirmed_at end,
         delivered_at  = case when p_to_status = 'delivered' then now() else delivered_at end,
         cancelled_at  = case when p_to_status = 'cancelled' then now() else cancelled_at end,
         cancel_reason = case when p_to_status = 'cancelled' then left(trim(p_reason), 300) else cancel_reason end
   where id = p_order_id
   returning * into v_order;

  insert into public.order_status_events
    (tenant_id, order_id, from_status, to_status, reason, actor, actor_profile_id)
  values
    (p_tenant_id, p_order_id, v_from, p_to_status, nullif(trim(p_reason), ''), p_actor, p_actor_profile_id);

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) KPI'lar: para birimi başına tek satır (CATALOG satırı yalnız adet taşır)
-- ---------------------------------------------------------------------------
create or replace function public.get_sales_kpis(p_tenant_id uuid, p_from date, p_to date)
returns table (
  currency text,
  total_count bigint,
  new_count bigint,
  confirmed_count bigint,
  preparing_count bigint,
  shipped_count bigint,
  delivered_count bigint,
  cancelled_count bigint,
  delivered_revenue numeric,
  delivered_cost numeric,
  delivered_cost_missing_orders bigint,
  pending_amount numeric,
  cash_count bigint,
  cash_amount numeric,
  card_count bigint,
  card_amount numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.currency,
    count(*),
    count(*) filter (where o.status = 'new'),
    count(*) filter (where o.status = 'confirmed'),
    count(*) filter (where o.status = 'preparing'),
    count(*) filter (where o.status = 'shipped'),
    count(*) filter (where o.status = 'delivered'),
    count(*) filter (where o.status = 'cancelled'),
    coalesce(sum(o.total_amount) filter (where o.status = 'delivered'), 0),
    coalesce(sum(o.cost_total) filter (where o.status = 'delivered' and o.cost_missing_count = 0), 0),
    count(*) filter (where o.status = 'delivered' and (o.cost_missing_count > 0 or o.cost_total is null)),
    coalesce(sum(o.total_amount) filter (where o.status in ('new', 'confirmed', 'preparing', 'shipped')), 0),
    count(*) filter (where o.status = 'delivered' and o.payment_method = 'cash'),
    coalesce(sum(o.total_amount) filter (where o.status = 'delivered' and o.payment_method = 'cash'), 0),
    count(*) filter (where o.status = 'delivered' and o.payment_method = 'card'),
    coalesce(sum(o.total_amount) filter (where o.status = 'delivered' and o.payment_method = 'card'), 0)
  from public.orders o
  where o.tenant_id = p_tenant_id
    and o.created_at >= (p_from::timestamp at time zone 'Europe/Istanbul')
    and o.created_at <  ((p_to + 1)::timestamp at time zone 'Europe/Istanbul')
  group by o.currency;
$$;

-- ---------------------------------------------------------------------------
-- 3) Dönem serisi (gün / ISO hafta / ay)
-- ---------------------------------------------------------------------------
create or replace function public.get_sales_report(p_tenant_id uuid, p_from date, p_to date, p_bucket text)
returns table (
  bucket_start date,
  currency text,
  order_count bigint,
  delivered_count bigint,
  cancelled_count bigint,
  pending_count bigint,
  revenue numeric,
  cost numeric,
  profit numeric,
  cost_missing_orders bigint,
  avg_basket numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_bucket not in ('day', 'week', 'month') then
    raise exception 'invalid_bucket' using errcode = 'P0001';
  end if;
  return query
  select
    date_trunc(p_bucket, o.created_at at time zone 'Europe/Istanbul')::date,
    o.currency,
    count(*),
    count(*) filter (where o.status = 'delivered'),
    count(*) filter (where o.status = 'cancelled'),
    count(*) filter (where o.status in ('new', 'confirmed', 'preparing', 'shipped')),
    coalesce(sum(o.total_amount) filter (where o.status = 'delivered'), 0),
    coalesce(sum(o.cost_total) filter (where o.status = 'delivered' and o.cost_missing_count = 0), 0),
    coalesce(sum(o.total_amount - coalesce(o.cost_total, 0))
             filter (where o.status = 'delivered' and o.cost_missing_count = 0), 0),
    count(*) filter (where o.status = 'delivered' and (o.cost_missing_count > 0 or o.cost_total is null)),
    coalesce(avg(o.total_amount) filter (where o.status = 'delivered'), 0)
  from public.orders o
  where o.tenant_id = p_tenant_id
    and o.currency <> 'CATALOG'
    and o.created_at >= (p_from::timestamp at time zone 'Europe/Istanbul')
    and o.created_at <  ((p_to + 1)::timestamp at time zone 'Europe/Istanbul')
  group by 1, 2
  order by 1, 2;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) En çok satan ürünler (yalnız teslim edilen), items jsonb'den
-- ---------------------------------------------------------------------------
create or replace function public.get_sales_top_products(
  p_tenant_id uuid, p_from date, p_to date, p_limit integer default 20
)
returns table (
  product_key text,
  product_name text,
  sku_code text,
  currency text,
  quantity numeric,
  revenue numeric,
  cost numeric,
  profit numeric,
  cost_missing boolean,
  order_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with lines as (
    select
      o.id as order_id,
      o.currency,
      coalesce(i->>'product_id', i->>'sku_code', i->>'product_name') as product_key,
      i->>'product_name' as product_name,
      i->>'sku_code' as sku_code,
      coalesce((i->>'quantity')::numeric, 0) as qty,
      (i->>'price')::numeric as price,
      (i->>'unit_cost')::numeric as unit_cost
    from public.orders o
    cross join lateral jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) as i
    where o.tenant_id = p_tenant_id
      and o.status = 'delivered'
      and o.currency <> 'CATALOG'
      and o.created_at >= (p_from::timestamp at time zone 'Europe/Istanbul')
      and o.created_at <  ((p_to + 1)::timestamp at time zone 'Europe/Istanbul')
  )
  select
    product_key,
    max(product_name),
    max(sku_code),
    currency,
    sum(qty),
    coalesce(sum(coalesce(price, 0) * qty), 0),
    case when bool_or(unit_cost is null) then null else sum(unit_cost * qty) end,
    case when bool_or(unit_cost is null) then null else sum((coalesce(price, 0) - unit_cost) * qty) end,
    bool_or(unit_cost is null),
    count(distinct order_id)
  from lines
  group by product_key, currency
  order by 6 desc
  limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;

revoke all on function public.transition_order_status(uuid, uuid, text, text, text, uuid) from public;
revoke all on function public.get_sales_kpis(uuid, date, date) from public;
revoke all on function public.get_sales_report(uuid, date, date, text) from public;
revoke all on function public.get_sales_top_products(uuid, date, date, integer) from public;

notify pgrst, 'reload schema';
