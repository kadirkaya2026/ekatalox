-- Kategori başına ürün sayısı — vitrinde boş kategorileri gizlemek için.
--
-- Neden fonksiyon: müşteri vitrini her istekte kategori ağacını basıyor ve
-- "bu kategoride hiç ürün var mı" sorusunun cevabı lazım. Büyük bayilerde
-- 300'ün üzerinde kategori var (marketgo: 306 kategori / 16.453 ürün), yani
-- kategori başına ayrı count sorgusu atmak 300 gidiş-geliş demek. PostgREST
-- tarafında toplama fonksiyonları kapalı (PGRST123), dolayısıyla tek
-- sorguda gruplama ancak veritabanı fonksiyonuyla mümkün.
--
-- stable: aynı istek içinde tekrar çağrılırsa planlayıcı sonucu yeniden
-- kullanabilsin. security definer DEĞİL — çağıran zaten service role.

create or replace function public.storefront_category_product_counts(p_tenant_id uuid)
returns table (category_id uuid, product_count bigint)
language sql
stable
set search_path = public
as $$
  select p.category_id, count(*)::bigint
  from public.products p
  where p.tenant_id = p_tenant_id
    and p.category_id is not null
  group by p.category_id;
$$;

-- Gruplama bu indeksten faydalanıyor; tenant_id + category_id ikilisi
-- ürün listeleme sorgularında da kullanılıyor.
create index if not exists products_tenant_category_idx
  on public.products (tenant_id, category_id);
