create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  model_name text not null,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  package_quantity integer check (package_quantity is null or package_quantity > 0),
  carton_quantity integer check (carton_quantity is null or carton_quantity > 0),
  is_available_for_sale boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, model_name)
);

with ranked_variants as (
  select
    id,
    row_number() over (
      partition by product_id
      order by created_at asc, id asc
    ) as next_display_order
  from public.product_variants
)
update public.product_variants pv
set display_order = ranked_variants.next_display_order
from ranked_variants
where ranked_variants.id = pv.id
  and pv.display_order = 0;

create index if not exists product_variants_tenant_id_idx
  on public.product_variants (tenant_id);

create index if not exists product_variants_product_order_idx
  on public.product_variants (product_id, display_order);

alter table public.product_variants enable row level security;

drop policy if exists "super admin full access product variants" on public.product_variants;
create policy "super admin full access product variants"
on public.product_variants
for all
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "tenant admin manage own product variants" on public.product_variants;
create policy "tenant admin manage own product variants"
on public.product_variants
for all
using (public.is_tenant_member(tenant_id))
with check (public.is_tenant_member(tenant_id));