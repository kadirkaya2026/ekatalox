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
    max_product_limit,
    whatsapp_number
  )
  values (
    'Demo Tenant',
    'demo',
    'active',
    300,
    '905354172510'
  )
  on conflict (subdomain) do update
  set
    company_name = excluded.company_name,
    status = excluded.status,
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
)
insert into public.access_codes (
  tenant_id,
  password_code,
  price_tier_level
)
select
  resolved_tenant.id,
  access_code.password_code,
  access_code.price_tier_level
from resolved_tenant
cross join (
  values
    ('1111', 1),
    ('2222', 2),
    ('3333', 3)
) as access_code(password_code, price_tier_level)
on conflict (tenant_id, password_code) do update
set
  price_tier_level = excluded.price_tier_level;

commit;