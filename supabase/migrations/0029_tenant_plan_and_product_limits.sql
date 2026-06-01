-- Add subscription plan to tenants and align product limits with plan tiers.

alter table public.tenants
  add column if not exists plan text;

update public.tenants
set
  max_product_limit = case
    when max_product_limit = 300 then 500
    else max_product_limit
  end,
  plan = case
    when max_product_limit = 300 then 'baslangic'
    when max_product_limit = 500 then 'baslangic'
    when max_product_limit = 1000 then 'profesyonel'
    else 'baslangic'
  end
where plan is null;

alter table public.tenants
  alter column plan set default 'baslangic';

alter table public.tenants
  alter column plan set not null;

alter table public.tenants
  drop constraint if exists tenants_max_product_limit_check;

alter table public.tenants
  add constraint tenants_max_product_limit_check
  check (max_product_limit in (500, 1000, 2500));

alter table public.tenants
  drop constraint if exists tenants_plan_check;

alter table public.tenants
  add constraint tenants_plan_check
  check (plan in ('baslangic', 'profesyonel', 'kurumsal'));

alter table public.tenants
  drop constraint if exists tenants_plan_limit_consistency_check;

alter table public.tenants
  add constraint tenants_plan_limit_consistency_check
  check (
    (plan = 'baslangic' and max_product_limit = 500)
    or (plan = 'profesyonel' and max_product_limit = 1000)
    or (plan = 'kurumsal' and max_product_limit = 2500)
  );
