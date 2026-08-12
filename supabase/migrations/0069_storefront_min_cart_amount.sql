-- Minimum sepet tutarı: tenant admin isterse siparişin tamamlanabilmesi için
-- (WhatsApp ile sipariş) sepetin en az belirli bir tutara ulaşmasını
-- zorunlu kılabilir, isterse hiç minimum uygulamadan sipariş alabilir
-- (bkz. lib/storefront/cart.ts, components/storefront/storefront-cart-drawer.tsx).
alter table public.tenant_storefront_settings
  add column if not exists is_min_cart_amount_active boolean not null default false;

alter table public.tenant_storefront_settings
  add column if not exists min_cart_amount numeric not null default 0;
