-- Toptancı sipariş akışı (3 Eki 2026): market olmayan mağazalarda panelde yalnız
-- Onayla / İptal; onaylanan sipariş satış sayılır (rapor fonksiyonları), fiş
-- onaydan önce ve sonra düzenlenebilir (edit_order). Marketlerde hiçbir şey değişmez.

CREATE OR REPLACE FUNCTION public.get_sales_kpis(p_tenant_id uuid, p_from date, p_to date)
 RETURNS TABLE(currency text, total_count bigint, new_count bigint, confirmed_count bigint, preparing_count bigint, shipped_count bigint, delivered_count bigint, cancelled_count bigint, delivered_revenue numeric, delivered_cost numeric, delivered_cost_missing_orders bigint, pending_amount numeric, cash_count bigint, cash_amount numeric, card_count bigint, card_amount numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    o.currency,
    count(*),
    count(*) filter (where o.status = 'new'),
    count(*) filter (where o.status = 'confirmed'),
    count(*) filter (where o.status = 'preparing'),
    count(*) filter (where o.status = 'shipped'),
    count(*) filter (where o.status = 'delivered'),
    count(*) filter (where o.status = 'cancelled'),
    coalesce(sum(o.total_amount) filter (where (o.status = 'delivered' or (tw.w and o.status in ('confirmed', 'preparing', 'shipped')))), 0),
    coalesce(sum(o.cost_total) filter (where (o.status = 'delivered' or (tw.w and o.status in ('confirmed', 'preparing', 'shipped'))) and o.cost_missing_count = 0), 0),
    count(*) filter (where (o.status = 'delivered' or (tw.w and o.status in ('confirmed', 'preparing', 'shipped'))) and (o.cost_missing_count > 0 or o.cost_total is null)),
    coalesce(sum(o.total_amount) filter (where (o.status = 'new' or (not tw.w and o.status in ('confirmed', 'preparing', 'shipped')))), 0),
    count(*) filter (where (o.status = 'delivered' or (tw.w and o.status in ('confirmed', 'preparing', 'shipped'))) and o.payment_method = 'cash'),
    coalesce(sum(o.total_amount) filter (where (o.status = 'delivered' or (tw.w and o.status in ('confirmed', 'preparing', 'shipped'))) and o.payment_method = 'cash'), 0),
    count(*) filter (where (o.status = 'delivered' or (tw.w and o.status in ('confirmed', 'preparing', 'shipped'))) and o.payment_method = 'card'),
    coalesce(sum(o.total_amount) filter (where (o.status = 'delivered' or (tw.w and o.status in ('confirmed', 'preparing', 'shipped'))) and o.payment_method = 'card'), 0)
  from public.orders o
  cross join (select coalesce(business_type, '') <> 'market' as w from public.tenants where id = p_tenant_id) tw
  where o.tenant_id = p_tenant_id
    and o.created_at >= (p_from::timestamp at time zone 'Europe/Istanbul')
    and o.created_at <  ((p_to + 1)::timestamp at time zone 'Europe/Istanbul')
  group by o.currency;
$function$;

CREATE OR REPLACE FUNCTION public.get_sales_report(p_tenant_id uuid, p_from date, p_to date, p_bucket text)
 RETURNS TABLE(bucket_start date, currency text, order_count bigint, delivered_count bigint, cancelled_count bigint, pending_count bigint, revenue numeric, cost numeric, profit numeric, cost_missing_orders bigint, avg_basket numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_bucket not in ('day', 'week', 'month') then
    raise exception 'invalid_bucket' using errcode = 'P0001';
  end if;
  return query
  select
    date_trunc(p_bucket, o.created_at at time zone 'Europe/Istanbul')::date,
    o.currency,
    count(*),
    count(*) filter (where (o.status = 'delivered' or (tw.w and o.status in ('confirmed', 'preparing', 'shipped')))),
    count(*) filter (where o.status = 'cancelled'),
    count(*) filter (where (o.status = 'new' or (not tw.w and o.status in ('confirmed', 'preparing', 'shipped')))),
    coalesce(sum(o.total_amount) filter (where (o.status = 'delivered' or (tw.w and o.status in ('confirmed', 'preparing', 'shipped')))), 0),
    coalesce(sum(o.cost_total) filter (where (o.status = 'delivered' or (tw.w and o.status in ('confirmed', 'preparing', 'shipped'))) and o.cost_missing_count = 0), 0),
    coalesce(sum(o.total_amount - coalesce(o.cost_total, 0))
             filter (where (o.status = 'delivered' or (tw.w and o.status in ('confirmed', 'preparing', 'shipped'))) and o.cost_missing_count = 0), 0),
    count(*) filter (where (o.status = 'delivered' or (tw.w and o.status in ('confirmed', 'preparing', 'shipped'))) and (o.cost_missing_count > 0 or o.cost_total is null)),
    coalesce(avg(o.total_amount) filter (where (o.status = 'delivered' or (tw.w and o.status in ('confirmed', 'preparing', 'shipped')))), 0)
  from public.orders o
  cross join (select coalesce(business_type, '') <> 'market' as w from public.tenants where id = p_tenant_id) tw
  where o.tenant_id = p_tenant_id
    and o.currency <> 'CATALOG'
    and o.created_at >= (p_from::timestamp at time zone 'Europe/Istanbul')
    and o.created_at <  ((p_to + 1)::timestamp at time zone 'Europe/Istanbul')
  group by 1, 2
  order by 1, 2;
end;
$function$;

-- Sipariş düzenleme v2 (3 Eki 2026): toptancı (market olmayan) mağazalarda ya da
-- order_edit_enabled açık olanlarda fiş baştan kurulur: satır çıkarma, adet ve
-- fiyat değiştirme, yeni ürün ekleme (satırları sunucu ürün kaydından üretir),
-- müşteri bilgileri. Onaylanmış (stock_applied) siparişte stok farkı anında
-- düşülür/eklenir. Toplam: eski toplam + (yeni ara toplam − eski ara toplam).
create or replace function public.edit_order(
  p_tenant_id uuid,
  p_order_id uuid,
  p_items jsonb,
  p_customer jsonb default null,
  p_actor_profile_id uuid default null,
  p_reason text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_allowed boolean;
  v_old_sub numeric := 0;
  v_new_sub numeric := 0;
  v_delta numeric;
  v_cost_total numeric(12, 2);
  v_cost_missing integer;
  it jsonb;
begin
  select (coalesce(business_type, '') <> 'market') or order_edit_enabled
    into v_allowed from public.tenants where id = p_tenant_id;
  if not coalesce(v_allowed, false) then
    raise exception 'order_edit_disabled' using errcode = 'P0001';
  end if;

  select * into v_order from public.orders
   where id = p_order_id and tenant_id = p_tenant_id
   for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;
  if v_order.status in ('delivered', 'cancelled') then
    raise exception 'order_not_editable:%', v_order.status using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'no_items_left' using errcode = 'P0001';
  end if;

  for it in select * from jsonb_array_elements(p_items) loop
    if coalesce((it ->> 'quantity')::numeric, 0) <= 0 or (it ->> 'quantity')::numeric > 1000000
       or coalesce((it ->> 'price')::numeric, 0) < 0 then
      raise exception 'invalid_quantity' using errcode = 'P0001';
    end if;
    v_new_sub := v_new_sub + (it ->> 'price')::numeric * (it ->> 'quantity')::numeric;
  end loop;
  for it in select * from jsonb_array_elements(coalesce(v_order.items, '[]'::jsonb)) loop
    v_old_sub := v_old_sub + coalesce((it ->> 'price')::numeric, 0) * coalesce((it ->> 'quantity')::numeric, 0);
  end loop;
  v_delta := round(v_new_sub - v_old_sub, 2);

  -- Onaylanmış siparişte stok farkı (0153): yalnız model seçilmemiş, takipli ürünler.
  if v_order.stock_applied then
    update public.products p
       set stock_quantity = greatest(coalesce(p.stock_quantity, 0) - d.diff, 0)
      from (
        select product_id, sum(q)::integer as diff from (
          select (i ->> 'product_id')::uuid as product_id, (i ->> 'quantity')::numeric as q
            from jsonb_array_elements(p_items) i
           where coalesce(i ->> 'variant_id', '') = '' and coalesce(i ->> 'product_id', '') ~* '^[0-9a-f-]{36}$'
          union all
          select (i ->> 'product_id')::uuid, -(i ->> 'quantity')::numeric
            from jsonb_array_elements(coalesce(v_order.items, '[]'::jsonb)) i
           where coalesce(i ->> 'variant_id', '') = '' and coalesce(i ->> 'product_id', '') ~* '^[0-9a-f-]{36}$'
        ) x group by product_id
      ) d
     where p.id = d.product_id and p.tenant_id = p_tenant_id and p.track_stock and d.diff <> 0;
  end if;

  select
    sum(case when (x ->> 'unit_cost') is not null
             then (x ->> 'unit_cost')::numeric * coalesce((x ->> 'quantity')::numeric, 0) end),
    count(*) filter (where (x ->> 'unit_cost') is null)
    into v_cost_total, v_cost_missing
  from jsonb_array_elements(p_items) as x;

  update public.orders
     set items = p_items,
         item_count = jsonb_array_length(p_items),
         total_amount = greatest(round(total_amount + v_delta, 2), 0),
         cost_total = v_cost_total,
         cost_missing_count = coalesce(v_cost_missing, 0),
         customer_name = case when p_customer ? 'customer_name' then left(nullif(trim(p_customer ->> 'customer_name'), ''), 120) else customer_name end,
         customer_phone = case when p_customer ? 'customer_phone' then left(nullif(trim(p_customer ->> 'customer_phone'), ''), 40) else customer_phone end,
         customer_address = case when p_customer ? 'customer_address' then left(nullif(trim(p_customer ->> 'customer_address'), ''), 500) else customer_address end,
         note = case when p_customer ? 'note' then left(nullif(trim(p_customer ->> 'note'), ''), 1000) else note end
   where id = p_order_id
   returning * into v_order;

  if v_delta <> 0 and v_order.currency in ('TRY', 'USD', 'EUR') then
    update public.storefront_analytics_orders_daily
       set total_amount = greatest(total_amount + v_delta, 0)
     where tenant_id = p_tenant_id
       and stat_date = (timezone('Europe/Istanbul', v_order.created_at))::date
       and currency = v_order.currency;
  end if;

  insert into public.order_status_events
    (tenant_id, order_id, from_status, to_status, reason, actor, actor_profile_id)
  values
    (p_tenant_id, p_order_id, v_order.status, v_order.status,
     left(coalesce(nullif(trim(p_reason), ''), 'Fiş düzenlendi'), 300), 'dealer', p_actor_profile_id);

  return v_order;
end;
$$;

revoke all on function public.edit_order(uuid, uuid, jsonb, jsonb, uuid, text) from public, anon, authenticated;
