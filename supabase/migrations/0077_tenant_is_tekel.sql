-- Alkol/sigara bayii (tekel) tenant'lar yasal olarak dağıtım/teslimat
-- yapamıyor — süper admin bir tenant'ı "market" işaretlediğinde ayrıca
-- "Tekel" olarak da işaretleyebilsin diye (kullanıcı isteği, 20 Ağu 2026).
-- true olduğunda storefront artık teslimat adresi toplamaz, sepet/checkout
-- metinleri "sipariş listesi hazırlama" diline döner (bkz.
-- lib/storefront/cart.ts, storefront-client.tsx, storefront-cart-drawer.tsx).
alter table public.tenants
  add column if not exists is_tekel boolean not null default false;
