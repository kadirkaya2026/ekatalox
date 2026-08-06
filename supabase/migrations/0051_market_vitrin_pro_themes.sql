-- İki yeni hazır tema seçeneği: "market" (Getir/market uygulamaları esintili)
-- ve "vitrin-pro" (Ticimax gibi kurumsal e-ticaret vitrinleri esintili).
alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_theme_key_check;

alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_theme_key_check
  check (theme_key in (
    'minimal',
    'pro-blue',
    'neutral',
    'industrial',
    'premium',
    'catalog-first',
    'market',
    'vitrin-pro'
  ));
