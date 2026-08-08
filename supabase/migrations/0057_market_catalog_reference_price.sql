-- Kaynağın kendi satış fiyatı (varsa) — tenant admin ürünü içe aktarırken
-- fiyat listelerine öneri olarak yazılır, admin dilediği gibi değiştirebilir.
alter table public.market_catalog_products
  add column if not exists reference_price numeric;
