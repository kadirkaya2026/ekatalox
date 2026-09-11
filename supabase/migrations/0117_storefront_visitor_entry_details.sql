-- Ziyaretçi İlleri raporu: girenin hangi şifreyle hangi fiyat listesine
-- girdiği (kullanıcı isteği, 11 Eyl 2026). 0116'nın devamı.
--
-- Vitrin kapısından geçen ziyaretçinin çerezinde fiyat listesi + şifre kimliği
-- taşınır (lib/storefront/session.ts); ziyaret beacon'ı bunları RPC'ye geçirir.
-- Şifresiz giriş (auto-enter / magnet) → access_code_id null, price_list_id dolu.
-- FK yok: şifre/liste silinse de geçmiş satır kalsın ("Silinmiş şifre").
--
-- İmza yine değişti (5 → 7 parametre): eski sürüm önce düşürülür. Kod, eski
-- imza yayındaysa 5 parametreli çağrıya geri düşer.

alter table public.storefront_analytics_visitors
  add column if not exists price_list_id uuid,
  add column if not exists access_code_id uuid,
  add column if not exists first_seen_at timestamptz not null default now();

create index if not exists storefront_analytics_visitors_tenant_first_seen_idx
  on public.storefront_analytics_visitors (tenant_id, first_seen_at desc);

drop function if exists public.record_storefront_analytics(uuid, text, uuid, text, text);

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

    -- Aynı gün daha önce sayılmışsa eksik bilgileri tamamla (il / liste / şifre).
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

-- Şifre + liste bazında benzersiz ziyaretçi.
create or replace function public.storefront_visitor_access_breakdown(
  p_tenant_id uuid,
  p_start_date date,
  p_end_date date
)
returns table (price_list_id uuid, access_code_id uuid, visitor_count integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    price_list_id,
    access_code_id,
    count(distinct visitor_key)::integer as visitor_count
  from public.storefront_analytics_visitors
  where tenant_id = p_tenant_id
    and stat_date >= p_start_date
    and stat_date <= p_end_date
  group by 1, 2
  order by 3 desc;
$$;

revoke all on function public.storefront_visitor_access_breakdown(uuid, date, date) from public;

-- Son girişler: kim, ne zaman, hangi il, hangi şifre/liste.
create or replace function public.storefront_visitor_entries(
  p_tenant_id uuid,
  p_start_date date,
  p_end_date date,
  p_limit integer default 100
)
returns table (
  visitor_key text,
  stat_date date,
  first_seen_at timestamptz,
  province_code text,
  price_list_id uuid,
  access_code_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select visitor_key, stat_date, first_seen_at, province_code, price_list_id, access_code_id
  from public.storefront_analytics_visitors
  where tenant_id = p_tenant_id
    and stat_date >= p_start_date
    and stat_date <= p_end_date
  order by first_seen_at desc, stat_date desc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

revoke all on function public.storefront_visitor_entries(uuid, date, date, integer) from public;
