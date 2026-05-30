-- Lightweight storefront analytics: daily visitor keys + product counters (no raw event log)

create table if not exists public.storefront_analytics_visitors (
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  stat_date   date not null,
  visitor_key text not null,
  primary key (tenant_id, stat_date, visitor_key)
);

create table if not exists public.storefront_analytics_product_daily (
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  product_id     uuid not null references public.products(id) on delete cascade,
  stat_date      date not null,
  view_count     integer not null default 0 check (view_count >= 0),
  cart_add_count integer not null default 0 check (cart_add_count >= 0),
  primary key (tenant_id, product_id, stat_date)
);

create index if not exists storefront_analytics_visitors_tenant_date_idx
  on public.storefront_analytics_visitors (tenant_id, stat_date);

create index if not exists storefront_analytics_product_daily_tenant_date_idx
  on public.storefront_analytics_product_daily (tenant_id, stat_date);

alter table public.storefront_analytics_visitors enable row level security;
alter table public.storefront_analytics_product_daily enable row level security;

create policy "tenant admin read own analytics visitors"
  on public.storefront_analytics_visitors
  for select
  using (public.is_tenant_member(tenant_id));

create policy "tenant admin read own analytics product daily"
  on public.storefront_analytics_product_daily
  for select
  using (public.is_tenant_member(tenant_id));

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
begin
  if p_event = 'visit' then
    if p_visitor_key is null or length(trim(p_visitor_key)) = 0 then
      return;
    end if;

    insert into public.storefront_analytics_visitors (tenant_id, stat_date, visitor_key)
    values (p_tenant_id, v_stat_date, p_visitor_key)
    on conflict do nothing;

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
