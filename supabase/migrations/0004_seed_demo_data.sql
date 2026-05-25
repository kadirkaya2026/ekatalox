insert into public.tenants (
  id,
  company_name,
  subdomain,
  status,
  max_product_limit,
  whatsapp_number
)
values
  (
    'd5000000-0000-0000-0000-000000000001',
    'Lucatech İletişim',
    'lucatech',
    'active',
    300,
    '905354172510'
  )
on conflict (id) do nothing;

insert into public.products (
  id,
  tenant_id,
  sku_code,
  product_name,
  image_url,
  price_tier_1,
  price_tier_2,
  price_tier_3,
  is_in_stock
)
values
  (
    'd5000000-0000-0000-0000-000000000101',
    'd5000000-0000-0000-0000-000000000001',
    'APL-IPH-15-128',
    'iPhone 15 128GB',
    null,
    41250,
    41890,
    42390,
    true
  )
on conflict (id) do nothing;

insert into public.access_codes (
  id,
  tenant_id,
  password_code,
  price_tier_level
)
values
  (
    'd5000000-0000-0000-0000-000000000201',
    'd5000000-0000-0000-0000-000000000001',
    '1111',
    1
  ),
  (
    'd5000000-0000-0000-0000-000000000202',
    'd5000000-0000-0000-0000-000000000001',
    '2222',
    2
  ),
  (
    'd5000000-0000-0000-0000-000000000203',
    'd5000000-0000-0000-0000-000000000001',
    '3333',
    3
  )
on conflict (id) do nothing;