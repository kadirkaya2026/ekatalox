alter table public.tenant_storefront_settings
  add column if not exists price_update_date date,
  add column if not exists is_price_update_date_visible boolean not null default false;
