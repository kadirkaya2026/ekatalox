select id, full_name, role, created_at
from public.profiles
where id in (
  '<SUPER_ADMIN_USER_ID>'::uuid,
  '<TENANT_ADMIN_USER_ID>'::uuid
);

select id, company_name, subdomain, status, plan, max_product_limit, whatsapp_number
from public.tenants
where subdomain = 'demo';

select tm.id, tm.tenant_id, tm.user_id, t.subdomain
from public.tenant_memberships tm
join public.tenants t on t.id = tm.tenant_id
where t.subdomain = 'demo';

select ac.password_code, pl.name as price_list_name, pl.is_catalog_only, t.subdomain
from public.access_codes ac
join public.tenants t on t.id = ac.tenant_id
join public.price_lists pl on pl.id = ac.price_list_id
where t.subdomain = 'demo'
order by pl.sort_order asc;