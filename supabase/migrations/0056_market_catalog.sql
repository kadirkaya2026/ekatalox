alter table public.tenants
  add column if not exists business_type text not null default 'general';

alter table public.tenants
  drop constraint if exists tenants_business_type_check;

alter table public.tenants
  add constraint tenants_business_type_check
  check (business_type in ('general', 'market'));

-- Tüm "market" tipi tenant'ların ürün sayfasına (stoğu kapalı olarak) tek
-- seferlik kopyalanabileceği, tek merkezi ürün+görsel havuzu. Görseller
-- kaynağın kendi CDN'inden (openfoodfacts) referans gösteriliyor, hiçbir
-- dosya bu projenin storage'ına yüklenmiyor — tenant başına depolama
-- maliyeti oluşmaz.
create table if not exists public.market_catalog_products (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'openfoodfacts',
  sku_code text not null,
  product_name text not null,
  brand text,
  category_name text not null,
  image_url text not null,
  created_at timestamptz not null default now(),
  unique (source, sku_code)
);

create index if not exists market_catalog_products_category_idx
  on public.market_catalog_products (category_name);

alter table public.market_catalog_products enable row level security;

drop policy if exists "super admin full access market catalog" on public.market_catalog_products;
create policy "super admin full access market catalog"
on public.market_catalog_products
for all
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "tenant admin read market catalog" on public.market_catalog_products;
create policy "tenant admin read market catalog"
on public.market_catalog_products
for select
using (true);
