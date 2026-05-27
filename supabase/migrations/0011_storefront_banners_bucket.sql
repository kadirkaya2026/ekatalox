insert into storage.buckets (id, name, public)
values ('storefront-banners', 'storefront-banners', true)
on conflict (id) do nothing;

create or replace function public.can_manage_storefront_banner_object(object_name text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.tenant_memberships
    join public.tenants
      on tenants.id = tenant_memberships.tenant_id
    where tenant_memberships.user_id = auth.uid()
      and tenant_memberships.tenant_id = public.storage_object_tenant_prefix(object_name)
      and tenants.status = 'active'
  );
$$;

drop policy if exists "public read storefront banners" on storage.objects;
create policy "public read storefront banners"
on storage.objects
for select
using (bucket_id = 'storefront-banners');

drop policy if exists "super admin manage storefront banners" on storage.objects;
create policy "super admin manage storefront banners"
on storage.objects
for all
using (
  bucket_id = 'storefront-banners'
  and public.is_super_admin()
)
with check (
  bucket_id = 'storefront-banners'
  and public.is_super_admin()
);

drop policy if exists "tenant admin insert own storefront banners" on storage.objects;
create policy "tenant admin insert own storefront banners"
on storage.objects
for insert
with check (
  bucket_id = 'storefront-banners'
  and public.can_manage_storefront_banner_object(name)
);

drop policy if exists "tenant admin update own storefront banners" on storage.objects;
create policy "tenant admin update own storefront banners"
on storage.objects
for update
using (
  bucket_id = 'storefront-banners'
  and public.can_manage_storefront_banner_object(name)
)
with check (
  bucket_id = 'storefront-banners'
  and public.can_manage_storefront_banner_object(name)
);

drop policy if exists "tenant admin delete own storefront banners" on storage.objects;
create policy "tenant admin delete own storefront banners"
on storage.objects
for delete
using (
  bucket_id = 'storefront-banners'
  and public.can_manage_storefront_banner_object(name)
);
