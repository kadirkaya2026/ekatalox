-- Standart kategori ikonları — Master Katalog taksonomisindeki 21 ana
-- kategori için elle hazırlanmış, tüm tenant'larda ortak kullanılan
-- görseller (bkz. lib/storefront/default-category-icons.ts). Tenant'ların
-- kendi ürün fotoğraflarından rastgele bir "temsilci ürün" seçmek yerine
-- (bkz. lib/data.ts getStorefrontCategoryRepresentativeImages) marketgo
-- tenant'ının manuel yüklediği görsellerle aynı, tutarlı bir görünüm
-- sağlar (kullanıcı geri bildirimi, 18 Ağu 2026). Bucket'ın kendisi ve
-- dosyalar, bu projedeki bilinen `supabase db push` migration geçmişi
-- sorunu yüzünden (bkz. market-catalog-images bucket'ındaki aynı not)
-- doğrudan Storage API'siyle (service role) oluşturuldu/yüklendi — bu
-- dosya sadece niyeti/policy'leri belgeliyor.
insert into storage.buckets (id, name, public)
values ('category-icons', 'category-icons', true)
on conflict (id) do nothing;

drop policy if exists "public read category icons" on storage.objects;
create policy "public read category icons"
on storage.objects
for select
using (bucket_id = 'category-icons');

drop policy if exists "super admin manage category icons" on storage.objects;
create policy "super admin manage category icons"
on storage.objects
for all
using (
  bucket_id = 'category-icons'
  and public.is_super_admin()
)
with check (
  bucket_id = 'category-icons'
  and public.is_super_admin()
);
