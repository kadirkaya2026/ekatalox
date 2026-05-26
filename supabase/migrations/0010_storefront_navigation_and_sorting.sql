alter table public.categories
  add column if not exists parent_id uuid references public.categories(id) on delete set null,
  add column if not exists display_order integer not null default 0;

with ranked_categories as (
  select
    id,
    row_number() over (
      partition by tenant_id
      order by created_at asc, id asc
    ) as next_display_order
  from public.categories
)
update public.categories c
set display_order = ranked_categories.next_display_order
from ranked_categories
where ranked_categories.id = c.id
  and c.display_order = 0;

create index if not exists categories_tenant_parent_order_idx
  on public.categories (tenant_id, parent_id, display_order);

alter table public.products
  add column if not exists display_order integer not null default 0;

with ranked_products as (
  select
    id,
    row_number() over (
      partition by tenant_id
      order by created_at desc, id asc
    ) as next_display_order
  from public.products
)
update public.products p
set display_order = ranked_products.next_display_order
from ranked_products
where ranked_products.id = p.id
  and p.display_order = 0;

create index if not exists products_tenant_display_order_idx
  on public.products (tenant_id, display_order);

alter table public.tenant_storefront_settings
  add column if not exists banner_items jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tenant_storefront_settings_banner_items_array_check'
  ) then
    alter table public.tenant_storefront_settings
      add constraint tenant_storefront_settings_banner_items_array_check
      check (jsonb_typeof(banner_items) = 'array');
  end if;
end $$;