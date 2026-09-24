-- Toptancı paket limitleri güncellemesi (24 Eyl 2026).
-- lib/billing/plans.ts (PLAN_OPTIONS, PLAN_PRICE_LIST_LIMITS) ve
-- lib/billing/toptan-plans.ts ile senkron:
--   free         (Ücretsiz)   200  → 250 ürün,    1 → 2 fiyat listesi
--   starter      (Başlangıç)  1000 → 2500 ürün,   3 fiyat listesi
--   professional (Profesyonel) 2500 → 5000 ürün,  sınırsız → 15 fiyat listesi
--   corporate    (Kurumsal)   5000 → 20000 ürün,  sınırsız fiyat listesi
-- Fiyat listesi limiti yalnız uygulamada (getPriceListLimit); DB'de yalnız
-- ürün limiti kısıtlı. Eski planlar (start, pro, vip…) değişmez.

alter table public.tenants
  drop constraint if exists tenants_plan_limit_consistency_check;

alter table public.tenants
  drop constraint if exists tenants_max_product_limit_check;

update public.tenants set max_product_limit = 250 where plan = 'free';
update public.tenants set max_product_limit = 2500 where plan = 'starter';
update public.tenants set max_product_limit = 5000 where plan = 'professional';
update public.tenants set max_product_limit = 20000 where plan = 'corporate';

alter table public.tenants
  add constraint tenants_max_product_limit_check
  check (max_product_limit in (200, 250, 500, 1000, 2000, 2500, 5000, 20000));

alter table public.tenants
  add constraint tenants_plan_limit_consistency_check check (
    (plan = 'baslangic' and max_product_limit = 500)
    or (plan = 'profesyonel' and max_product_limit = 1000)
    or (plan = 'kurumsal' and max_product_limit = 2500)
    or (plan = 'start' and max_product_limit = 200)
    or (plan = 'pro' and max_product_limit in (500, 1000))
    or (plan = 'business' and max_product_limit in (1000, 2500))
    or (plan = 'enterprise' and max_product_limit = 2000)
    or (plan = 'vip' and max_product_limit = 5000)
    or (plan = 'free' and max_product_limit = 250)
    or (plan = 'starter' and max_product_limit = 2500)
    or (plan = 'professional' and max_product_limit = 5000)
    or (plan = 'corporate' and max_product_limit = 20000)
  );
