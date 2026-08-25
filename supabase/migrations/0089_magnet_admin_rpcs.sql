-- Aralık ataması: havuzdaki sahipsiz kodlardan N tanesini tek ifadede bir
-- bayiye atar. 100 kod için 100 ayrı PATCH yerine tek çağrı.
--
-- for update skip locked: iki admin aynı anda atama yaparsa aynı kodları
-- paylaşamazlar — kilitli satırlar atlanır, herkes ayrı kod alır.
--
-- Kodlar created_at sırasıyla (en eski önce) seçilir: baskı partileri üretim
-- sırasına göre kutulandığı için "sıradaki kutuyu bu bayiye ver" akışıyla
-- birebir örtüşür.
create or replace function public.assign_free_magnet_codes(
  p_tenant_id uuid,
  p_count integer,
  p_label text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assigned integer;
begin
  if p_count is null or p_count < 1 or p_count > 5000 then
    raise exception 'count 1 ile 5000 arasinda olmali';
  end if;

  with secilen as (
    select id from public.magnet_codes
     where tenant_id is null
     order by created_at
     limit p_count
       for update skip locked
  )
  update public.magnet_codes c
     set tenant_id = p_tenant_id,
         assigned_at = now(),
         label = coalesce(p_label, c.label)
    from secilen
   where c.id = secilen.id;

  get diagnostics v_assigned = row_count;
  return v_assigned;
end;
$$;

revoke all on function public.assign_free_magnet_codes(uuid, integer, text) from public;

notify pgrst, 'reload schema';
