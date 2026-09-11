-- Vitrin ziyaretçilerinin il bazlı dağılımı (kullanıcı isteği, 11 Eyl 2026).
--
-- Toptancı (business_type = general) panelinde "hangi ilden kaç kişi girdi"
-- raporu için benzersiz ziyaretçi satırına il kodu eklenir. İl, Vercel'in
-- x-vercel-ip-country-region başlığından (TR için ISO 3166-2 = plaka kodu,
-- ör. "34") gelir; yurt dışı için "XX:<ülke>" saklanır, eski satırlar null
-- kalır ve raporda "Bilinmiyor" olarak görünür.
--
-- NOT: record_storefront_analytics imzası değiştiği için eski sürüm önce
-- düşürülür (aksi halde adlandırılmış çağrı iki aşırı yükleme arasında
-- belirsiz kalır). Kod, eski imza hâlâ yayındaysa il parametresiz çağrıya
-- geri düşer (app/api/storefront/analytics/route.ts).

alter table public.storefront_analytics_visitors
  add column if not exists province_code text;

create index if not exists storefront_analytics_visitors_tenant_date_province_idx
  on public.storefront_analytics_visitors (tenant_id, stat_date, province_code);

drop function if exists public.record_storefront_analytics(uuid, text, uuid, text);

create or replace function public.record_storefront_analytics(
  p_tenant_id uuid,
  p_event text,
  p_product_id uuid default null,
  p_visitor_key text default null,
  p_province_code text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stat_date date := (timezone('Europe/Istanbul', now()))::date;
  v_stat_hour smallint := extract(hour from timezone('Europe/Istanbul', now()))::smallint;
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

    insert into public.storefront_analytics_visitors (tenant_id, stat_date, visitor_key, province_code)
    values (p_tenant_id, v_stat_date, p_visitor_key, nullif(trim(p_province_code), ''))
    on conflict do nothing;

    get diagnostics v_inserted = row_count;

    -- Aynı gün daha önce il bilgisi olmadan sayılmışsa ili tamamla.
    if v_inserted = 0 and nullif(trim(p_province_code), '') is not null then
      update public.storefront_analytics_visitors
      set province_code = trim(p_province_code)
      where tenant_id = p_tenant_id
        and stat_date = v_stat_date
        and visitor_key = p_visitor_key
        and province_code is null;
    end if;

    -- 0032'de vardı, 0043 yeniden yazımında düşmüştü: saatlik trafik sayacı.
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

revoke all on function public.record_storefront_analytics(uuid, text, uuid, text, text) from public;

-- Rapor: aralıktaki benzersiz ziyaretçileri ile göre sayar.
create or replace function public.storefront_visitor_provinces(
  p_tenant_id uuid,
  p_start_date date,
  p_end_date date
)
returns table (province_code text, visitor_count integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(province_code, '') as province_code,
    count(distinct visitor_key)::integer as visitor_count
  from public.storefront_analytics_visitors
  where tenant_id = p_tenant_id
    and stat_date >= p_start_date
    and stat_date <= p_end_date
  group by 1
  order by 2 desc, 1;
$$;

revoke all on function public.storefront_visitor_provinces(uuid, date, date) from public;
