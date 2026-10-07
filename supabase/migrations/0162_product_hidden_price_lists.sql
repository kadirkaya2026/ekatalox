-- Ürünü belirli fiyat listelerinden gizleme (kullanıcı isteği, 7 Eki 2026):
-- ürün düzenleme ekranında her liste fiyatının altında "Bu listede gizle"
-- kutusu var. İşaretliyse ürün, o listeyi kullanan müşteriye vitrinde hiç
-- görünmez — fiyat girilmiş olsa bile. Diğer listeler etkilenmez.
-- Dizi products üzerinde tutulur ki vitrin sorguları sayfalama/sayımla
-- birlikte veritabanında süzebilsin (product_prices'a koymak join gerektirirdi).
alter table public.products
  add column if not exists hidden_price_list_ids uuid[] not null default '{}';

create index if not exists products_hidden_price_lists_idx
  on public.products (tenant_id)
  where cardinality(hidden_price_list_ids) > 0;
