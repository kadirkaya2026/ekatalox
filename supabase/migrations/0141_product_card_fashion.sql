-- Ürün kartı stili: "fashion" (Moda, tam boy 2:3; tekstil vitrinleri, 28 Eyl 2026).
alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_product_card_style_check;
alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_product_card_style_check
  check (product_card_style in ('standard', 'compact', 'image-forward', 'fashion'));
