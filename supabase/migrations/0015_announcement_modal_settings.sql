alter table public.tenant_storefront_settings
  add column if not exists announcement_title text,
  add column if not exists announcement_body text,
  add column if not exists is_active boolean not null default false,
  add column if not exists version integer not null default 0,
  add column if not exists max_display_count integer not null default 1;

alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_max_display_count_check;

alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_max_display_count_check
  check (max_display_count >= 1);