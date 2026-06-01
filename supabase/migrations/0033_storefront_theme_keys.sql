-- Migrate deprecated theme keys to minimal
update tenant_storefront_settings
set theme_key = 'minimal'
where theme_key in ('premium-dark', 'soft-commerce');

alter table tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_theme_key_check;

alter table tenant_storefront_settings
  add constraint tenant_storefront_settings_theme_key_check
  check (theme_key in ('minimal', 'pro-blue', 'neutral'));
