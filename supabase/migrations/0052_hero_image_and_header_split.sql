-- Hero bölümüne görsel desteği (şu ana kadar tamamen metin) ve header'a
-- yeni bir yapısal varyant ("split") ekliyoruz. Tema Paketleri (theme-presets)
-- özelliği için gerekli altyapı.

alter table public.tenant_storefront_settings
  add column if not exists hero_image_url text,
  add column if not exists hero_style_key text not null default 'text';

alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_hero_style_key_check;

alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_hero_style_key_check
  check (hero_style_key = any (array['text', 'image-split', 'full-bleed']));

alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_header_style_key_check;

alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_header_style_key_check
  check (header_style_key = any (array['standard', 'centered', 'minimal', 'split']));
