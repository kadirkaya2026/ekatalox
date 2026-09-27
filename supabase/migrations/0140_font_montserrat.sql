-- Vitrin yazı tipi seçeneklerine Montserrat (moda vitrinleri; 28 Eyl 2026).
alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_font_key_check;
alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_font_key_check
  check (font_key in ('inter', 'dm-sans', 'plus-jakarta', 'source-sans', 'playfair', 'montserrat'));
