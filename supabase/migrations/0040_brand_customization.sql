-- Storefront differentiation: brand colors, fonts, layout styles, homepage blocks

alter table public.tenant_storefront_settings
  add column if not exists brand_primary_color text,
  add column if not exists brand_accent_color text,
  add column if not exists font_key text not null default 'inter',
  add column if not exists product_card_style text not null default 'standard',
  add column if not exists header_style_key text not null default 'standard',
  add column if not exists is_hero_visible boolean not null default false,
  add column if not exists homepage_blocks jsonb not null default '[
    {"id":"hero","visible":true,"order":1},
    {"id":"banner","visible":true,"order":2},
    {"id":"campaigns","visible":true,"order":3},
    {"id":"showcase","visible":true,"order":4},
    {"id":"catalog","visible":true,"order":5}
  ]'::jsonb,
  add column if not exists footer_style_key text not null default 'standard';

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
    'catalog-first'
  ));

alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_font_key_check;

alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_font_key_check
  check (font_key in ('inter', 'dm-sans', 'plus-jakarta', 'source-sans', 'playfair'));

alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_product_card_style_check;

alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_product_card_style_check
  check (product_card_style in ('standard', 'compact', 'image-forward'));

alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_header_style_key_check;

alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_header_style_key_check
  check (header_style_key in ('standard', 'centered', 'minimal'));

alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_footer_style_key_check;

alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_footer_style_key_check
  check (footer_style_key in ('standard', 'minimal', 'columns'));
