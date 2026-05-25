create or replace function public.is_reserved_subdomain(candidate text)
returns boolean
language sql
immutable
as $$
  select lower(trim(candidate)) = any (
    array['admin', 'app', 'www', 'api', 'ekatalox', 'assets']
  );
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tenants_subdomain_not_reserved'
  ) then
    alter table public.tenants
      add constraint tenants_subdomain_not_reserved
      check (not public.is_reserved_subdomain(subdomain));
  end if;
end $$;