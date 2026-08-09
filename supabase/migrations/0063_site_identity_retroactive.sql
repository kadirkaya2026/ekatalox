alter table public.tenant_storefront_settings
  add column if not exists site_tab_title text,
  add column if not exists site_favicon_url text;
