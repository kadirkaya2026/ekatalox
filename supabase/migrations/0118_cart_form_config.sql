-- Sepet formu alan ayarları: bayi cari adı / telefon / adres / not alanlarının
-- görünürlüğünü, zorunluluğunu ve etiketini belirler (bkz.
-- lib/storefront/cart-form-config.ts). NULL = eski davranış.
alter table public.tenant_storefront_settings
  add column if not exists cart_form_config jsonb;
