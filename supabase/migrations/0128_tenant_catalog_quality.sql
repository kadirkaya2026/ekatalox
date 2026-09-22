-- Genel Bakış "Katalog sağlığı" kartı (22 Eyl 2026): bayinin bir bakışta
-- görmesi gereken eksikler — stok dışı, görselsiz, fiyatsız ürün sayısı.
-- Tek RPC: 28k ürünlü tenantta üç count'u uygulama tarafında çekmek yerine
-- DB'de sayıyoruz. "Fiyatsız" = hiçbir fiyat listesinde (ürün ya da
-- varyant düzeyinde) pozitif fiyatı olmayan ürün.

create or replace function public.tenant_catalog_quality(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'out_of_stock', (
      select count(*) from public.products p
       where p.tenant_id = p_tenant_id and p.is_in_stock = false
    ),
    'no_image', (
      select count(*) from public.products p
       where p.tenant_id = p_tenant_id
         and nullif(trim(coalesce(p.image_url, '')), '') is null
    ),
    'no_price', (
      select count(*) from public.products p
       where p.tenant_id = p_tenant_id
         and not exists (
           select 1 from public.product_prices pp
            where pp.product_id = p.id and coalesce(pp.price, 0) > 0
         )
         and not exists (
           select 1 from public.product_variants v
             join public.product_variant_prices vp on vp.variant_id = v.id
            where v.product_id = p.id and coalesce(vp.price, 0) > 0
         )
    )
  );
$$;

revoke all on function public.tenant_catalog_quality(uuid) from public;
notify pgrst, 'reload schema';
