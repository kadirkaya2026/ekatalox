-- En Çok Satanlar: "Öne Çıkan Bölümler"den (storefront_sections, elle seçilen
-- ürünler) farklı olarak burada ürün listesi tamamen otomatik hesaplanır —
-- son 30 gündeki gerçek sepete-ekleme sayısına göre (storefront_analytics_
-- product_daily.cart_add_count, bkz. 0022_storefront_analytics.sql). Admin
-- sadece bölümü aç/kapat, başlığını değiştir ve kaç ürün gösterileceğini
-- seçer — hangi ürünlerin göründüğünü seçemez.
alter table public.tenant_storefront_settings
  add column if not exists is_best_sellers_visible boolean not null default false;

alter table public.tenant_storefront_settings
  add column if not exists best_sellers_title text not null default 'En Çok Satanlar';

alter table public.tenant_storefront_settings
  add column if not exists best_sellers_product_count integer not null default 8;

alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_best_sellers_count_check;

alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_best_sellers_count_check
  check (best_sellers_product_count between 4 and 24);
