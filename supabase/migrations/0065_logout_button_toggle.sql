-- Tenant admin, vitrin üst menüsündeki "Çıkış" (oturumdan çıkış) butonunu
-- açıp kapatabilsin. Kapalıyken StorefrontLogoutButton hiç render edilmez
-- (bkz. components/storefront/storefront-header.tsx).
alter table public.tenant_storefront_settings
  add column if not exists is_logout_button_visible boolean not null default true;
