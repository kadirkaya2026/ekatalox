alter table public.tenant_storefront_settings
  add column if not exists product_image_background text not null default 'theme';

alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_product_image_background_check;

alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_product_image_background_check
  check (product_image_background in ('theme', 'white', 'transparent'));
