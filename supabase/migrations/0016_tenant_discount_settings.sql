alter table public.tenant_storefront_settings
  add column if not exists discount_threshold numeric(12, 2) not null default 0,
  add column if not exists discount_percentage numeric(5, 2) not null default 0,
  add column if not exists is_discount_active boolean not null default false;

alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_discount_threshold_check;

alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_discount_threshold_check
  check (discount_threshold >= 0);

alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_discount_percentage_check;

alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_discount_percentage_check
  check (discount_percentage >= 0 and discount_percentage <= 100);

alter table public.tenant_storefront_settings
  add column if not exists discount_condition_note text;