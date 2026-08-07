alter table public.tenant_storefront_settings
  add column if not exists is_theme_toggle_visible boolean not null default true;
