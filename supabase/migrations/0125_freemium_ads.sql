-- Freemium paket merdiveni + eKatalox reklam ayarları (20 Eyl 2026).
-- lib/billing/plans.ts ile senkron: free (Ücretsiz, reklamlı, 200 ürün),
-- starter (Başlangıç 1.000), professional (Profesyonel 2.500),
-- corporate (Kurumsal 5.000). Mevcut tenant'lara dokunulmaz.
--
-- Bu dosya Supabase SQL Editor'den elle uygulanır (supabase db push
-- çalışmıyor, bkz. proje notları).

-- 1) tenants.plan kısıtı: 4 yeni plan
alter table public.tenants
  drop constraint if exists tenants_plan_check;

alter table public.tenants
  add constraint tenants_plan_check
  check (
    plan in (
      'baslangic', 'profesyonel', 'kurumsal',
      'start', 'pro', 'business', 'enterprise', 'vip',
      'free', 'starter', 'professional', 'corporate'
    )
  );

-- 2) plan ↔ ürün limiti tutarlılığı (0115'in devamı)
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
    or (plan = 'free' and max_product_limit = 200)
    or (plan = 'starter' and max_product_limit = 1000)
    or (plan = 'professional' and max_product_limit = 2500)
    or (plan = 'corporate' and max_product_limit = 5000)
  );

-- 3) Platform geneli (tenant'a bağlı olmayan) ayarlar: key → jsonb.
--    İlk kullanıcı: 'storefront_ads' (lib/ads/config.ts). Yalnız service
--    role okur/yazar; politika yok → anon/authenticated hiçbir satır göremez.
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.platform_settings enable row level security;

-- 4) Aylık ziyaretçi kotası: yeni planlar (PLAN_VISITOR_LIMITS ile senkron).
--    İmza 0117 ile aynı, yalnız CASE genişletildi.
create or replace function public.record_storefront_analytics(
  p_tenant_id uuid,
  p_event text,
  p_product_id uuid default null,
  p_visitor_key text default null,
  p_province_code text default null,
  p_price_list_id uuid default null,
  p_access_code_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stat_date date := (timezone('Europe/Istanbul', now()))::date;
  v_stat_hour smallint := extract(hour from timezone('Europe/Istanbul', now()))::smallint;
  v_province text := nullif(trim(p_province_code), '');
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

    insert into public.storefront_analytics_visitors (
      tenant_id, stat_date, visitor_key, province_code, price_list_id, access_code_id
    )
    values (p_tenant_id, v_stat_date, p_visitor_key, v_province, p_price_list_id, p_access_code_id)
    on conflict do nothing;

    get diagnostics v_inserted = row_count;

    if v_inserted = 0 then
      update public.storefront_analytics_visitors
      set province_code  = coalesce(province_code, v_province),
          price_list_id  = coalesce(price_list_id, p_price_list_id),
          access_code_id = coalesce(access_code_id, p_access_code_id)
      where tenant_id = p_tenant_id
        and stat_date = v_stat_date
        and visitor_key = p_visitor_key
        and (
          (province_code is null and v_province is not null)
          or (price_list_id is null and p_price_list_id is not null)
          or (access_code_id is null and p_access_code_id is not null)
        );
    end if;

    perform public.record_storefront_visit_hour(p_tenant_id, v_stat_hour);

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
        when 'free' then 1000
        when 'starter' then 5000
        when 'professional' then 20000
        when 'corporate' then 50000
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
      tenant_id, product_id, stat_date, view_count, cart_add_count
    )
    values (p_tenant_id, p_product_id, v_stat_date, 1, 0)
    on conflict (tenant_id, product_id, stat_date)
    do update set view_count = storefront_analytics_product_daily.view_count + 1;

  elsif p_event = 'cart_add' then
    if p_product_id is null then
      return;
    end if;

    insert into public.storefront_analytics_product_daily (
      tenant_id, product_id, stat_date, view_count, cart_add_count
    )
    values (p_tenant_id, p_product_id, v_stat_date, 0, 1)
    on conflict (tenant_id, product_id, stat_date)
    do update set cart_add_count = storefront_analytics_product_daily.cart_add_count + 1;

  end if;
end;
$$;

revoke all on function public.record_storefront_analytics(uuid, text, uuid, text, text, uuid, uuid) from public;
