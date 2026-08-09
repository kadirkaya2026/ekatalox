-- Tenant admin, demo/tanıtım amaçlı vitrinlerde müşterilerin şifre girmeden
-- doğrudan girebilmesi için erişim kodu zorunluluğunu kapatabilsin. Kapalıyken
-- storefront sayfası gate'i atlar ve tenant'ın ilk (sort_order'a göre) fiyat
-- listesini otomatik uygular — bkz. app/store/[subdomain]/page.tsx.
alter table public.tenants
  add column if not exists is_password_protected boolean not null default true;
