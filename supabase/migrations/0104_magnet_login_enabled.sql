-- Magnetle şifresiz giriş (tenant başına anahtar).
--
-- Açıkken: magnetteki QR'ı okutan ziyaretçi (kod DB'den doğrulanır) şifre
-- görmeden vitrine girer; düz linkle gelen herkes şifre kapısına düşer.
-- Amaç link paylaşımını kırmak: magnet fiziksel anahtar gibi davranır,
-- adres çubuğundaki temiz URL kopyalanıp paylaşılsa işe yaramaz (giriş
-- yetkisi çerezde). Akış: proxy.ts → /api/storefront/magnet-enter.
alter table public.tenants
  add column if not exists magnet_login_enabled boolean not null default false;
