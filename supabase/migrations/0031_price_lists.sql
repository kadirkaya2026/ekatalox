create table if not exists public.price_lists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  is_catalog_only boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint price_lists_name_not_blank check (char_length(trim(name)) > 0)
);

create unique index if not exists price_lists_tenant_catalog_only_idx
  on public.price_lists (tenant_id)
  where is_catalog_only;

create index if not exists price_lists_tenant_sort_idx
  on public.price_lists (tenant_id, sort_order, created_at);

create table if not exists public.product_prices (
  product_id uuid not null references public.products(id) on delete cascade,
  price_list_id uuid not null references public.price_lists(id) on delete cascade,
  price numeric(12, 2) not null default 0 check (price >= 0),
  primary key (product_id, price_list_id)
);

create index if not exists product_prices_price_list_id_idx
  on public.product_prices (price_list_id);

alter table public.access_codes
  add column if not exists price_list_id uuid references public.price_lists(id) on delete restrict;

do $$
declare
  tenant_row record;
  catalog_id uuid;
  tier1_id uuid;
  tier2_id uuid;
  tier3_id uuid;
begin
  for tenant_row in select id from public.tenants loop
    insert into public.price_lists (tenant_id, name, is_catalog_only, sort_order)
    values (tenant_row.id, 'Fiyatsız Katalog', true, 0)
    on conflict do nothing;

    select id into catalog_id
    from public.price_lists
    where tenant_id = tenant_row.id and is_catalog_only = true
    limit 1;

    if catalog_id is null then
      insert into public.price_lists (tenant_id, name, is_catalog_only, sort_order)
      values (tenant_row.id, 'Fiyatsız Katalog', true, 0)
      returning id into catalog_id;
    end if;

    insert into public.price_lists (tenant_id, name, is_catalog_only, sort_order)
    values
      (tenant_row.id, 'Perakende', false, 1),
      (tenant_row.id, 'Bayi 1', false, 2),
      (tenant_row.id, 'Bayi 2', false, 3)
    on conflict do nothing;

    select id into tier1_id
    from public.price_lists
    where tenant_id = tenant_row.id and is_catalog_only = false and sort_order = 1
    limit 1;

    select id into tier2_id
    from public.price_lists
    where tenant_id = tenant_row.id and is_catalog_only = false and sort_order = 2
    limit 1;

    select id into tier3_id
    from public.price_lists
    where tenant_id = tenant_row.id and is_catalog_only = false and sort_order = 3
    limit 1;

    insert into public.product_prices (product_id, price_list_id, price)
    select p.id, tier1_id, p.price_tier_1
    from public.products p
    where p.tenant_id = tenant_row.id
    on conflict (product_id, price_list_id) do update set price = excluded.price;

    insert into public.product_prices (product_id, price_list_id, price)
    select p.id, tier2_id, p.price_tier_2
    from public.products p
    where p.tenant_id = tenant_row.id
    on conflict (product_id, price_list_id) do update set price = excluded.price;

    insert into public.product_prices (product_id, price_list_id, price)
    select p.id, tier3_id, p.price_tier_3
    from public.products p
    where p.tenant_id = tenant_row.id
    on conflict (product_id, price_list_id) do update set price = excluded.price;

    update public.access_codes ac
    set price_list_id = case ac.price_tier_level
      when 1 then tier1_id
      when 2 then tier2_id
      when 3 then tier3_id
      else tier1_id
    end
    where ac.tenant_id = tenant_row.id
      and ac.price_list_id is null;
  end loop;
end $$;

alter table public.access_codes
  alter column price_list_id set not null;

alter table public.access_codes
  drop constraint if exists access_codes_price_tier_level_check;

alter table public.access_codes
  drop column if exists price_tier_level;

drop index if exists public.access_codes_tenant_level_idx;

create index if not exists access_codes_tenant_price_list_idx
  on public.access_codes (tenant_id, price_list_id);

alter table public.products
  drop column if exists price_tier_1;

alter table public.products
  drop column if exists price_tier_2;

alter table public.products
  drop column if exists price_tier_3;

alter table public.price_lists enable row level security;
alter table public.product_prices enable row level security;

create policy "Tenant admin can manage own price lists"
  on public.price_lists
  for all
  using (
    exists (
      select 1
      from public.tenant_memberships tm
      where tm.tenant_id = price_lists.tenant_id
        and tm.user_id = auth.uid()
    )
  );

create policy "Super admin can manage all price lists"
  on public.price_lists
  for all
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );

create policy "Tenant admin can manage own product prices"
  on public.product_prices
  for all
  using (
    exists (
      select 1
      from public.products pr
      join public.tenant_memberships tm on tm.tenant_id = pr.tenant_id
      where pr.id = product_prices.product_id
        and tm.user_id = auth.uid()
    )
  );

create policy "Super admin can manage all product prices"
  on public.product_prices
  for all
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );
