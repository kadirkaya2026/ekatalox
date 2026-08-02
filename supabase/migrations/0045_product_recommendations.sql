-- Sepet "Bunları da beğenebilirsiniz" alanı için: ürün bazlı manuel öneri
-- işareti ve tenant bazlı otomatik/manuel öneri modu.

alter table public.products
  add column if not exists is_recommended boolean not null default false;

alter table public.tenant_storefront_settings
  add column if not exists recommendation_mode text not null default 'auto';

alter table public.tenant_storefront_settings
  drop constraint if exists tenant_storefront_settings_recommendation_mode_check;

alter table public.tenant_storefront_settings
  add constraint tenant_storefront_settings_recommendation_mode_check
    check (recommendation_mode in ('auto', 'manual'));
