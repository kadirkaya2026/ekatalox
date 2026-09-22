-- Ürün arama + katalog kalitesi süzgeçleri (kullanıcı isteği, 22 Eyl 2026).
--
-- 1) search_key: ad + SKU'nun küçük harf, yalnız harf/rakam hali. Müşteri
--    "lc101" yazınca "LC-101" çıkmıyordu (sku ilike tire ister). Arama
--    terimi de aynı biçime indirilip search_key.ilike.%lc101% ile aranır.
-- 2) has_image (generated) + has_price (trigger ile güncel tutulur):
--    Genel Bakış "Görselsiz / Fiyatsız ürün" bağlantıları Ürünler sayfasını
--    doğrudan o ürünlerle açsın diye PostgREST'ten süzülebilir kolon.
--    has_price ürün ya da varyant düzeyinde herhangi bir listede pozitif
--    fiyat varsa true; product_prices / product_variant_prices değişince
--    tetikleyici yeniden hesaplar.

alter table public.products
  add column if not exists search_key text
    generated always as (
      lower(regexp_replace(coalesce(product_name, '') || coalesce(sku_code, ''), '[^[:alnum:]]', '', 'g'))
    ) stored;

alter table public.products
  add column if not exists has_image boolean
    generated always as (nullif(btrim(coalesce(image_url, '')), '') is not null) stored;

alter table public.products
  add column if not exists has_price boolean not null default false;

create index if not exists products_tenant_search_key_idx
  on public.products (tenant_id, search_key);

create or replace function public.refresh_product_has_price(p_product_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products p
     set has_price = exists (
           select 1 from public.product_prices pp
            where pp.product_id = p.id and coalesce(pp.price, 0) > 0
         ) or exists (
           select 1 from public.product_variants v
             join public.product_variant_prices vp on vp.variant_id = v.id
            where v.product_id = p.id and coalesce(vp.price, 0) > 0
         )
   where p.id = p_product_id;
$$;
revoke all on function public.refresh_product_has_price(uuid) from public;

create or replace function public.trg_product_prices_has_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.refresh_product_has_price(new.product_id);
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.product_id is distinct from new.product_id) then
    perform public.refresh_product_has_price(old.product_id);
  end if;
  return null;
end;
$$;

drop trigger if exists product_prices_has_price_trg on public.product_prices;
create trigger product_prices_has_price_trg
  after insert or update or delete on public.product_prices
  for each row execute function public.trg_product_prices_has_price();

create or replace function public.trg_product_variant_prices_has_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid;
begin
  select product_id into v_product_id
    from public.product_variants
   where id = coalesce(new.variant_id, old.variant_id);
  if v_product_id is not null then
    perform public.refresh_product_has_price(v_product_id);
  end if;
  return null;
end;
$$;

drop trigger if exists product_variant_prices_has_price_trg on public.product_variant_prices;
create trigger product_variant_prices_has_price_trg
  after insert or update or delete on public.product_variant_prices
  for each row execute function public.trg_product_variant_prices_has_price();

-- Tek seferlik geri doldurma.
update public.products p
   set has_price = exists (
         select 1 from public.product_prices pp
          where pp.product_id = p.id and coalesce(pp.price, 0) > 0
       ) or exists (
         select 1 from public.product_variants v
           join public.product_variant_prices vp on vp.variant_id = v.id
          where v.product_id = p.id and coalesce(vp.price, 0) > 0
       );

notify pgrst, 'reload schema';
