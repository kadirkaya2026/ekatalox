-- Getirme (teslimat) ücreti — yalnız market tipi tenantlar (kullanıcı isteği,
-- 3 Eyl 2026).
--
-- Bayi isterse siparişe otomatik bir teslimat ücreti ekletir. Üç ayar:
--   is_delivery_fee_active      -> özellik açık/kapalı
--   delivery_fee_amount         -> baraj altındaki siparişe eklenen ücret
--                                  (0 verilebilir = fiilen her sipariş ücretsiz)
--   delivery_fee_free_threshold -> bu tutar (ara toplam) ve üzeri siparişlerde
--                                  ücret 0. 0 = baraj yok, her siparişe ücret.
--
-- Ücret gerçek bir sepet kalemi DEĞİL; sepet özetinde ayrı satır olarak
-- gösterilir ve genel toplama eklenir (bkz. lib/storefront/cart.ts
-- getCartPaymentSummary, components/storefront/storefront-cart-drawer.tsx,
-- lib/storefront/order-receipt-pdf.ts). Para birimi alanı bilerek yok:
-- sepet zaten tek para birimine kilitli (min_cart_amount ile aynı varsayım).
-- Özellik yalnız business_type = 'market' tenantlarda uygulanır (gate hem
-- panelde hem storefront'ta kodda).
alter table public.tenant_storefront_settings
  add column if not exists is_delivery_fee_active boolean not null default false;

alter table public.tenant_storefront_settings
  add column if not exists delivery_fee_amount numeric not null default 0;

alter table public.tenant_storefront_settings
  add column if not exists delivery_fee_free_threshold numeric not null default 0;
