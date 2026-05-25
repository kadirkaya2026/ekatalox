alter table storage.objects enable row level security;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create or replace function public.storage_object_tenant_prefix(object_name text)
returns uuid
language sql
stable
as $$
  select nullif((storage.foldername(object_name))[1], '')::uuid;
$$;

create or replace function public.can_manage_product_image_object(object_name text)
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

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images"
on storage.objects
for select
using (bucket_id = 'product-images');

drop policy if exists "super admin manage product images" on storage.objects;
create policy "super admin manage product images"
on storage.objects
for all
using (
  bucket_id = 'product-images'
  and public.is_super_admin()
)
with check (
  bucket_id = 'product-images'
  and public.is_super_admin()
);

drop policy if exists "tenant admin insert own product images" on storage.objects;
create policy "tenant admin insert own product images"
on storage.objects
for insert
with check (
  bucket_id = 'product-images'
  and public.can_manage_product_image_object(name)
);

drop policy if exists "tenant admin update own product images" on storage.objects;
create policy "tenant admin update own product images"
on storage.objects
for update
using (
  bucket_id = 'product-images'
  and public.can_manage_product_image_object(name)
)
with check (
  bucket_id = 'product-images'
  and public.can_manage_product_image_object(name)
);

drop policy if exists "tenant admin delete own product images" on storage.objects;
create policy "tenant admin delete own product images"
on storage.objects
for delete
using (
  bucket_id = 'product-images'
  and public.can_manage_product_image_object(name)
);