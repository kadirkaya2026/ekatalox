alter table tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_layout_key_check;

alter table tenant_storefront_settings
  add constraint tenant_storefront_settings_layout_key_check
  check (layout_key in ('classic-grid', 'catalog-dense', 'catalog-list', 'sidebar-pro'));
