-- market_catalog_products.image_url artık kaynağın (Migros) CDN'ine değil,
-- bu bucket'taki tek merkezi kopyaya işaret ediyor. Tenant'lar katalogdan
-- ürün eklerken sadece bu URL string'ini kendi products satırına kopyalıyor
-- (app/api/tenant/products/import-from-catalog/route.ts) — dosya tekrar
-- yüklenmiyor, tüm tenant'lar aynı dosyayı gösteriyor.
insert into storage.buckets (id, name, public)
values ('market-catalog-images', 'market-catalog-images', true)
on conflict (id) do nothing;

drop policy if exists "public read market catalog images" on storage.objects;
create policy "public read market catalog images"
on storage.objects
for select
using (bucket_id = 'market-catalog-images');

drop policy if exists "super admin manage market catalog images" on storage.objects;
create policy "super admin manage market catalog images"
on storage.objects
for all
using (
  bucket_id = 'market-catalog-images'
  and public.is_super_admin()
)
with check (
  bucket_id = 'market-catalog-images'
  and public.is_super_admin()
);
