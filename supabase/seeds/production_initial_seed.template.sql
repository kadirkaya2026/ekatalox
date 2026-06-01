-- Production seed template: run after 0031_price_lists migration.
-- Price lists are created by migration backfill; access codes reference price_list_id.

begin;

insert into public.profiles (id, full_name, role)
values
  ('<SUPER_ADMIN_USER_ID>'::uuid, 'Merkezi Super Admin', 'super_admin'),
  ('<TENANT_ADMIN_USER_ID>'::uuid, 'Demo Tenant Admin', 'tenant_admin')
on conflict (id) do update
set
  full_name = excluded.full_name,
  role = excluded.role;

with upserted_tenant as (
  insert into public.tenants (
    company_name,
    subdomain,
    status,
    plan,
    max_product_limit,
    whatsapp_number
  )
  values (
    'Demo Tenant',
    'demo',
    'active',
    'baslangic',
    500,
    '905354172510'
  )
  on conflict (subdomain) do update
  set
    company_name = excluded.company_name,
    status = excluded.status,
    plan = excluded.plan,
    max_product_limit = excluded.max_product_limit,
    whatsapp_number = excluded.whatsapp_number
  returning id
), resolved_tenant as (
  select id
  from upserted_tenant
  union all
  select tenants.id
  from public.tenants as tenants
  where tenants.subdomain = 'demo'
    and not exists (select 1 from upserted_tenant)
)
insert into public.tenant_memberships (tenant_id, user_id)
select id, '<TENANT_ADMIN_USER_ID>'::uuid
from resolved_tenant
on conflict (tenant_id, user_id) do nothing;

with resolved_tenant as (
  select id
  from public.tenants
  where subdomain = 'demo'
), tier1 as (
  select pl.id
  from public.price_lists pl
  join resolved_tenant rt on rt.id = pl.tenant_id
  where pl.is_catalog_only = false and pl.sort_order = 1
  limit 1
), tier2 as (
  select pl.id
  from public.price_lists pl
  join resolved_tenant rt on rt.id = pl.tenant_id
  where pl.is_catalog_only = false and pl.sort_order = 2
  limit 1
), tier3 as (
  select pl.id
  from public.price_lists pl
  join resolved_tenant rt on rt.id = pl.tenant_id
  where pl.is_catalog_only = false and pl.sort_order = 3
  limit 1
)
insert into public.access_codes (
  tenant_id,
  password_code,
  price_list_id
)
select
  resolved_tenant.id,
  access_code.password_code,
  access_code.price_list_id
from resolved_tenant
cross join (
  select '1111'::text as password_code, (select id from tier1) as price_list_id
  union all
  select '2222', (select id from tier2)
  union all
  select '3333', (select id from tier3)
) as access_code
where access_code.price_list_id is not null
on conflict (tenant_id, password_code) do update
set
  price_list_id = excluded.price_list_id;

commit;
