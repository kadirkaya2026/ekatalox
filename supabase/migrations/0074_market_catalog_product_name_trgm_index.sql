-- Master Katalog isim aramaları (Master Katalog sayfası + stok listesi
-- eşleştirmesinin isim bazlı yedek araması, bkz. app/api/tenant/products/
-- stock-import/match/route.ts) product_name üzerinde ILIKE '%terim%'
-- kullanıyor. product_name'de hiç index olmadığı için (bkz.
-- 0056_market_catalog.sql — sadece category_name index'li) bu her seferinde
-- 45k+ satırlık tam tarama demekti; stok listesi eşleştirmesi satır başına
-- bunu yüzlerce kez tekrarlayınca 10sn'lik işlem 2+ dakikaya çıktı (18 Ağu
-- 2026). pg_trgm GIN index, '%terim%' gibi ortadan-eşleşen ILIKE
-- sorgularını index taramasına çevirir.
create extension if not exists pg_trgm;

create index if not exists market_catalog_products_product_name_trgm_idx
  on public.market_catalog_products using gin (product_name gin_trgm_ops);
