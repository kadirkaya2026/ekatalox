-- Kupon kategori kapsamı: null/boş = tüm ürünler; doluysa yalnız bu
-- kategorilerdeki (alt kategoriler dahil, uygulama katmanında genişletilir)
-- ürünlerin tutarı kupona sayılır.
alter table public.customer_coupons
  add column if not exists category_ids uuid[];
notify pgrst, 'reload schema';
