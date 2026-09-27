-- Özgün sektör vitrinleri; mevcut mağazalar kendiliğinden yeni tasarıma geçirilmez.
alter table public.tenant_storefront_settings add column if not exists sector_design jsonb;
create or replace function public.validate_sector_design() returns trigger
language plpgsql set search_path = public as $$
declare registered_sector text;
begin
  if new.sector_design is null then return new; end if;
  select sector into registered_sector from public.tenants where id = new.tenant_id;
  if registered_sector is distinct from 'telefon-aksesuar'
     or new.sector_design->>'version' is distinct from '1'
     or coalesce(new.sector_design->>'themeId', '') not in ('electronics-forma', 'electronics-akim', 'electronics-modul')
     or coalesce(new.sector_design->>'mode', '') not in ('retail', 'wholesale')
     or jsonb_typeof(new.sector_design->'content') is distinct from 'object' then
    raise exception 'Invalid design for registered tenant sector';
  end if;
  return new;
end;
$$;
drop trigger if exists check_sector_design on public.tenant_storefront_settings;
create trigger check_sector_design before insert or update of sector_design, tenant_id
on public.tenant_storefront_settings for each row execute function public.validate_sector_design();
