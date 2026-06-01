-- Extended storefront report aggregates (orders, search, price-list logins, hourly traffic)

create table if not exists public.storefront_analytics_orders_daily (
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  stat_date    date not null,
  currency     text not null check (currency in ('TRY', 'USD', 'EUR', 'CATALOG')),
  order_count  integer not null default 0 check (order_count >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  primary key (tenant_id, stat_date, currency)
);

create table if not exists public.storefront_analytics_search_daily (
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  stat_date           date not null,
  query_normalized    text not null check (char_length(query_normalized) between 1 and 80),
  search_count        integer not null default 0 check (search_count >= 0),
  zero_result_count   integer not null default 0 check (zero_result_count >= 0),
  primary key (tenant_id, stat_date, query_normalized)
);

create table if not exists public.storefront_analytics_price_list_logins_daily (
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  stat_date       date not null,
  price_list_id   uuid not null,
  access_code_id  uuid not null,
  login_count     integer not null default 0 check (login_count >= 0),
  primary key (tenant_id, stat_date, price_list_id, access_code_id)
);

create table if not exists public.storefront_analytics_traffic_hourly (
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  stat_date    date not null,
  stat_hour    smallint not null check (stat_hour between 0 and 23),
  visit_count  integer not null default 0 check (visit_count >= 0),
  primary key (tenant_id, stat_date, stat_hour)
);

create index if not exists storefront_analytics_orders_daily_tenant_date_idx
  on public.storefront_analytics_orders_daily (tenant_id, stat_date);

create index if not exists storefront_analytics_search_daily_tenant_date_idx
  on public.storefront_analytics_search_daily (tenant_id, stat_date);

create index if not exists storefront_analytics_price_list_logins_daily_tenant_date_idx
  on public.storefront_analytics_price_list_logins_daily (tenant_id, stat_date);

create index if not exists storefront_analytics_traffic_hourly_tenant_date_idx
  on public.storefront_analytics_traffic_hourly (tenant_id, stat_date);

alter table public.storefront_analytics_orders_daily enable row level security;
alter table public.storefront_analytics_search_daily enable row level security;
alter table public.storefront_analytics_price_list_logins_daily enable row level security;
alter table public.storefront_analytics_traffic_hourly enable row level security;

create policy "tenant admin read own analytics orders daily"
  on public.storefront_analytics_orders_daily
  for select
  using (public.is_tenant_member(tenant_id));

create policy "tenant admin read own analytics search daily"
  on public.storefront_analytics_search_daily
  for select
  using (public.is_tenant_member(tenant_id));

create policy "tenant admin read own analytics price list logins daily"
  on public.storefront_analytics_price_list_logins_daily
  for select
  using (public.is_tenant_member(tenant_id));

create policy "tenant admin read own analytics traffic hourly"
  on public.storefront_analytics_traffic_hourly
  for select
  using (public.is_tenant_member(tenant_id));

create or replace function public.record_storefront_order_stat(
  p_tenant_id uuid,
  p_currency text,
  p_total_amount numeric,
  p_is_catalog boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stat_date date := (timezone('Europe/Istanbul', now()))::date;
  v_currency text;
  v_amount numeric(12, 2);
begin
  if p_is_catalog then
    v_currency := 'CATALOG';
    v_amount := 0;
  else
    v_currency := upper(trim(p_currency));
    if v_currency not in ('TRY', 'USD', 'EUR') then
      return;
    end if;
    v_amount := coalesce(p_total_amount, 0);
    if v_amount < 0 then
      return;
    end if;
  end if;

  insert into public.storefront_analytics_orders_daily (
    tenant_id,
    stat_date,
    currency,
    order_count,
    total_amount
  )
  values (p_tenant_id, v_stat_date, v_currency, 1, v_amount)
  on conflict (tenant_id, stat_date, currency)
  do update set
    order_count = storefront_analytics_orders_daily.order_count + 1,
    total_amount = storefront_analytics_orders_daily.total_amount + excluded.total_amount;
end;
$$;

create or replace function public.record_storefront_search_stat(
  p_tenant_id uuid,
  p_query text,
  p_zero_results boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stat_date date := (timezone('Europe/Istanbul', now()))::date;
  v_query text := left(trim(p_query), 80);
begin
  if char_length(v_query) < 2 then
    return;
  end if;

  insert into public.storefront_analytics_search_daily (
    tenant_id,
    stat_date,
    query_normalized,
    search_count,
    zero_result_count
  )
  values (
    p_tenant_id,
    v_stat_date,
    v_query,
    1,
    case when p_zero_results then 1 else 0 end
  )
  on conflict (tenant_id, stat_date, query_normalized)
  do update set
    search_count = storefront_analytics_search_daily.search_count + 1,
    zero_result_count = storefront_analytics_search_daily.zero_result_count
      + case when p_zero_results then 1 else 0 end;
end;
$$;

create or replace function public.record_storefront_price_list_login(
  p_tenant_id uuid,
  p_price_list_id uuid,
  p_access_code_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stat_date date := (timezone('Europe/Istanbul', now()))::date;
begin
  if p_price_list_id is null or p_access_code_id is null then
    return;
  end if;

  insert into public.storefront_analytics_price_list_logins_daily (
    tenant_id,
    stat_date,
    price_list_id,
    access_code_id,
    login_count
  )
  values (p_tenant_id, v_stat_date, p_price_list_id, p_access_code_id, 1)
  on conflict (tenant_id, stat_date, price_list_id, access_code_id)
  do update set
    login_count = storefront_analytics_price_list_logins_daily.login_count + 1;
end;
$$;

create or replace function public.record_storefront_visit_hour(
  p_tenant_id uuid,
  p_stat_hour smallint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stat_date date := (timezone('Europe/Istanbul', now()))::date;
begin
  if p_stat_hour is null or p_stat_hour < 0 or p_stat_hour > 23 then
    return;
  end if;

  insert into public.storefront_analytics_traffic_hourly (
    tenant_id,
    stat_date,
    stat_hour,
    visit_count
  )
  values (p_tenant_id, v_stat_date, p_stat_hour, 1)
  on conflict (tenant_id, stat_date, stat_hour)
  do update set
    visit_count = storefront_analytics_traffic_hourly.visit_count + 1;
end;
$$;

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
  v_stat_hour smallint := extract(hour from timezone('Europe/Istanbul', now()))::smallint;
begin
  if p_event = 'visit' then
    if p_visitor_key is null or length(trim(p_visitor_key)) = 0 then
      return;
    end if;

    insert into public.storefront_analytics_visitors (tenant_id, stat_date, visitor_key)
    values (p_tenant_id, v_stat_date, p_visitor_key)
    on conflict do nothing;

    perform public.record_storefront_visit_hour(p_tenant_id, v_stat_hour);

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

revoke all on function public.record_storefront_order_stat(uuid, text, numeric, boolean) from public;
revoke all on function public.record_storefront_search_stat(uuid, text, boolean) from public;
revoke all on function public.record_storefront_price_list_login(uuid, uuid, uuid) from public;
revoke all on function public.record_storefront_visit_hour(uuid, smallint) from public;
revoke all on function public.record_storefront_analytics(uuid, text, uuid, text) from public;
