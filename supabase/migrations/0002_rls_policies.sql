alter table public.tenants enable row level security;
alter table public.products enable row level security;
alter table public.access_codes enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_memberships enable row level security;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.is_tenant_member(target_tenant uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.tenant_memberships
    where tenant_id = target_tenant
      and user_id = auth.uid()
  );
$$;

drop policy if exists "super admin full access tenants" on public.tenants;
create policy "super admin full access tenants"
on public.tenants
for all
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "tenant admin read own tenant" on public.tenants;
create policy "tenant admin read own tenant"
on public.tenants
for select
using (public.is_tenant_member(id));

drop policy if exists "super admin full access products" on public.products;
create policy "super admin full access products"
on public.products
for all
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "tenant admin manage own products" on public.products;
create policy "tenant admin manage own products"
on public.products
for all
using (public.is_tenant_member(tenant_id))
with check (public.is_tenant_member(tenant_id));

drop policy if exists "super admin full access access_codes" on public.access_codes;
create policy "super admin full access access_codes"
on public.access_codes
for all
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "tenant admin manage own access codes" on public.access_codes;
create policy "tenant admin manage own access codes"
on public.access_codes
for all
using (public.is_tenant_member(tenant_id))
with check (public.is_tenant_member(tenant_id));

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
on public.profiles
for select
using (id = auth.uid() or public.is_super_admin());

drop policy if exists "super admin manage profiles" on public.profiles;
create policy "super admin manage profiles"
on public.profiles
for all
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "super admin full access memberships" on public.tenant_memberships;
create policy "super admin full access memberships"
on public.tenant_memberships
for all
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "tenant admin read own membership" on public.tenant_memberships;
create policy "tenant admin read own membership"
on public.tenant_memberships
for select
using (user_id = auth.uid());