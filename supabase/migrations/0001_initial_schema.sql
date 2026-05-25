create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  subdomain text not null unique,
  status text not null default 'active' check (status in ('active', 'suspended')),
  max_product_limit integer not null check (max_product_limit in (300, 500, 1000)),
  whatsapp_number text not null,
  created_at timestamptz not null default now(),
  constraint tenants_subdomain_format check (subdomain ~ '^[a-z0-9-]+$')
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sku_code text not null,
  product_name text not null,
  image_url text,
  price_tier_1 numeric(12, 2) not null default 0 check (price_tier_1 >= 0),
  price_tier_2 numeric(12, 2) not null default 0 check (price_tier_2 >= 0),
  price_tier_3 numeric(12, 2) not null default 0 check (price_tier_3 >= 0),
  is_in_stock boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, sku_code)
);

create index if not exists products_tenant_id_idx on public.products (tenant_id);

create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  password_code text not null,
  price_tier_level integer not null check (price_tier_level in (1, 2, 3)),
  created_at timestamptz not null default now(),
  unique (tenant_id, password_code)
);

create index if not exists access_codes_tenant_level_idx
  on public.access_codes (tenant_id, price_tier_level);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in ('super_admin', 'tenant_admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists tenant_memberships_user_id_idx
  on public.tenant_memberships (user_id);