-- Çoklu baskı paketi ataması (süper admin, kullanıcı isteği 4 Eyl 2026).
--
-- assign_magnet_package (0101) tek paket alıyordu. Panel artık birden fazla
-- paketi (A01, A02, ...) seçip tek bayiye atayabiliyor. Yalnız SAHİPSİZ
-- (tenant_id is null) kodlara dokunur — başka bayiye atanmış kodlar olduğu
-- gibi kalır; panel atamadan ÖNCE bunları /package-preview ile gösterip
-- onay ister. for update skip locked: iki admin çakışmaz.
create or replace function public.assign_magnet_packages(
  p_tenant_id uuid,
  p_package_codes text[]
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assigned integer;
begin
  if p_tenant_id is null then
    raise exception 'bayi gerekli';
  end if;
  if p_package_codes is null or array_length(p_package_codes, 1) is null then
    raise exception 'en az bir paket kodu gerekli';
  end if;

  with secilen as (
    select id from public.magnet_codes
     where tenant_id is null
       and package_code = any (p_package_codes)
     for update skip locked
  )
  update public.magnet_codes c
     set tenant_id = p_tenant_id,
         assigned_at = now()
    from secilen
   where c.id = secilen.id;

  get diagnostics v_assigned = row_count;
  return v_assigned;
end;
$$;

revoke all on function public.assign_magnet_packages(uuid, text[]) from public;

notify pgrst, 'reload schema';
