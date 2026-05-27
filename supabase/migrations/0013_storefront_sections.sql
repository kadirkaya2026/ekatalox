-- Storefront sections: named product showcases on the homepage (max 3 per tenant)
create table if not exists public.storefront_sections (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  title         text not null,
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

-- Products assigned to a section
create table if not exists public.storefront_section_products (
  id            uuid primary key default gen_random_uuid(),
  section_id    uuid not null references public.storefront_sections(id) on delete cascade,
  product_id    uuid not null references public.products(id) on delete cascade,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (section_id, product_id)
);

-- Indexes
create index if not exists storefront_sections_tenant_id_idx
  on public.storefront_sections(tenant_id);

create index if not exists storefront_section_products_section_id_idx
  on public.storefront_section_products(section_id);

-- RLS
alter table public.storefront_sections enable row level security;
alter table public.storefront_section_products enable row level security;

-- storefront_sections policies
create policy "Tenant admin can manage own sections"
  on public.storefront_sections
  for all
  using (
    exists (
      select 1 from public.tenant_memberships tm
      join public.profiles p on p.id = tm.user_id
      where tm.tenant_id = storefront_sections.tenant_id
        and tm.user_id = auth.uid()
        and p.role = 'tenant_admin'
    )
  );

create policy "Super admin can manage all sections"
  on public.storefront_sections
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

create policy "Public can read sections"
  on public.storefront_sections
  for select
  using (true);

-- storefront_section_products policies
create policy "Tenant admin can manage own section products"
  on public.storefront_section_products
  for all
  using (
    exists (
      select 1 from public.storefront_sections ss
      join public.tenant_memberships tm on tm.tenant_id = ss.tenant_id
      join public.profiles p on p.id = tm.user_id
      where ss.id = storefront_section_products.section_id
        and tm.user_id = auth.uid()
        and p.role = 'tenant_admin'
    )
  );

create policy "Super admin can manage all section products"
  on public.storefront_section_products
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

create policy "Public can read section products"
  on public.storefront_section_products
  for select
  using (true);
