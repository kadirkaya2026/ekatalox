-- Kaynaktan (varsa) ürün açıklaması — içe aktarımda tenant ürününe kopyalanır,
-- admin dilerse Düzenle'den değiştirebilir.
alter table public.market_catalog_products
  add column if not exists description text;
