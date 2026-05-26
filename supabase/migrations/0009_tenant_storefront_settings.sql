create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.tenant_storefront_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  theme_key text not null default 'minimal'
    check (theme_key in ('minimal', 'premium-dark', 'soft-commerce')),
  logo_url text,
  storefront_title text,
  storefront_description text,
  hero_heading text,
  hero_cta_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists tenant_storefront_settings_set_updated_at
on public.tenant_storefront_settings;

create trigger tenant_storefront_settings_set_updated_at
before update on public.tenant_storefront_settings
for each row
execute function public.set_updated_at();

alter table public.tenant_storefront_settings enable row level security;

drop policy if exists "public read storefront settings" on public.tenant_storefront_settings;
create policy "public read storefront settings"
on public.tenant_storefront_settings
for select
using (true);

drop policy if exists "tenant admin insert own storefront settings" on public.tenant_storefront_settings;
create policy "tenant admin insert own storefront settings"
on public.tenant_storefront_settings
for insert
with check (
  exists (
    select 1
    from public.tenant_memberships
    where tenant_memberships.user_id = auth.uid()
      and tenant_memberships.tenant_id = tenant_storefront_settings.tenant_id
  )
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'tenant_admin'
  )
);

drop policy if exists "tenant admin update own storefront settings" on public.tenant_storefront_settings;
create policy "tenant admin update own storefront settings"
on public.tenant_storefront_settings
for update
using (
  exists (
    select 1
    from public.tenant_memberships
    where tenant_memberships.user_id = auth.uid()
      and tenant_memberships.tenant_id = tenant_storefront_settings.tenant_id
  )
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'tenant_admin'
  )
)
with check (
  exists (
    select 1
    from public.tenant_memberships
    where tenant_memberships.user_id = auth.uid()
      and tenant_memberships.tenant_id = tenant_storefront_settings.tenant_id
  )
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'tenant_admin'
  )
);

drop policy if exists "tenant admin delete own storefront settings" on public.tenant_storefront_settings;
create policy "tenant admin delete own storefront settings"
on public.tenant_storefront_settings
for delete
using (
  exists (
    select 1
    from public.tenant_memberships
    where tenant_memberships.user_id = auth.uid()
      and tenant_memberships.tenant_id = tenant_storefront_settings.tenant_id
  )
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'tenant_admin'
  )
);