-- Ürün stok takibi (3 Eki 2026). track_stock açık üründe stock_quantity (adet)
-- tutulur; vitrinde "Stok: X adet" görünür, sepet kalan adetle sınırlanır.
-- Takip açıkken is_in_stock adetten türetilir (0 → stokta yok). Takip kapalı
-- ürün eskisi gibi elle "stokta var/yok" çalışır.
alter table public.products
  add column if not exists track_stock boolean not null default false,
  add column if not exists stock_quantity integer check (stock_quantity is null or stock_quantity >= 0);

create or replace function public.products_sync_in_stock_from_quantity()
returns trigger
language plpgsql
as $$
begin
  if new.track_stock then
    new.stock_quantity := greatest(coalesce(new.stock_quantity, 0), 0);
    new.is_in_stock := new.stock_quantity > 0;
  end if;
  return new;
end;
$$;

drop trigger if exists products_sync_in_stock_from_quantity on public.products;
create trigger products_sync_in_stock_from_quantity
  before insert or update of track_stock, stock_quantity, is_in_stock on public.products
  for each row execute function public.products_sync_in_stock_from_quantity();

-- Sipariş onaylanınca stok düşer, iptal edilirse geri eklenir. orders.stock_applied
-- çift düşmeyi önler. Yalnız model (varyant) seçilmemiş satırlar ve stok takibi
-- açık ürünler etkilenir; adet = satır quantity (sepet her zaman adet cinsinden).
alter table public.orders
  add column if not exists stock_applied boolean not null default false;

-- Bu migration'dan önce zaten onaylanmış siparişler tekrar düşmesin.
update public.orders set stock_applied = true
  where status in ('confirmed', 'preparing', 'shipped', 'delivered') and not stock_applied;

create or replace function public.orders_apply_stock_on_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sign integer;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status in ('confirmed', 'preparing', 'shipped', 'delivered') and not old.stock_applied then
    v_sign := -1;
    new.stock_applied := true;
  elsif new.status = 'cancelled' and old.stock_applied then
    v_sign := 1;
    new.stock_applied := false;
  else
    return new;
  end if;

  update public.products p
     set stock_quantity = greatest(coalesce(p.stock_quantity, 0) + v_sign * l.qty, 0)
    from (
      select (i->>'product_id')::uuid as product_id,
             sum(coalesce((i->>'quantity')::numeric, 0))::integer as qty
        from jsonb_array_elements(coalesce(new.items, '[]'::jsonb)) i
       where coalesce(i->>'variant_id', '') = ''
         and coalesce(i->>'product_id', '') ~* '^[0-9a-f-]{36}$'
       group by 1
    ) l
   where p.id = l.product_id
     and p.tenant_id = new.tenant_id
     and p.track_stock;

  return new;
end;
$$;

drop trigger if exists orders_apply_stock_on_status on public.orders;
create trigger orders_apply_stock_on_status
  before update of status on public.orders
  for each row execute function public.orders_apply_stock_on_status();
