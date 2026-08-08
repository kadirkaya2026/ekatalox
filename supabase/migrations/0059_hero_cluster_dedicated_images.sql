-- "Büyük banner + yan kutucuklar" (heroCluster) bloğu artık anasayfa banner
-- carousel'ıyla aynı görselleri paylaşmıyor — kendi oranına (3:2 büyük,
-- 16:9 yan) uygun, kendi yüklenen görsellerini kullanıyor. Bu sayede doğru
-- boyutta yüklenen bir görsel hiçbir yerde kırpılmıyor.
alter table public.tenant_storefront_settings
  add column if not exists hero_cluster_items jsonb not null default '[]'::jsonb;

alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_hero_cluster_items_array_check;

alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_hero_cluster_items_array_check
  check (jsonb_typeof(hero_cluster_items) = 'array');

alter table public.tenant_storefront_settings
  add column if not exists is_hero_cluster_visible_on_mobile boolean not null default true;
