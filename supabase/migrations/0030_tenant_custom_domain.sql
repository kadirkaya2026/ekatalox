alter table public.tenants
  add column if not exists custom_domain text;

create unique index if not exists tenants_custom_domain_unique
  on public.tenants (lower(custom_domain))
  where custom_domain is not null;
