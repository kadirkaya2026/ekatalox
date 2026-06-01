alter table tenant_storefront_settings
  add column if not exists layout_key text not null default 'classic-grid';

alter table tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_layout_key_check;

alter table tenant_storefront_settings
  add constraint tenant_storefront_settings_layout_key_check
  check (layout_key in ('classic-grid', 'catalog-dense', 'catalog-list'));
