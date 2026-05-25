create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create index if not exists categories_tenant_id_idx
  on public.categories (tenant_id);

insert into public.categories (tenant_id, name)
select t.id, 'Genel'
from public.tenants t
where not exists (
  select 1
  from public.categories c
  where c.tenant_id = t.id
    and c.name = 'Genel'
);

alter table public.products
  add column if not exists category_id uuid references public.categories(id) on delete restrict;

update public.products p
set category_id = c.id
from public.categories c
where c.tenant_id = p.tenant_id
  and c.name = 'Genel'
  and p.category_id is null;

alter table public.products
  alter column category_id set not null;

create index if not exists products_category_id_idx
  on public.products (category_id);

alter table public.categories enable row level security;

drop policy if exists "super admin full access categories" on public.categories;
create policy "super admin full access categories"
on public.categories
for all
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "tenant admin manage own categories" on public.categories;
create policy "tenant admin manage own categories"
on public.categories
for all
using (public.is_tenant_member(tenant_id))
with check (public.is_tenant_member(tenant_id));