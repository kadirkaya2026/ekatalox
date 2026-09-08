-- Esnaf paketleri (8 Eyl 2026): pro = Esnaf 1.000 ürün, business = Esnaf Plus
-- 2.500 ürün (lib/billing/plans.ts). Mevcut tenantların eski limitleri
-- (pro 500, business 1000) geçerli kalır; kısıt her iki değeri de kabul eder.
alter table public.tenants
  drop constraint if exists tenants_plan_limit_consistency_check;

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
  );
