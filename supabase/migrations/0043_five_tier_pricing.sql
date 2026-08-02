-- Yeni 5'li paket yapısı (start/pro/business/enterprise/vip) eski 3 paketle
-- (baslangic/profesyonel/kurumsal) birlikte yaşar. Mevcut tenant satırlarına
-- dokunulmaz; sadece yeni kayıtlar yeni planları kullanır.
-- Eşleşmeler lib/billing/plans.ts ile senkron tutulmalıdır.

-- Yeni tenant satırları (admin panelinden manuel oluşturulanlar dahil) artık
-- yeni track'in giriş paketiyle başlar; mevcut satırlar etkilenmez.
alter table public.tenants
  alter column plan set default 'start';

alter table public.tenants
  drop constraint if exists tenants_plan_check;

alter table public.tenants
  add constraint tenants_plan_check
  check (
    plan in (
      'baslangic', 'profesyonel', 'kurumsal',
      'start', 'pro', 'business', 'enterprise', 'vip'
    )
  );

alter table public.tenants
  drop constraint if exists tenants_max_product_limit_check;

alter table public.tenants
  add constraint tenants_max_product_limit_check
  check (max_product_limit in (200, 500, 1000, 2000, 2500, 5000));

alter table public.tenants
  drop constraint if exists tenants_plan_limit_consistency_check;

alter table public.tenants
  add constraint tenants_plan_limit_consistency_check
  check (
    (plan = 'baslangic' and max_product_limit = 500)
    or (plan = 'profesyonel' and max_product_limit = 1000)
    or (plan = 'kurumsal' and max_product_limit = 2500)
    or (plan = 'start' and max_product_limit = 200)
    or (plan = 'pro' and max_product_limit = 500)
    or (plan = 'business' and max_product_limit = 1000)
    or (plan = 'enterprise' and max_product_limit = 2000)
    or (plan = 'vip' and max_product_limit = 5000)
  );

-- Aylık ziyaretçi kotası: satın alınmış ek kapasite + anlık aşım bayrağı.
-- Bayrak, record_storefront_analytics() içinde her yeni benzersiz ziyaretçi
-- kaydında güncellenir; proxy.ts zaten 60sn önbelleğe aldığı tenant satırından
-- ekstra sorgu yapmadan okur.
alter table public.tenants
  add column if not exists visitor_limit_addon integer not null default 0
    check (visitor_limit_addon >= 0),
  add column if not exists visitor_quota_exceeded boolean not null default false;

create table if not exists public.tenant_monthly_usage (
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  usage_month   date not null,
  visitor_count integer not null default 0 check (visitor_count >= 0),
  primary key (tenant_id, usage_month)
);

alter table public.tenant_monthly_usage enable row level security;

create policy "tenant admin read own monthly usage"
  on public.tenant_monthly_usage
  for select
  using (public.is_tenant_member(tenant_id));

-- record_storefront_analytics(): visit dalına, benzersiz ziyaretçi ilk kez
-- sayıldığında aylık sayaç artırma + kota bayrağı güncelleme eklendi.
-- Plan başına ziyaretçi limitleri lib/billing/plans.ts PLAN_VISITOR_LIMITS
-- ile senkron tutulmalıdır.
create or replace function public.record_storefront_analytics(
  p_tenant_id uuid,
  p_event text,
  p_product_id uuid default null,
  p_visitor_key text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stat_date date := (timezone('Europe/Istanbul', now()))::date;
  v_inserted int;
  v_monthly_count int;
  v_plan text;
  v_addon int;
  v_limit int;
begin
  if p_event = 'visit' then
    if p_visitor_key is null or length(trim(p_visitor_key)) = 0 then
      return;
    end if;

    insert into public.storefront_analytics_visitors (tenant_id, stat_date, visitor_key)
    values (p_tenant_id, v_stat_date, p_visitor_key)
    on conflict do nothing;

    get diagnostics v_inserted = row_count;

    if v_inserted > 0 then
      insert into public.tenant_monthly_usage (tenant_id, usage_month, visitor_count)
      values (p_tenant_id, date_trunc('month', v_stat_date)::date, 1)
      on conflict (tenant_id, usage_month)
      do update set visitor_count = tenant_monthly_usage.visitor_count + 1
      returning visitor_count into v_monthly_count;

      select plan, visitor_limit_addon into v_plan, v_addon
      from public.tenants where id = p_tenant_id;

      v_limit := (case v_plan
        when 'baslangic' then 10000
        when 'start' then 10000
        when 'pro' then 25000
        when 'profesyonel' then 50000
        when 'business' then 50000
        when 'kurumsal' then 100000
        when 'enterprise' then 100000
        when 'vip' then 500000
        else 10000
      end) + coalesce(v_addon, 0);

      update public.tenants
      set visitor_quota_exceeded = (v_monthly_count >= v_limit)
      where id = p_tenant_id;
    end if;

  elsif p_event = 'product_view' then
    if p_product_id is null then
      return;
    end if;

    insert into public.storefront_analytics_product_daily (
      tenant_id,
      product_id,
      stat_date,
      view_count,
      cart_add_count
    )
    values (p_tenant_id, p_product_id, v_stat_date, 1, 0)
    on conflict (tenant_id, product_id, stat_date)
    do update set view_count = storefront_analytics_product_daily.view_count + 1;

  elsif p_event = 'cart_add' then
    if p_product_id is null then
      return;
    end if;

    insert into public.storefront_analytics_product_daily (
      tenant_id,
      product_id,
      stat_date,
      view_count,
      cart_add_count
    )
    values (p_tenant_id, p_product_id, v_stat_date, 0, 1)
    on conflict (tenant_id, product_id, stat_date)
    do update set cart_add_count = storefront_analytics_product_daily.cart_add_count + 1;

  end if;
end;
$$;

revoke all on function public.record_storefront_analytics(uuid, text, uuid, text) from public;
