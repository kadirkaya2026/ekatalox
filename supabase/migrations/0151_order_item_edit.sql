-- Sipariş fişi düzenleme (3 Eki 2026): bayi, gelen siparişteki adetleri
-- panelden düzeltebilsin (müşteri 10 yazdı, elde 5 var). Yalnız bayrağı açık
-- tenantlarda (ilk: qoop — müşteri isteği); diğer tenantlarda hiçbir şey
-- değişmez. Kalemler orders.items (jsonb) içinde donmuş durur; düzenleme
-- adet/satır çıkarma ile sınırlı, fiyat/ürün eklenemez.
alter table public.tenants
  add column if not exists order_edit_enabled boolean not null default false;

comment on column public.tenants.order_edit_enabled is
  'Panelde sipariş fişindeki adetlerin düzenlenebilmesi (0151). Varsayılan kapalı; süper admin SQL ile açar.';

update public.tenants set order_edit_enabled = true where subdomain = 'qoop';

-- p_quantities: mevcut items dizisiyle aynı uzunlukta sayı dizisi (sıra
-- korunur). 0 = satırı çıkar. Toplam, kalem sayısı, maliyet özeti ve günlük
-- ciro istatistiği aynı transaction'da güncellenir; olay kaydı düşülür.
-- Toplam tutar satır fiyatlarından yeniden hesaplanmaz (kupon/havale indirimi
-- bozulmasın): eski toplam + (yeni ara toplam − eski ara toplam).
create or replace function public.update_order_items(
  p_tenant_id uuid,
  p_order_id uuid,
  p_quantities jsonb,
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
  v_enabled boolean;
  v_n int;
  v_items jsonb := '[]'::jsonb;
  v_item jsonb;
  v_qty numeric;
  v_old_sub numeric := 0;
  v_new_sub numeric := 0;
  v_price numeric;
  v_delta numeric;
  v_cost_total numeric(12, 2);
  v_cost_missing integer;
  i int;
begin
  select order_edit_enabled into v_enabled from public.tenants where id = p_tenant_id;
  if not coalesce(v_enabled, false) then
    raise exception 'order_edit_disabled' using errcode = 'P0001';
  end if;

  select * into v_order
    from public.orders
   where id = p_order_id and tenant_id = p_tenant_id
   for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;
  if v_order.status not in ('new', 'confirmed', 'preparing') then
    raise exception 'order_not_editable:%', v_order.status using errcode = 'P0001';
  end if;

  v_n := jsonb_array_length(coalesce(v_order.items, '[]'::jsonb));
  if jsonb_typeof(p_quantities) <> 'array' or jsonb_array_length(p_quantities) <> v_n then
    raise exception 'quantities_mismatch' using errcode = 'P0001';
  end if;

  for i in 0 .. v_n - 1 loop
    v_item := v_order.items -> i;
    if jsonb_typeof(p_quantities -> i) <> 'number' then
      raise exception 'invalid_quantity' using errcode = 'P0001';
    end if;
    v_qty := (p_quantities ->> i)::numeric;
    if v_qty < 0 or v_qty > 1000000 then
      raise exception 'invalid_quantity' using errcode = 'P0001';
    end if;
    v_price := coalesce((v_item ->> 'price')::numeric, 0);
    v_old_sub := v_old_sub + v_price * coalesce((v_item ->> 'quantity')::numeric, 0);
    if v_qty > 0 then
      v_new_sub := v_new_sub + v_price * v_qty;
      v_items := v_items || jsonb_set(v_item, '{quantity}', to_jsonb(v_qty));
    end if;
  end loop;

  if jsonb_array_length(v_items) = 0 then
    raise exception 'no_items_left' using errcode = 'P0001';
  end if;

  v_delta := round(v_new_sub - v_old_sub, 2);

  select
    sum(case when (it ->> 'unit_cost') is not null
             then (it ->> 'unit_cost')::numeric * coalesce((it ->> 'quantity')::numeric, 0) end),
    count(*) filter (where (it ->> 'unit_cost') is null)
    into v_cost_total, v_cost_missing
  from jsonb_array_elements(v_items) as it;

  update public.orders
     set items = v_items,
         item_count = jsonb_array_length(v_items),
         total_amount = greatest(round(total_amount + v_delta, 2), 0),
         cost_total = v_cost_total,
         cost_missing_count = coalesce(v_cost_missing, 0)
   where id = p_order_id
   returning * into v_order;

  -- Günlük ciro istatistiği (record_storefront_order_stat, İstanbul günü)
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

revoke all on function public.update_order_items(uuid, uuid, jsonb, uuid, text) from public;

notify pgrst, 'reload schema';
