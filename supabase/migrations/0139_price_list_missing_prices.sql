-- Fiyat Listeleri sayfası (28 Eyl 2026): her FİYATLI listede fiyatı
-- girilmemiş (satır yok ya da fiyat <= 0) ürün sayısı + ilk N ürün.
-- Fiyatsız katalog listesi (is_catalog_only) hesaba katılmaz.
create or replace function public.price_list_missing_prices(p_tenant_id uuid, p_sample integer default 50)
returns table (price_list_id uuid, missing_count bigint, sample jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select
    pl.id,
    count(p.id) filter (where pp.price is null or pp.price <= 0),
    coalesce(
      to_jsonb(
        (array_agg(jsonb_build_object('id', p.id, 'name', p.product_name, 'sku', p.sku_code) order by p.product_name)
          filter (where pp.price is null or pp.price <= 0))[1:p_sample]
      ),
      '[]'::jsonb
    )
  from public.price_lists pl
  join public.products p on p.tenant_id = pl.tenant_id
  left join public.product_prices pp on pp.product_id = p.id and pp.price_list_id = pl.id
  where pl.tenant_id = p_tenant_id and not pl.is_catalog_only
  group by pl.id;
$$;

revoke all on function public.price_list_missing_prices(uuid, integer) from public, anon, authenticated;
